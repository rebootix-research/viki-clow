import fs from "node:fs/promises";
import path from "node:path";
import { resolveDefaultAgentId } from "../agents/agent-scope.js";
import { installSkill } from "../agents/skills-install.js";
import { buildWorkspaceSkillStatus, type SkillStatusEntry } from "../agents/skills-status.js";
import { hasBinary } from "../agents/skills.js";
import { writeNativeVikiBrowserProof } from "../browser/native-proof.js";
import type { VikiClowConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import { resolveMemoryBackendConfig } from "../memory/backend-config.js";
import { writeGraphitiBackboneProof } from "../memory/graphiti-backbone.js";
import { enablePluginInConfig } from "../plugins/enable.js";
import {
  loadPluginManifestRegistry,
  type PluginManifestRecord,
} from "../plugins/manifest-registry.js";
import { applyExclusiveSlotSelection } from "../plugins/slots.js";
import { resolveConfigDir } from "../utils.js";
import {
  CAPABILITY_FOUNDRY_READY_CAPABILITIES,
  CAPABILITY_FOUNDRY_SOURCE_CATALOG_REVISION,
  CAPABILITY_FOUNDRY_SOURCE_FAMILIES,
  type FoundryCatalogFamily,
  type FoundryCatalogReadyCapability,
  loadApprovedFoundryCatalog,
} from "./foundry-catalog.js";
import { writeVoiceBootstrapProof } from "../voice/bootstrap-proof.js";
import {
  ensureVoiceRuntimeBootstrap,
  type VoiceRuntimeBootstrapStatus,
} from "../voice/runtime-bootstrap.js";
import { ensureBaseCapabilityPack } from "./runtime.js";
import type {
  CapabilityFoundryCandidate,
  CapabilityFoundryRegistry,
  CapabilityFoundryRoute,
  CapabilityPlan,
} from "./types.js";

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
  sourceCatalogPath: string;
  sourceCatalogMarkdownPath: string;
  bundleReceiptsPath: string;
  bundleReceiptsMarkdownPath: string;
  capabilityPlan: CapabilityPlan;
  sourceCatalog: {
    revision: string;
    approvedSources: number;
    families: Array<
      FoundryCatalogFamily & {
        sourceCount: number;
        bundledCount: number;
      }
    >;
  };
  bundleReceipts: Array<{
    kind: "bootstrap" | "voice" | "browser" | "memory" | "plugin" | "skill" | "foundry";
    target: string;
    status: "ready" | "installed" | "enabled" | "copied" | "refreshed" | "skipped" | "failed";
    summary: string;
    proofPath?: string;
    sourceRepo?: string;
    recipe?: string;
  }>;
  readyCapabilities: Array<
    FoundryCatalogReadyCapability & {
      status: "ready" | "installed" | "enabled" | "bundled";
      proof?: string;
    }
  >;
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
  foundry: {
    registryPath: string;
    supportedSources: string[];
    sourceCatalogRevision: string;
    discovered: number;
    promoted: number;
    bundled: number;
    rejected: number;
    routes: CapabilityFoundryRoute[];
    registry: CapabilityFoundryRegistry;
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
  "workflow",
]);

const PREFERRED_BUNDLED_SKILLS = new Set([
  "vikiclow-skills",
  "mcporter",
  "sherpa-onnx-tts",
  "openai-whisper",
]);

const MANDATORY_VOICE_BUNDLED_SKILLS = new Set(["sherpa-onnx-tts", "openai-whisper"]);

function buildSourceCatalog() {
  return {
    revision: CAPABILITY_FOUNDRY_SOURCE_CATALOG_REVISION,
    approvedSources: CAPABILITY_FOUNDRY_SOURCE_FAMILIES.reduce(
      (count, family) => count + family.sources.length,
      0,
    ),
    families: CAPABILITY_FOUNDRY_SOURCE_FAMILIES.map((family) => ({
      ...family,
      sourceCount: family.sources.length,
      bundledCount: family.sources.filter((source) => source.bundled).length,
    })),
  };
}

