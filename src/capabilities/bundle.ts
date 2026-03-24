import fs from "node:fs/promises";
import path from "node:path";
import { resolveDefaultAgentId } from "../agents/agent-scope.js";
import { installSkill } from "../agents/skills-install.js";
import { hasBinary } from "../agents/skills.js";
import { buildWorkspaceSkillStatus, type SkillStatusEntry } from "../agents/skills-status.js";
import type { VikiClowConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import { writeNativeVikiBrowserProof } from "../browser/native-proof.js";
import { resolveMemoryBackendConfig } from "../memory/backend-config.js";
import { writeGraphitiBackboneProof } from "../memory/graphiti-backbone.js";
import { enablePluginInConfig } from "../plugins/enable.js";
import { loadPluginManifestRegistry, type PluginManifestRecord } from "../plugins/manifest-registry.js";
import { applyExclusiveSlotSelection } from "../plugins/slots.js";
import { resolveConfigDir } from "../utils.js";
import { writeVoiceBootstrapProof } from "../voice/bootstrap-proof.js";
import { ensureVoiceRuntimeBootstrap, type VoiceRuntimeBootstrapStatus } from "../voice/runtime-bootstrap.js";
import { ensureBaseCapabilityPack } from "./runtime.js";
import type { CapabilityPlan } from "./types.js";

export type BundledSkillStatus = "ready" | "installed" | "available" | "skipped" | "failed";
export type BundledPluginStatus = "enabled" | "available" | "skipped" | "failed";

export type BundledSkillInventoryEntry = {
  name: string;
  status: BundledSkillStatus;
  source: string;
  path: string;
  sourceRepo: string;
  installLabels: string[];
  reason?: string;
};

export type BundledPluginInventoryEntry = {
  id: string;
  name: string;
  status: BundledPluginStatus;
  kind?: string;
  source: string;
  path: string;
  sourceRepo: string;
  reason?: string;
};

export type CapabilityBundleInventory = {
  version: 1;
  generatedAt: string;
  workspaceDir: string;
  manifestPath: string;
  markdownPath: string;
  capabilityPlan: CapabilityPlan;
  voice: VoiceRuntimeBootstrapStatus & {
    sourceProofPath?: string;
    sourceMarkdownPath?: string;
  };
  browser: {
    nativeProofPath: string;
    manifestPresent: boolean;
    passed: boolean;
  };
  memory: {
    graphitiProofPath: string;
    delegatedBackend?: string;
  };
  plugins: BundledPluginInventoryEntry[];
  skills: BundledSkillInventoryEntry[];
  sourceRepos: Array<{ kind: "skill" | "plugin" | "asset"; id: string; repo: string }>;
  summary: {
    enabledPlugins: number;
    installedSkills: number;
    readySkills: number;
    skippedSkills: number;
    failedSkills: number;
  };
};

export type BundleSupportedCapabilitiesResult = {
  config: VikiClowConfig;
  inventory: CapabilityBundleInventory;
};

const AUTO_ENABLE_PLUGIN_IDS = new Set([
  "device-pair",
  "phone-control",
  "talk-voice",
  "memory-core",
  "diffs",
  "open-prose",
  "thread-ownership",
  "llm-task",
  "lobster",
]);

const PREFERRED_BUNDLED_SKILLS = new Set([
  "vikiclow-skills",
  "mcporter",
  "sherpa-onnx-tts",
  "openai-whisper",
]);

const MANDATORY_VOICE_BUNDLED_SKILLS = new Set(["sherpa-onnx-tts", "openai-whisper"]);

function repoUrlFor(kind: "skill" | "plugin", id: string): string {
  const base = kind === "skill" ? "skills" : "extensions";
  return `https://github.com/vikiclow/vikiclow/tree/main/${base}/${id}`;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function copyIfPresent(sourcePath: string, destPath: string): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(sourcePath, "utf8");
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, raw, "utf8");
    return destPath;
  } catch {
    return undefined;
  }
}

function resolveAutomaticInstallKinds(): Set<string> {
  const kinds = new Set<string>(["node", "download"]);
  if (hasBinary("uv") || hasBinary("brew")) {
    kinds.add("uv");
  }
  if (hasBinary("brew")) {
    kinds.add("brew");
  }
  if (hasBinary("go")) {
    kinds.add("go");
  }
  return kinds;
}

function supportsAutomaticInstall(skill: SkillStatusEntry): boolean {
  if (skill.disabled || skill.blockedByAllowlist || skill.missing.os.length > 0) {
    return false;
  }
  const allowedKinds = resolveAutomaticInstallKinds();
  if (PREFERRED_BUNDLED_SKILLS.has(skill.name)) {
    return skill.install.some((option) => allowedKinds.has(option.kind));
  }
  return skill.install.some((option) => allowedKinds.has(option.kind));
}