function buildBundleReceipts(params: {
  pluginEntries: BundledPluginInventoryEntry[];
  skillEntries: BundledSkillInventoryEntry[];
  voice: VoiceRuntimeBootstrapStatus;
  browserProofPath: string;
  graphitiProofPath: string;
  foundryRegistryPath: string;
  foundryDiscovered: number;
  foundryPromoted: number;
  foundryBundled: number;
  foundryRejected: number;
}) {
  const receipts: CapabilityBundleInventory["bundleReceipts"] = [
    {
      kind: "bootstrap",
      target: "base-capability-pack",
      status: "refreshed",
      summary: "Bootstrap capabilities checked and persisted for the workspace.",
      proofPath: params.foundryRegistryPath,
    },
    {
      kind: "voice",
      target: "voice-runtime",
      status: params.voice.ready ? "ready" : "skipped",
      summary: params.voice.ready
        ? "Mandatory voice runtime bootstrap completed."
        : "Voice runtime bootstrap is present but not fully ready.",
      proofPath: params.voice.manifestPath,
    },
    {
      kind: "browser",
      target: "viki-browser",
      status: "copied",
      summary: "Native browser proof and launcher packaging refreshed.",
      proofPath: params.browserProofPath,
    },
    {
      kind: "memory",
      target: "graphiti",
      status: "copied",
      summary: "Graphiti proof refreshed with the current memory backend configuration.",
      proofPath: params.graphitiProofPath,
    },
    {
      kind: "foundry",
      target: "capability-foundry",
      status: "refreshed",
      summary: `Foundry inventory refreshed with ${params.foundryDiscovered} discovered, ${params.foundryPromoted} promoted, ${params.foundryBundled} bundled, ${params.foundryRejected} rejected candidates.`,
      proofPath: params.foundryRegistryPath,
    },
  ];

  for (const plugin of params.pluginEntries) {
    receipts.push({
      kind: "plugin",
      target: plugin.id,
      status: plugin.status === "enabled" ? "enabled" : plugin.status === "skipped" ? "skipped" : "failed",
      summary: `${plugin.name} plugin ${plugin.status}.`,
      sourceRepo: plugin.sourceRepo,
      proofPath: plugin.path,
    });
  }

  for (const skill of params.skillEntries) {
    receipts.push({
      kind: "skill",
      target: skill.name,
      status:
        skill.status === "installed"
          ? "installed"
          : skill.status === "ready"
            ? "ready"
            : skill.status === "available"
              ? "skipped"
              : "failed",
      summary: `${skill.name} skill ${skill.status}.`,
      sourceRepo: skill.sourceRepo,
      proofPath: skill.path,
    });
  }

  return receipts;
}

function buildReadyCapabilities(params: {
  pluginEntries: BundledPluginInventoryEntry[];
  skillEntries: BundledSkillInventoryEntry[];
  foundryRoutes: Array<{
    candidateId: string;
    name: string;
    type: string;
    state: string;
    scope: string;
    sourceUrl: string;
    reasons: string[];
    registration?: {
      entrypoint: string;
    };
  }>;
}) {
  const ready: CapabilityBundleInventory["readyCapabilities"] = [];
  for (const entry of params.pluginEntries) {
    if (entry.status !== "enabled") {
      continue;
    }
    ready.push({
      id: `plugin:${entry.id}`,
      label: entry.name,
      kind: "plugin",
      familyId: "bundled_plugin",
      sourceUrl: entry.sourceRepo,
      runtimeHint: entry.reason ?? `Use ${entry.name} for ${entry.name.toLowerCase()}.`,
      bundled: true,
      status: "enabled",
      proof: entry.path,
    });
  }
  for (const entry of params.skillEntries) {
    if (entry.status !== "ready" && entry.status !== "installed") {
      continue;
    }
    ready.push({
      id: `skill:${entry.name}`,
      label: entry.name,
      kind: "skill",
      familyId: "bundled_skill",
      sourceUrl: entry.sourceRepo,
      runtimeHint: entry.reason ?? `Use ${entry.name} for mission execution.`,
      bundled: true,
      status: entry.status === "ready" ? "ready" : "installed",
      proof: entry.path,
    });
  }
  for (const route of params.foundryRoutes) {
    ready.push({
      id: route.candidateId,
      label: route.name,
      kind: route.type as CapabilityBundleInventory["readyCapabilities"][number]["kind"],
      familyId: "curated_repo",
      sourceUrl: route.sourceUrl,
      runtimeHint:
        route.reasons.length > 0 ? route.reasons.join("; ") : `Route ${route.name} for ${route.type}.`,
      bundled: route.state === "bundled",
      status: route.state === "bundled" ? "bundled" : "ready",
      proof: route.registration?.entrypoint,
    });
  }
  return ready;
}