function installIdsForSkill(skill: SkillStatusEntry): string[] {
  const allowedKinds = resolveAutomaticInstallKinds();
  const filtered = skill.install.filter((option) => allowedKinds.has(option.kind));
  if (filtered.length === 0) {
    return [];
  }
  if (filtered.every((option) => option.kind === "download")) {
    return filtered.map((option) => option.id);
  }
  return [filtered[0].id];
}

function upsertSkillEnv(
  cfg: VikiClowConfig,
  skillKey: string,
  envPatch: Record<string, string>,
): VikiClowConfig {
  const existing = cfg.skills?.entries?.[skillKey] ?? {};
  return {
    ...cfg,
    skills: {
      ...cfg.skills,
      entries: {
        ...cfg.skills?.entries,
        [skillKey]: {
          ...existing,
          env: {
            ...(existing.env ?? {}),
            ...envPatch,
          },
        },
      },
    },
  };
}

function patchSherpaConfig(cfg: VikiClowConfig): VikiClowConfig {
  const configDir = resolveConfigDir();
  return upsertSkillEnv(cfg, "sherpa-onnx-tts", {
    SHERPA_ONNX_RUNTIME_DIR: path.join(configDir, "tools", "sherpa-onnx-tts", "runtime"),
    SHERPA_ONNX_MODEL_DIR: path.join(
      configDir,
      "tools",
      "sherpa-onnx-tts",
      "models",
      "vits-piper-en_US-lessac-high",
    ),
  });
}

function patchWhisperConfig(cfg: VikiClowConfig): VikiClowConfig {
  const existing = cfg.skills?.entries?.["openai-whisper"]?.env?.WHISPER_MODEL;
  if (typeof existing === "string" && existing.trim()) {
    return cfg;
  }
  return upsertSkillEnv(cfg, "openai-whisper", {
    WHISPER_MODEL: "turbo",
  });
}

function describePluginSkip(plugin: PluginManifestRecord): string {
  if (plugin.id === "voice-call") {
    return "requires telephony provider credentials";
  }
  if (plugin.id === "memory-lancedb") {
    return "optional memory slot kept disabled until selected";
  }
  if (plugin.channels.length > 0) {
    return "requires channel credentials or a paired account";
  }
  if (plugin.providers.length > 0) {
    return "requires a configured provider or auth profile";
  }
  return "bundled and available without pre-enabling";
}

function formatMissingSkillReason(skill: SkillStatusEntry): string {
  const parts: string[] = [];
  if (skill.missing.bins.length > 0) {
    parts.push(`missing bins: ${skill.missing.bins.join(", ")}`);
  }
  if (skill.missing.env.length > 0) {
    parts.push(`missing env: ${skill.missing.env.join(", ")}`);
  }
  if (skill.missing.config.length > 0) {
    parts.push(`missing config: ${skill.missing.config.join(", ")}`);
  }
  if (skill.missing.os.length > 0) {
    parts.push(`unsupported OS: ${skill.missing.os.join(", ")}`);
  }
  return parts.join("; ") || "not ready";
}