function buildFoundryRegistrySnapshot(params: {
  catalog: Awaited<ReturnType<typeof loadApprovedFoundryCatalog>>;
  workspaceDir: string;
  rootDir: string;
}): {
  registryPath: string;
  registry: CapabilityFoundryRegistry;
  routes: CapabilityFoundryRoute[];
  discovered: number;
  promoted: number;
  bundled: number;
  rejected: number;
} {
  const registryPath = path.join(resolveStateDir(), "capabilities", "foundry", "registry.json");
  const candidates: CapabilityFoundryCandidate[] = params.catalog.entries.map((entry) => ({
    id: entry.id,
    name: entry.label,
    type: entry.kind,
    summary: entry.summary,
    compatibility: entry.compatibility,
    scope: entry.scope,
    state: entry.scope === "bundled" ? "bundled" : entry.scope === "rejected" ? "rejected" : "promoted",
    source: entry.source,
    sourceCatalogId: entry.sourceCatalogId,
    sourceCatalogEntryId: entry.sourceCatalogEntryId,
    sourceFamily: entry.sourceFamily,
    approval: entry.approval,
    classification: entry.classification,
    provenance: entry.provenance,
    test: entry.test ?? { status: "pending", summary: "Awaiting test promotion." },
    registration: entry.registration,
    usage: {
      suggested: 0,
      success: 0,
      failure: 0,
    },
    notes: entry.notes ? [entry.notes] : undefined,
  }));
  const registry: CapabilityFoundryRegistry = {
    version: 1,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceCatalogRevision: params.catalog.sourceCatalogRevision,
    workspaceDir: params.workspaceDir,
    supportedSources: params.catalog.supportedSources,
    sourceCatalogs: undefined,
    candidates,
    usage: [],
  };
  const routes = candidates.map((candidate) => ({
    candidateId: candidate.id,
    name: candidate.name,
    type: candidate.type,
    score: candidate.scope === "bundled" ? 2 : 1,
    reasons: candidate.classification.selectionNotes,
    scope: candidate.scope,
    state: candidate.state,
    sourceUrl: candidate.source.sourceUrl,
    registration: candidate.registration,
    usage: candidate.usage,
  }));
  return {
    registryPath,
    registry,
    routes,
    discovered: candidates.length,
    promoted: candidates.filter((candidate) => candidate.state === "promoted").length,
    bundled: candidates.filter((candidate) => candidate.state === "bundled").length,
    rejected: candidates.filter((candidate) => candidate.state === "rejected").length,
  };
}

function renderSourceCatalogMarkdown(catalog: ReturnType<typeof buildSourceCatalog>): string {
  const lines = [
    "# Capability Foundry Source Catalog",
    "",
    `- Revision: \`${catalog.revision}\``,
    `- Approved sources: \`${catalog.approvedSources}\``,
    "",
  ];
  for (const family of catalog.families) {
    lines.push(`## ${family.label}`);
    lines.push("");
    lines.push(`- Trust level: \`${family.trustLevel}\``);
    lines.push(`- Source kind: \`${family.sourceKind}\``);
    lines.push(`- Sources: \`${family.sourceCount}\``);
    lines.push(`- Bundled: \`${family.bundledCount}\``);
    lines.push(`- Summary: ${family.summary}`);
    lines.push("");
    for (const source of family.sources) {
      lines.push(
        `- \`${source.id}\` :: ${source.label} :: ${source.kind} :: ${source.origin} :: ${source.installMethod}`,
      );
      lines.push(`  - Source URL: ${source.sourceUrl}`);
      lines.push(`  - Runtime hint: ${source.runtimeHint}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderBundleReceiptsMarkdown(receipts: CapabilityBundleInventory["bundleReceipts"]): string {
  const lines = ["# Capability Foundry Bundle Receipts", ""];
  for (const receipt of receipts) {
    lines.push(`- \`${receipt.kind}\` :: ${receipt.target} :: ${receipt.status}`);
    lines.push(`  - Summary: ${receipt.summary}`);
    if (receipt.sourceRepo) {
      lines.push(`  - Source: ${receipt.sourceRepo}`);
    }
    if (receipt.recipe) {
      lines.push(`  - Recipe: ${receipt.recipe}`);
    }
    if (receipt.proofPath) {
      lines.push(`  - Proof: ${receipt.proofPath}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function renderReadyCapabilitiesMarkdown(
  ready: CapabilityBundleInventory["readyCapabilities"],
): string {
  const lines = ["# Ready-to-Use Capability Catalog", ""];
  for (const capability of ready) {
    lines.push(`- \`${capability.id}\` :: ${capability.label}`);
    lines.push(`  - Kind: ${capability.kind}`);
    lines.push(`  - Status: ${capability.status}`);
    lines.push(`  - Source: ${capability.sourceUrl}`);
    lines.push(`  - Runtime hint: ${capability.runtimeHint}`);
    if (capability.proof) {
      lines.push(`  - Proof: ${capability.proof}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function renderBundleInventoryMarkdown(
  inventory: CapabilityBundleInventory,
): string {
  const lines = [
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
    ...(inventory.voice.sourceProofPath
      ? [`- Source proof: \`${inventory.voice.sourceProofPath}\``]
      : []),
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
    "## Capability Foundry",
    "",
    `- Registry: \`${inventory.foundry.registryPath}\``,
    `- Supported sources: \`${inventory.foundry.supportedSources.join(", ") || "none"}\``,
    `- Discovered: \`${inventory.foundry.discovered}\``,
    `- Promoted: \`${inventory.foundry.promoted}\``,
    `- Bundled: \`${inventory.foundry.bundled}\``,
    `- Rejected: \`${inventory.foundry.rejected}\``,
    "",
    ...inventory.foundry.routes.map(
      (route) =>
        `- \`${route.candidateId}\` - ${route.name} (${route.type}) :: score=${route.score} :: ${route.scope}/${route.state}`,
    ),
    "",
    "## Source Catalog",
    "",
    `- Revision: \`${inventory.sourceCatalog.revision}\``,
    `- Approved sources: \`${inventory.sourceCatalog.approvedSources}\``,
    ...inventory.sourceCatalog.families.map(
      (family) =>
        `- ${family.label} - ${family.sourceCount} sources, ${family.bundledCount} bundled`,
    ),
    "",
    "## Bundle Receipts",
    "",
    ...inventory.bundleReceipts.map(
      (receipt) =>
        `- ${receipt.kind} - ${receipt.target} - ${receipt.status}${receipt.summary ? ` :: ${receipt.summary}` : ""}`,
    ),
    "",
    "## Ready-to-Use Capabilities",
    "",
    ...inventory.readyCapabilities.map(
      (capability) =>
        `- ${capability.id} - ${capability.label} - ${capability.kind} - ${capability.status}${capability.proof ? ` :: ${capability.proof}` : ""}`,
    ),
    "",
    "## Enabled Plugins",
    "",
    ...inventory.plugins
      .filter((entry) => entry.status === "enabled")
      .map((entry) => `- \`${entry.id}\` - ${entry.name}`),
    "",
    "## Bundled Skills",
    "",
    ...inventory.skills.map(
      (entry) =>
        `- \`${entry.name}\` - ${entry.status}${entry.reason ? ` (${entry.reason})` : ""}`,
    ),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function repoUrlFor(kind: "skill" | "plugin", id: string): string {
  const base = kind === "skill" ? "skills" : "extensions";
  return `https://github.com/rebootix-research/viki-clow/tree/main/${base}/${id}`;
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

function installIdsForSkill(
  skill: SkillStatusEntry,
  options?: { forceInstall?: boolean },
): string[] {
  const allowedKinds = resolveAutomaticInstallKinds();
  const filtered =
    options?.forceInstall === true
      ? skill.install
      : skill.install.filter((option) => allowedKinds.has(option.kind));
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
            ...existing.env,
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
    const repoId = skill.name;
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

    const shouldAutoInstall = params.autoInstall || MANDATORY_VOICE_BUNDLED_SKILLS.has(skill.name);
    if (
      !shouldAutoInstall ||
      (!supportsAutomaticInstall(skill) && !MANDATORY_VOICE_BUNDLED_SKILLS.has(skill.name))
    ) {
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
    for (const installId of installIdsForSkill(skill, {
      forceInstall: MANDATORY_VOICE_BUNDLED_SKILLS.has(skill.name),
    })) {
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
  const approvedCatalog = await loadApprovedFoundryCatalog({
    rootDir,
    env,
  });
  const foundry = buildFoundryRegistrySnapshot({
    catalog: approvedCatalog,
    workspaceDir: params.workspaceDir,
    rootDir,
  });
  const foundryRoutes = foundry.routes.slice(0, 12);

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

  const sourceCatalog = buildSourceCatalog();
  const bundleReceipts = buildBundleReceipts({
    pluginEntries: pluginBundle.entries,
    skillEntries: skillBundle.entries,
    voice,
    browserProofPath: browserProof.jsonPath,
    graphitiProofPath: graphitiProof.paths.proofPath,
    foundryRegistryPath: foundry.registryPath,
    foundryDiscovered: foundry.discovered,
    foundryPromoted: foundry.promoted,
    foundryBundled: foundry.bundled,
    foundryRejected: foundry.rejected,
  });
  const readyCapabilities = buildReadyCapabilities({
    pluginEntries: pluginBundle.entries,
    skillEntries: skillBundle.entries,
    foundryRoutes,
  });

  const baseDir = path.join(resolveStateDir(env), "capabilities");
  const manifestPath = path.join(baseDir, "bundle-inventory.json");
  const markdownPath = path.join(baseDir, "bundle-inventory.md");
  const sourceCatalogPath = path.join(baseDir, "source-catalog.json");
  const sourceCatalogMarkdownPath = path.join(baseDir, "source-catalog.md");
  const bundleReceiptsPath = path.join(baseDir, "bundle-receipts.json");
  const bundleReceiptsMarkdownPath = path.join(baseDir, "bundle-receipts.md");
  const inventory: CapabilityBundleInventory = {
    version: 1,
    generatedAt: new Date().toISOString(),
    workspaceDir: params.workspaceDir,
    manifestPath,
    markdownPath,
    sourceCatalogPath,
    sourceCatalogMarkdownPath,
    bundleReceiptsPath,
    bundleReceiptsMarkdownPath,
    capabilityPlan,
    sourceCatalog,
    bundleReceipts,
    readyCapabilities,
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
    foundry: {
      registryPath: foundry.registryPath,
      supportedSources: foundry.registry.supportedSources,
      sourceCatalogRevision: foundry.registry.sourceCatalogRevision,
      discovered: foundry.discovered,
      promoted: foundry.promoted,
      bundled: foundry.bundled,
      rejected: foundry.rejected,
      routes: foundryRoutes,
      registry: foundry.registry,
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
  await writeJson(sourceCatalogPath, sourceCatalog);
  await writeJson(bundleReceiptsPath, bundleReceipts);
  await fs.writeFile(sourceCatalogMarkdownPath, renderSourceCatalogMarkdown(sourceCatalog), "utf8");
  await fs.writeFile(bundleReceiptsMarkdownPath, renderBundleReceiptsMarkdown(bundleReceipts), "utf8");
  await fs.writeFile(markdownPath, renderBundleInventoryMarkdown(inventory), "utf8");

  if (params.artifactDir) {
    await fs.mkdir(params.artifactDir, { recursive: true });
    await copyIfPresent(manifestPath, path.join(params.artifactDir, "bundle-inventory.json"));
    await copyIfPresent(markdownPath, path.join(params.artifactDir, "bundle-inventory.md"));
    await copyIfPresent(sourceCatalogPath, path.join(params.artifactDir, "source-catalog.json"));
    await copyIfPresent(sourceCatalogMarkdownPath, path.join(params.artifactDir, "source-catalog.md"));
    await copyIfPresent(bundleReceiptsPath, path.join(params.artifactDir, "bundle-receipts.json"));
    await copyIfPresent(bundleReceiptsMarkdownPath, path.join(params.artifactDir, "bundle-receipts.md"));
  }

  return {
    config: nextConfig,
    inventory,
  };
}