async function collectBundledSkillInventory(params: {
  workspaceDir: string;
  cfg: VikiClowConfig;
  autoInstall: boolean;
}): Promise<{
  config: VikiClowConfig;
  entries: BundledSkillInventoryEntry[];
  sourceRepos: CapabilityBundleInventory["sourceRepos"];
}> {
  let nextConfig = params.cfg;
  const report = buildWorkspaceSkillStatus(params.workspaceDir, { config: nextConfig });
  const entries: BundledSkillInventoryEntry[] = [];
  const sourceRepos: CapabilityBundleInventory["sourceRepos"] = [];

  for (const skill of report.skills.filter((entry) => entry.bundled)) {
    const repoId = skill.name === "vikiclow-skills" ? "clawhub" : skill.name;
    const sourceRepo = repoUrlFor("skill", repoId);
    sourceRepos.push({
      kind: "skill",
      id: skill.name,
      repo: sourceRepo,
    });
    if (skill.eligible) {
      entries.push({
        name: skill.name,
        status: "ready",
        source: skill.source,
        path: skill.filePath,
        sourceRepo,
        installLabels: skill.install.map((option) => option.label),
      });
      continue;
    }

    const shouldAutoInstall =
      params.autoInstall || MANDATORY_VOICE_BUNDLED_SKILLS.has(skill.name);
    if (!shouldAutoInstall || !supportsAutomaticInstall(skill)) {
      entries.push({
        name: skill.name,
        status: skill.install.length > 0 ? "available" : "skipped",
        source: skill.source,
        path: skill.filePath,
        sourceRepo,
        installLabels: skill.install.map((option) => option.label),
        reason: formatMissingSkillReason(skill),
      });
      continue;
    }

    let failedReason: string | undefined;
    for (const installId of installIdsForSkill(skill)) {
      const result = await installSkill({
        workspaceDir: params.workspaceDir,
        skillName: skill.name,
        installId,
        config: nextConfig,
      });
      if (!result.ok) {
        failedReason = result.message;
        break;
      }
    }
    if (!failedReason && skill.name === "sherpa-onnx-tts") {
      nextConfig = patchSherpaConfig(nextConfig);
      sourceRepos.push({
        kind: "asset",
        id: "sherpa-onnx",
        repo: "https://github.com/k2-fsa/sherpa-onnx/releases",
      });
    }
    if (!failedReason && skill.name === "openai-whisper") {
      nextConfig = patchWhisperConfig(nextConfig);
    }
    entries.push({
      name: skill.name,
      status: failedReason ? "failed" : "installed",
      source: skill.source,
      path: skill.filePath,
      sourceRepo,
      installLabels: skill.install.map((option) => option.label),
      reason: failedReason,
    });
  }

  return { config: nextConfig, entries, sourceRepos };
}

function enableBundledPlugins(
  cfg: VikiClowConfig,
  registry: ReturnType<typeof loadPluginManifestRegistry>,
): {
  config: VikiClowConfig;
  entries: BundledPluginInventoryEntry[];
  sourceRepos: CapabilityBundleInventory["sourceRepos"];
} {
  let nextConfig = cfg;
  const entries: BundledPluginInventoryEntry[] = [];
  const sourceRepos: CapabilityBundleInventory["sourceRepos"] = [];
  const slotRegistry = {
    plugins: registry.plugins.map((plugin) => ({ id: plugin.id, kind: plugin.kind })),
  };

  for (const plugin of registry.plugins.filter((record) => record.origin === "bundled")) {
    const sourceRepo = repoUrlFor("plugin", plugin.id);
    sourceRepos.push({
      kind: "plugin",
      id: plugin.id,
      repo: sourceRepo,
    });
    if (AUTO_ENABLE_PLUGIN_IDS.has(plugin.id)) {
      const enabled = enablePluginInConfig(nextConfig, plugin.id);
      nextConfig = enabled.config;
      if (plugin.kind) {
        nextConfig = applyExclusiveSlotSelection({
          config: nextConfig,
          selectedId: plugin.id,
          selectedKind: plugin.kind,
          registry: slotRegistry,
        }).config;
      }
      entries.push({
        id: plugin.id,
        name: plugin.name ?? plugin.id,
        status: enabled.enabled ? "enabled" : "failed",
        kind: plugin.kind,
        source: plugin.source,
        path: plugin.rootDir,
        sourceRepo,
        reason: enabled.reason,
      });
      continue;
    }
    entries.push({
      id: plugin.id,
      name: plugin.name ?? plugin.id,
      status: "skipped",
      kind: plugin.kind,
      source: plugin.source,
      path: plugin.rootDir,
      sourceRepo,
      reason: describePluginSkip(plugin),
    });
  }

  return { config: nextConfig, entries, sourceRepos };
}

export async function bundleSupportedCapabilities(params: {
  workspaceDir: string;
  config: VikiClowConfig;
  autoInstall?: boolean;
  env?: NodeJS.ProcessEnv;
  rootDir?: string;
  artifactDir?: string;
}): Promise<BundleSupportedCapabilitiesResult> {
  const env = params.env ?? process.env;
  const rootDir = params.rootDir ?? process.cwd();
  const autoInstall = params.autoInstall !== false;
  let nextConfig = params.config;
  const capabilityPlan = await ensureBaseCapabilityPack({
    workspaceDir: params.workspaceDir,
    env,
    autoInstall,
  });
  const registry = loadPluginManifestRegistry({
    config: nextConfig,
    workspaceDir: params.workspaceDir,
  });
  const pluginBundle = enableBundledPlugins(nextConfig, registry);
  nextConfig = pluginBundle.config;
  const skillBundle = await collectBundledSkillInventory({
    workspaceDir: params.workspaceDir,
    cfg: nextConfig,
    autoInstall,
  });
  nextConfig = skillBundle.config;

  const voice = await ensureVoiceRuntimeBootstrap({ cfg: nextConfig, env });
  const browserProof = await writeNativeVikiBrowserProof({ rootDir, env });
  const agentId = resolveDefaultAgentId(nextConfig);
  const memoryConfig = resolveMemoryBackendConfig({
    cfg: nextConfig,
    agentId,
  }).graphiti;
  const graphitiProof = await writeGraphitiBackboneProof({
    agentId,
    config: memoryConfig,
    env,
    delegatedBackend: memoryConfig?.neo4jUri ? "neo4j-or-shadow" : "local-shadow",
    lastSyncReason: "capability-bundle",
  });

  let sourceProofPath: string | undefined;
  let sourceMarkdownPath: string | undefined;
  try {
    const sourceProof = await writeVoiceBootstrapProof(
      rootDir,
      path.join(resolveStateDir(env), "voice-proof"),
    );
    sourceProofPath = sourceProof.jsonPath;
    sourceMarkdownPath = sourceProof.mdPath;
  } catch {
    // Installed npm builds do not ship the source tree walked by this proof.
  }

  const baseDir = path.join(resolveStateDir(env), "capabilities");
  const manifestPath = path.join(baseDir, "bundle-inventory.json");
  const markdownPath = path.join(baseDir, "bundle-inventory.md");
  const inventory: CapabilityBundleInventory = {
    version: 1,
    generatedAt: new Date().toISOString(),
    workspaceDir: params.workspaceDir,
    manifestPath,
    markdownPath,
    capabilityPlan,
    voice: {
      ...voice,
      sourceProofPath,
      sourceMarkdownPath,
    },
    browser: {
      nativeProofPath: browserProof.jsonPath,
      manifestPresent: browserProof.proof.manifestPresent,
      passed: browserProof.proof.passed,
    },
    memory: {
      graphitiProofPath: graphitiProof.paths.proofPath,
      delegatedBackend: graphitiProof.delegatedBackend,
    },
    plugins: pluginBundle.entries,
    skills: skillBundle.entries,
    sourceRepos: [...pluginBundle.sourceRepos, ...skillBundle.sourceRepos],
    summary: {
      enabledPlugins: pluginBundle.entries.filter((entry) => entry.status === "enabled").length,
      installedSkills: skillBundle.entries.filter((entry) => entry.status === "installed").length,
      readySkills: skillBundle.entries.filter((entry) => entry.status === "ready").length,
      skippedSkills: skillBundle.entries.filter((entry) => entry.status === "skipped").length,
      failedSkills: skillBundle.entries.filter((entry) => entry.status === "failed").length,
    },
  };
  await writeJson(manifestPath, inventory);
  const markdown = [
    "# VikiClow Bundled Capability Inventory",
    "",
    `- Generated at: \`${inventory.generatedAt}\``,
    `- Workspace: \`${inventory.workspaceDir}\``,
    `- Enabled plugins: \`${inventory.summary.enabledPlugins}\``,
    `- Installed skills: \`${inventory.summary.installedSkills}\``,
    `- Ready bundled skills: \`${inventory.summary.readySkills}\``,
    "",
    "## Voice",
    "",
    `- Ready: \`${inventory.voice.ready}\``,
    `- Runtime manifest: \`${inventory.voice.manifestPath}\``,
    ...(inventory.voice.sourceProofPath ? [`- Source proof: \`${inventory.voice.sourceProofPath}\``] : []),
    "",
    "## Browser",
    "",
    `- Native proof: \`${inventory.browser.nativeProofPath}\``,
    `- browserd manifest present: \`${inventory.browser.manifestPresent}\``,
    "",
    "## Memory",
    "",
    `- Graphiti proof: \`${inventory.memory.graphitiProofPath}\``,
    `- Delegated backend: \`${inventory.memory.delegatedBackend ?? "local-shadow"}\``,
    "",
    "## Enabled Plugins",
    "",
    ...inventory.plugins
      .filter((entry) => entry.status === "enabled")
      .map((entry) => `- \`${entry.id}\` — ${entry.name}`),
    "",
    "## Bundled Skills",
    "",
    ...inventory.skills.map(
      (entry) =>
        `- \`${entry.name}\` — ${entry.status}${entry.reason ? ` (${entry.reason})` : ""}`,
    ),
    "",
  ].join("\n");
  await fs.writeFile(markdownPath, `${markdown}\n`, "utf8");

  if (params.artifactDir) {
    await fs.mkdir(params.artifactDir, { recursive: true });
    await copyIfPresent(manifestPath, path.join(params.artifactDir, "bundle-inventory.json"));
    await copyIfPresent(markdownPath, path.join(params.artifactDir, "bundle-inventory.md"));
  }

  return {
    config: nextConfig,
    inventory,
  };
}
