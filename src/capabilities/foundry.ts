import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { buildWorkspaceSkillStatus, type SkillStatusEntry } from "../agents/skills-status.js";
import type { VikiClowConfig } from "../config/config.js";
import { loadConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import {
  loadPluginManifestRegistry,
  type PluginManifestRecord,
} from "../plugins/manifest-registry.js";
import { runExec } from "../process/exec.js";
import { scanDirectoryWithSummary } from "../security/skill-scanner.js";
import {
  CAPABILITY_CATALOG,
  CAPABILITY_CATALOG_REVISION,
  CAPABILITY_SPECS,
  inferCapabilityIdsForObjective,
  normalizeCapabilityObjective,
} from "./catalog.js";
import {
  loadCapabilityFoundryRegistry,
  loadCapabilityRegistry,
  recordCapabilityFoundryUsage,
  saveCapabilityFoundryRegistry,
  saveCapabilityRegistry,
  upsertCapabilityFoundryCandidates,
} from "./store.js";
import type {
  CapabilityDiscoveryRecord,
  CapabilityFoundryCandidate,
  CapabilityFoundryOutcome,
  CapabilityFoundryRegistry,
  CapabilityFoundryRoute,
  CapabilityFoundryScope,
  CapabilityFoundryState,
  CapabilityFoundryTestStatus,
  CapabilityFoundryTestResult,
  CapabilityId,
  CapabilityPlan,
  CapabilityRecord,
  CapabilityRegistry,
  CapabilitySpec,
  CapabilityStatus,
} from "./types.js";

type CapabilityInspectionParams = {
  workspaceDir?: string;
  objective?: string;
  autoInstall?: boolean;
};

type CapabilityInspectResult = {
  record: CapabilityRecord;
  spec: CapabilitySpec;
};

type CapabilityDiscoveryParams = {
  objective: string;
};

type CapabilityFetchParams = CapabilityInspectionParams & {
  ids: CapabilityId[];
  env?: NodeJS.ProcessEnv;
};

type FoundrySeed = Omit<
  CapabilityFoundryCandidate,
  | "state"
  | "sandbox"
  | "provenance"
  | "test"
  | "promotedAt"
  | "rejectedAt"
  | "rejectionReason"
  | "usage"
  | "notes"
> & {
  notes?: string[];
  provenance?: CapabilityFoundryCandidate["provenance"];
  test?: CapabilityFoundryTestResult;
};

type FoundryDiscoverParams = {
  workspaceDir: string;
  rootDir?: string;
  config?: VikiClowConfig;
  env?: NodeJS.ProcessEnv;
};

type FoundryIngestParams = FoundryDiscoverParams & {
  ids: string[];
};

type FoundryPromoteParams = FoundryDiscoverParams & {
  ids: string[];
  bundle?: boolean;
};

type FoundryRouteParams = FoundryDiscoverParams & {
  objective: string;
  limit?: number;
};

type FoundryRefreshParams = FoundryDiscoverParams & {
  includeRemote?: boolean;
};

const SUPPORTED_FOUNDRY_SOURCES = [
  "repo-skills",
  "repo-plugins",
  "npm-mcp",
  "github-repo",
] as const;

function repoUrlFor(kind: "skill" | "plugin", id: string): string {
  const base = kind === "skill" ? "skills" : "extensions";
  return `https://github.com/rebootix-research/viki-clow/tree/main/${base}/${id}`;
}

function tokenizeHints(...values: string[]): string[] {
  const stopWords = new Set([
    "and",
    "for",
    "the",
    "with",
    "that",
    "this",
    "into",
    "from",
    "your",
    "agent",
    "system",
    "local",
    "runtime",
    "tool",
    "tools",
    "server",
    "bundle",
    "foundry",
  ]);
  return Array.from(
    new Set(
      values
        .flatMap((value) =>
          value
            .toLowerCase()
            .split(/[^a-z0-9]+/u)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length >= 3 && !stopWords.has(entry)),
        )
        .filter(Boolean),
    ),
  ).slice(0, 24);
}

function normalizeFoundryId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveFoundrySandboxDir(
  candidateId: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return path.join(
    resolveStateDir(env),
    "capabilities",
    "foundry",
    "sandbox",
    normalizeFoundryId(candidateId),
  );
}

function resolveFoundryProofPath(
  candidateId: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return path.join(
    resolveStateDir(env),
    "capabilities",
    "foundry",
    "proofs",
    `${normalizeFoundryId(candidateId)}.json`,
  );
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);
}

async function pathExists(filePath: string | undefined): Promise<boolean> {
  if (!filePath?.trim()) {
    return false;
  }
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkCommand(
  command: string,
  args: string[] = ["--version"],
): Promise<{ ok: boolean; details?: string }> {
  try {
    const { stdout, stderr } = await runExec(command, args, { timeoutMs: 20_000 });
    const firstLine = `${stdout}\n${stderr}`
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find(Boolean);
    return { ok: true, details: firstLine };
  } catch (error) {
    return {
      ok: false,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

function makeRecord(
  spec: CapabilitySpec,
  status: CapabilityStatus,
  details?: string,
  params?: {
    objective?: string;
    matchedHints?: string[];
    inspectedBy?: CapabilityRecord["inspectedBy"];
  },
): CapabilityRecord {
  return {
    id: spec.id,
    label: spec.label,
    kind: spec.kind,
    status,
    checkedAt: new Date().toISOString(),
    details,
    source: spec.source,
    objective: params?.objective?.trim() || undefined,
    matchedHints:
      params?.matchedHints && params.matchedHints.length > 0 ? params.matchedHints : undefined,
    inspectedBy: params?.inspectedBy,
  };
}

function matchObjectiveHints(objective: string, spec: CapabilitySpec): string[] {
  const normalized = normalizeCapabilityObjective(objective);
  return spec.objectiveHints.filter((hint) => normalized.includes(hint));
}

function classifyDiscovery(
  spec: CapabilitySpec,
  directIds: Set<CapabilityId>,
  objective: string,
): CapabilityDiscoveryRecord {
  const matchedHints = matchObjectiveHints(objective, spec);
  const relevance = (() => {
    if (directIds.has(spec.id)) {
      return "direct" as const;
    }
    if (spec.id === "browser_profiles" && directIds.has("playwright")) {
      return "related" as const;
    }
    if (spec.id === "generated_skill" && /skill|workflow|automation|adapter/u.test(objective)) {
      return "related" as const;
    }
    return "available" as const;
  })();
  const matchReasons = matchedHints.length > 0 ? matchedHints.map((hint) => `matched:${hint}`) : [];
  if (relevance === "related") {
    if (spec.id === "browser_profiles") {
      matchReasons.push("playwright-adjacent");
    } else if (spec.id === "generated_skill") {
      matchReasons.push("objective-adjacent");
    }
  }
  return {
    ...makeRecord(
      spec,
      "missing",
      relevance === "direct"
        ? "objective match"
        : relevance === "related"
          ? "related to inferred capability"
          : "catalog available",
      {
        objective,
        matchedHints,
        inspectedBy: "discover",
      },
    ),
    relevance,
    matchReasons,
  };
}

async function ensureBrowserProfilesCapability(
  workspaceDir: string | undefined,
): Promise<CapabilityRecord> {
  const spec = CAPABILITY_SPECS.browser_profiles;
  if (!workspaceDir?.trim()) {
    return makeRecord(spec, "failed", "workspace directory required", { inspectedBy: "fetch" });
  }
  const baseDir = path.join(workspaceDir, ".vikiclow", "browser");
  const profileDir = path.join(baseDir, "profiles", "mission-default");
  const evidenceDir = path.join(baseDir, "evidence");
  const traceDir = path.join(baseDir, "traces");
  await fs.mkdir(profileDir, { recursive: true });
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.mkdir(traceDir, { recursive: true });
  const markerPath = path.join(baseDir, "README.txt");
  await fs.writeFile(
    markerPath,
    [
      "Viki Browser mission profiles",
      "",
      `profile=${profileDir}`,
      `evidence=${evidenceDir}`,
      `traces=${traceDir}`,
      "",
      "Created by capability bootstrap for durable browser missions.",
      "",
    ].join("\n"),
    "utf8",
  );
  return makeRecord(spec, "provisioned", [profileDir, evidenceDir, traceDir].join(" | "), {
    inspectedBy: "fetch",
  });
}

function slugifyObjective(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureGeneratedSkillCapability(
  workspaceDir: string | undefined,
  objective: string,
): Promise<CapabilityRecord> {
  const spec = CAPABILITY_SPECS.generated_skill;
  if (!workspaceDir?.trim()) {
    return makeRecord(spec, "failed", "workspace directory required", { inspectedBy: "fetch" });
  }
  const trimmedObjective = objective.trim();
  if (!trimmedObjective) {
    return makeRecord(spec, "failed", "objective required to generate a skill", {
      inspectedBy: "fetch",
    });
  }
  const slug = slugifyObjective(trimmedObjective) || "generated-skill";
  const skillDir = path.join(workspaceDir, "skills", `generated-${slug}`);
  const skillPath = path.join(skillDir, "SKILL.md");
  await fs.mkdir(skillDir, { recursive: true });
  const contents = [
    `# Generated Mission Skill`,
    "",
    "## Purpose",
    `Provide reusable execution guidance for this mission objective: ${trimmedObjective}`,
    "",
    "## Workflow",
    "- Restate the concrete deliverable in one sentence.",
    "- Prefer real execution over planning-only replies.",
    "- Capture evidence paths, commands, and artifacts as the work proceeds.",
    "- If a capability is missing, provision it or route to the nearest working fallback.",
    "- Finish with a terminal result, not a partial handoff.",
    "",
    "## Output",
    "- Completed deliverable or exact blocker",
    "- Commands run",
    "- Artifact paths",
    "",
  ].join("\n");
  await fs.writeFile(skillPath, contents, "utf8");
  return makeRecord(spec, "provisioned", skillPath, {
    objective: trimmedObjective,
    inspectedBy: "fetch",
  });
}

async function inspectCapabilitySource(
  id: CapabilityId,
  params: CapabilityInspectionParams,
): Promise<CapabilityInspectResult> {
  const spec = CAPABILITY_SPECS[id];
  const objective = params.objective?.trim() || "";
  const matchedHints = objective ? matchObjectiveHints(objective, spec) : [];

  switch (id) {
    case "git":
    case "node":
    case "python":
    case "ffmpeg": {
      const result = await checkCommand(
        spec.source.command ?? id,
        spec.source.args ?? ["--version"],
      );
      return {
        spec,
        record: makeRecord(spec, result.ok ? "ready" : "missing", result.details, {
          objective,
          matchedHints,
          inspectedBy: "fetch",
        }),
      };
    }
    case "playwright": {
      const existing = await checkCommand(
        spec.source.command ?? "corepack",
        spec.source.args ?? ["pnpm", "exec", "playwright", "--version"],
      );
      if (existing.ok) {
        return {
          spec,
          record: makeRecord(spec, "ready", existing.details, {
            objective,
            matchedHints,
            inspectedBy: "fetch",
          }),
        };
      }
      if (!params.autoInstall) {
        return {
          spec,
          record: makeRecord(
            spec,
            "missing",
            existing.details ?? spec.installLabel ?? spec.source.installLabel,
            {
              objective,
              matchedHints,
              inspectedBy: "fetch",
            },
          ),
        };
      }
      try {
        await runExec("corepack", ["pnpm", "exec", "playwright", "install", "chromium"], {
          timeoutMs: 300_000,
        });
      } catch (error) {
        return {
          spec,
          record: makeRecord(
            spec,
            "failed",
            error instanceof Error ? error.message : String(error),
            {
              objective,
              matchedHints,
              inspectedBy: "fetch",
            },
          ),
        };
      }
      const recheck = await checkCommand(
        spec.source.command ?? "corepack",
        spec.source.args ?? ["pnpm", "exec", "playwright", "--version"],
      );
      return {
        spec,
        record: makeRecord(
          spec,
          recheck.ok ? "provisioned" : "failed",
          recheck.details ?? spec.installLabel ?? spec.source.installLabel,
          {
            objective,
            matchedHints,
            inspectedBy: "fetch",
          },
        ),
      };
    }
    case "browser_profiles":
      return {
        spec,
        record: await ensureBrowserProfilesCapability(params.workspaceDir),
      };
    case "generated_skill":
      return {
        spec,
        record: await ensureGeneratedSkillCapability(params.workspaceDir, objective),
      };
    default: {
      const exhaustive: never = id;
      throw new Error(`Unsupported capability: ${String(exhaustive)}`);
    }
  }
}

function sortRecords(records: CapabilityRecord[]): CapabilityRecord[] {
  return records.toSorted((left, right) => left.label.localeCompare(right.label));
}

function mergeCandidate(
  seed: FoundrySeed,
  existing: CapabilityFoundryCandidate | undefined,
): CapabilityFoundryCandidate {
  return {
    id: seed.id,
    name: seed.name,
    type: seed.type,
    summary: seed.summary,
    compatibility: seed.compatibility,
    scope: existing?.scope === "rejected" ? "rejected" : seed.scope,
    state: existing?.state ?? "discovered",
    source: seed.source,
    classification: seed.classification,
    sandbox: existing?.sandbox,
    provenance: {
      dependencies: seed.provenance?.dependencies ?? seed.source.dependencies,
      version: existing?.provenance.version ?? seed.provenance?.version,
      license: existing?.provenance.license ?? seed.provenance?.license,
      sourceRef: existing?.provenance.sourceRef ?? seed.provenance?.sourceRef,
      fetchedFrom: existing?.provenance.fetchedFrom ?? seed.provenance?.fetchedFrom,
    },
    test: existing?.test ??
      seed.test ?? { status: "pending", summary: "Candidate not yet tested." },
    registration: seed.registration,
    promotedAt: existing?.promotedAt,
    rejectedAt: existing?.rejectedAt,
    rejectionReason: existing?.rejectionReason,
    usage: existing?.usage ?? {
      suggested: 0,
      success: 0,
      failure: 0,
    },
    notes: [...new Set([...(seed.notes ?? []), ...(existing?.notes ?? [])])],
  };
}

function skillInstallMethod(
  skill: SkillStatusEntry,
): CapabilityFoundryCandidate["source"]["installMethod"] {
  const kind = skill.install[0]?.kind;
  if (kind === "download") {
    return "download";
  }
  return "workspace_copy";
}

function buildSkillSeed(skill: SkillStatusEntry): FoundrySeed {
  const hints = tokenizeHints(skill.name, skill.description, skill.primaryEnv ?? "");
  const installLabels = skill.install.map((option) => option.label);
  return {
    id: `skill:${skill.name}`,
    name: skill.name,
    type: "skill",
    summary: skill.description,
    compatibility: skill.eligible ? "compatible" : skill.install.length > 0 ? "wrapped" : "manual",
    scope: skill.bundled ? "bundled" : "optional",
    source: {
      kind: "local_repo",
      sourceUrl: repoUrlFor("skill", skill.name),
      localPath: skill.baseDir,
      installMethod: skillInstallMethod(skill),
      dependencies: [
        ...skill.requirements.bins,
        ...skill.requirements.env,
        ...skill.requirements.config,
      ],
      notes: skill.source,
    },
    classification: {
      objectiveHints: hints,
      tags: ["skill", ...(skill.bundled ? ["bundled"] : ["optional"])],
      selectionNotes: [
        skill.eligible ? "ready in current environment" : "requires provisioning before use",
      ],
    },
    provenance: {
      dependencies: [
        ...skill.requirements.bins,
        ...skill.requirements.env,
        ...skill.requirements.config,
      ],
    },
    registration: {
      kind: "skill",
      targetId: skill.skillKey,
      entrypoint: skill.filePath,
      path: skill.baseDir,
      autoBundled: skill.bundled,
      routeHints: hints,
      usageRecipe: `Use the ${skill.name} skill when the task needs ${skill.description.toLowerCase()}.`,
    },
    notes: installLabels,
  };
}

function buildPluginSeed(plugin: PluginManifestRecord): FoundrySeed {
  const hints = tokenizeHints(
    plugin.id,
    plugin.name ?? "",
    plugin.description ?? "",
    plugin.skills.join(" "),
    plugin.channels.join(" "),
    plugin.providers.join(" "),
  );
  return {
    id: `plugin:${plugin.id}`,
    name: plugin.name ?? plugin.id,
    type: "plugin",
    summary: plugin.description ?? `${plugin.id} plugin integration`,
    compatibility: "compatible",
    scope: plugin.origin === "bundled" ? "bundled" : "optional",
    source: {
      kind: "local_repo",
      sourceUrl: repoUrlFor("plugin", plugin.id),
      localPath: plugin.rootDir,
      installMethod: "plugin_enable",
      dependencies: [...plugin.channels, ...plugin.providers, ...plugin.skills],
      notes: plugin.origin,
    },
    classification: {
      objectiveHints: hints,
      tags: ["plugin", plugin.kind ?? "integration"],
      selectionNotes: [
        plugin.origin === "bundled"
          ? "bundled plugin can be enabled directly"
          : "workspace plugin can be registered when compatible",
      ],
    },
    provenance: {
      dependencies: [...plugin.channels, ...plugin.providers, ...plugin.skills],
      version: plugin.version,
    },
    registration: {
      kind: "plugin",
      targetId: plugin.id,
      entrypoint: plugin.manifestPath,
      path: plugin.rootDir,
      autoBundled: plugin.origin === "bundled",
      routeHints: hints,
      usageRecipe: `Enable plugin ${plugin.id} when the mission needs ${plugin.name ?? plugin.id}.`,
    },
  };
}

function buildStaticSeed(
  seed: Omit<FoundrySeed, "classification"> & {
    objectiveHints: string[];
    tags: string[];
    selectionNotes: string[];
  },
): FoundrySeed {
  return {
    ...seed,
    classification: {
      objectiveHints: [...new Set(seed.objectiveHints)],
      tags: [...new Set(seed.tags)],
      selectionNotes: [...new Set(seed.selectionNotes)],
    },
  };
}

function buildStaticRemoteSeeds(rootDir: string): FoundrySeed[] {
  return [
    buildStaticSeed({
      id: "mcp:filesystem",
      name: "MCP Filesystem Server",
      type: "mcp_server",
      summary: "Curated filesystem MCP server for directory reads, writes, and file traversal.",
      compatibility: "wrapped",
      scope: "optional",
      source: {
        kind: "npm_registry",
        sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem",
        packageName: "@modelcontextprotocol/server-filesystem",
        installMethod: "npm_pack",
        dependencies: ["node", "npm"],
      },
      provenance: {
        dependencies: ["node", "npm"],
      },
      registration: {
        kind: "mcp_server",
        targetId: "@modelcontextprotocol/server-filesystem",
        entrypoint: "@modelcontextprotocol/server-filesystem",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
        autoBundled: false,
        routeHints: ["filesystem", "files", "directories", "workspace"],
        usageRecipe: "Launch when the mission needs a standards-based MCP filesystem server.",
      },
      objectiveHints: ["filesystem", "files", "directories", "workspace"],
      tags: ["mcp", "filesystem", "curated"],
      selectionNotes: ["registry-backed MCP candidate"],
    }),
    buildStaticSeed({
      id: "mcp:fetch",
      name: "MCP Fetch Server",
      type: "mcp_server",
      summary: "Curated fetch MCP server for network-backed HTTP retrieval and content intake.",
      compatibility: "wrapped",
      scope: "optional",
      source: {
        kind: "npm_registry",
        sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-fetch",
        packageName: "@modelcontextprotocol/server-fetch",
        installMethod: "npm_pack",
        dependencies: ["node", "npm"],
      },
      provenance: {
        dependencies: ["node", "npm"],
      },
      registration: {
        kind: "mcp_server",
        targetId: "@modelcontextprotocol/server-fetch",
        entrypoint: "@modelcontextprotocol/server-fetch",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
        autoBundled: false,
        routeHints: ["fetch", "http", "scrape", "web"],
        usageRecipe: "Launch when the mission needs a standards-based MCP fetch surface.",
      },
      objectiveHints: ["fetch", "http", "scrape", "web"],
      tags: ["mcp", "network", "curated"],
      selectionNotes: ["registry-backed MCP candidate"],
    }),
    buildStaticSeed({
      id: "mcp:github",
      name: "MCP GitHub Server",
      type: "mcp_server",
      summary: "Curated GitHub MCP server for issues, pull requests, and repository metadata.",
      compatibility: "wrapped",
      scope: "optional",
      source: {
        kind: "npm_registry",
        sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-github",
        packageName: "@modelcontextprotocol/server-github",
        installMethod: "npm_pack",
        dependencies: ["node", "npm", "github-token"],
      },
      provenance: {
        dependencies: ["node", "npm", "github-token"],
      },
      registration: {
        kind: "mcp_server",
        targetId: "@modelcontextprotocol/server-github",
        entrypoint: "@modelcontextprotocol/server-github",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        autoBundled: false,
        routeHints: ["github", "issue", "pull request", "repository"],
        usageRecipe: "Launch when the mission needs standards-based GitHub MCP tooling.",
      },
      objectiveHints: ["github", "issue", "pull request", "repository"],
      tags: ["mcp", "github", "curated"],
      selectionNotes: ["registry-backed MCP candidate"],
    }),
    buildStaticSeed({
      id: "repo:graphiti",
      name: "Graphiti Upstream",
      type: "repo_integration",
      summary: "Pinned upstream Graphiti repo for deeper memory adapter inspection and updates.",
      compatibility: "wrapped",
      scope: "experimental",
      source: {
        kind: "github_repo",
        sourceUrl: "https://github.com/getzep/graphiti",
        repo: "getzep/graphiti",
        installMethod: "git_clone",
        dependencies: ["git", "python"],
      },
      provenance: {
        dependencies: ["git", "python"],
      },
      registration: {
        kind: "repo_integration",
        targetId: "getzep/graphiti",
        entrypoint: path.join(rootDir, ".vikiclow-foundry", "graphiti"),
        autoBundled: false,
        routeHints: ["graphiti", "memory", "knowledge graph"],
        usageRecipe:
          "Vendor when the mission needs upstream Graphiti source inspection or adapter refresh.",
      },
      objectiveHints: ["graphiti", "memory", "knowledge graph"],
      tags: ["repo", "memory", "graphiti"],
      selectionNotes: ["curated upstream repo candidate"],
    }),
    buildStaticSeed({
      id: "repo:langgraph",
      name: "LangGraph Upstream",
      type: "repo_integration",
      summary: "Pinned upstream LangGraph repo for swarm graph runtime inspection and updates.",
      compatibility: "wrapped",
      scope: "experimental",
      source: {
        kind: "github_repo",
        sourceUrl: "https://github.com/langchain-ai/langgraph",
        repo: "langchain-ai/langgraph",
        installMethod: "git_clone",
        dependencies: ["git", "python"],
      },
      provenance: {
        dependencies: ["git", "python"],
      },
      registration: {
        kind: "repo_integration",
        targetId: "langchain-ai/langgraph",
        entrypoint: path.join(rootDir, ".vikiclow-foundry", "langgraph"),
        autoBundled: false,
        routeHints: ["langgraph", "swarm", "graph", "orchestration"],
        usageRecipe:
          "Vendor when the mission needs upstream LangGraph source inspection or adapter refresh.",
      },
      objectiveHints: ["langgraph", "swarm", "graph", "orchestration"],
      tags: ["repo", "langgraph", "swarm"],
      selectionNotes: ["curated upstream repo candidate"],
    }),
    buildStaticSeed({
      id: "repo:temporal-sdk-typescript",
      name: "Temporal TypeScript SDK",
      type: "repo_integration",
      summary: "Pinned upstream Temporal TypeScript SDK repo for durable runtime upgrades.",
      compatibility: "wrapped",
      scope: "experimental",
      source: {
        kind: "github_repo",
        sourceUrl: "https://github.com/temporalio/sdk-typescript",
        repo: "temporalio/sdk-typescript",
        installMethod: "git_clone",
        dependencies: ["git", "node"],
      },
      provenance: {
        dependencies: ["git", "node"],
      },
      registration: {
        kind: "repo_integration",
        targetId: "temporalio/sdk-typescript",
        entrypoint: path.join(rootDir, ".vikiclow-foundry", "temporal-sdk-typescript"),
        autoBundled: false,
        routeHints: ["temporal", "workflow", "durable"],
        usageRecipe:
          "Vendor when the mission needs upstream Temporal SDK inspection or adapter refresh.",
      },
      objectiveHints: ["temporal", "workflow", "durable"],
      tags: ["repo", "temporal", "durable"],
      selectionNotes: ["curated upstream repo candidate"],
    }),
    buildStaticSeed({
      id: "asset:voice-runtime-pack",
      name: "Voice Runtime Pack",
      type: "asset_dependency",
      summary: "Bundled voice runtime assets for wake word, STT, and local TTS readiness.",
      compatibility: "compatible",
      scope: "bundled",
      source: {
        kind: "local_repo",
        sourceUrl: repoUrlFor("skill", "sherpa-onnx-tts"),
        localPath: path.join(rootDir, "skills", "sherpa-onnx-tts"),
        installMethod: "download",
        dependencies: ["ffmpeg", "python"],
      },
      provenance: {
        dependencies: ["ffmpeg", "python"],
      },
      registration: {
        kind: "asset_dependency",
        targetId: "voice-runtime-pack",
        entrypoint: path.join(rootDir, "skills", "sherpa-onnx-tts"),
        path: path.join(rootDir, "skills", "sherpa-onnx-tts"),
        autoBundled: true,
        routeHints: ["voice", "tts", "stt", "wakeword"],
        usageRecipe: "Use when the mission depends on mandatory local voice runtime assets.",
      },
      objectiveHints: ["voice", "tts", "stt", "wakeword"],
      tags: ["asset", "voice", "bundled"],
      selectionNotes: ["bundled runtime dependency"],
    }),
  ];
}

function computeFoundryCatalogRevision(candidates: FoundrySeed[]): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        candidates.map((candidate) => ({
          id: candidate.id,
          type: candidate.type,
          source: candidate.source,
          classification: candidate.classification,
          registration: candidate.registration,
        })),
      ),
    )
    .digest("hex")
    .slice(0, 12);
}

async function writeFoundryProof(
  candidate: CapabilityFoundryCandidate,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const proofPath = resolveFoundryProofPath(candidate.id, env);
  await writeJsonAtomic(proofPath, {
    generatedAt: new Date().toISOString(),
    candidate,
  });
  return proofPath;
}

async function buildFoundrySeeds(params: FoundryDiscoverParams): Promise<{
  candidates: FoundrySeed[];
  supportedSources: string[];
}> {
  const rootDir = params.rootDir ?? process.cwd();
  const config = params.config ?? loadConfig();
  const skillReport = buildWorkspaceSkillStatus(params.workspaceDir, { config });
  const skillSeeds = skillReport.skills
    .filter(
      (skill) =>
        skill.bundled ||
        path.normalize(skill.baseDir).startsWith(path.normalize(path.join(rootDir, "skills"))),
    )
    .map(buildSkillSeed);
  const pluginRegistry = loadPluginManifestRegistry({ config, workspaceDir: params.workspaceDir });
  const pluginSeeds = pluginRegistry.plugins
    .filter(
      (plugin) =>
        plugin.origin === "bundled" ||
        path.normalize(plugin.rootDir).startsWith(path.normalize(path.join(rootDir, "extensions"))),
    )
    .map(buildPluginSeed);
  const staticSeeds = buildStaticRemoteSeeds(rootDir);
  return {
    candidates: [...skillSeeds, ...pluginSeeds, ...staticSeeds],
    supportedSources: [...SUPPORTED_FOUNDRY_SOURCES],
  };
}

export function discoverCapabilitySources(params: CapabilityDiscoveryParams): {
  objective: string;
  catalogRevision: string;
  discovered: CapabilityDiscoveryRecord[];
  direct: CapabilityDiscoveryRecord[];
  related: CapabilityDiscoveryRecord[];
  available: CapabilityDiscoveryRecord[];
  inferred: CapabilityId[];
} {
  const objective = params.objective.trim();
  const inferred = inferCapabilityIdsForObjective(objective);
  if (inferred.includes("playwright")) {
    inferred.push("browser_profiles");
  }
  if (/\bskill\b|\bworkflow\b|\bautomation\b|\badapter\b/i.test(objective)) {
    inferred.push("generated_skill");
  }
  const directIds = new Set<CapabilityId>(inferred);
  const discovered = CAPABILITY_CATALOG.map((spec) =>
    classifyDiscovery(spec, directIds, objective),
  );
  return {
    objective,
    catalogRevision: CAPABILITY_CATALOG_REVISION,
    discovered,
    direct: discovered.filter((record) => record.relevance === "direct"),
    related: discovered.filter((record) => record.relevance === "related"),
    available: discovered.filter((record) => record.relevance === "available"),
    inferred: Array.from(directIds),
  };
}

function buildCapabilityPlan(
  objective: string,
  inferred: CapabilityId[],
  discovered: CapabilityDiscoveryRecord[],
  records: CapabilityRecord[],
  registryPath?: string,
): CapabilityPlan {
  const ready = sortRecords(records.filter((record) => record.status === "ready"));
  const provisioned = sortRecords(records.filter((record) => record.status === "provisioned"));
  const missing = sortRecords(records.filter((record) => record.status === "missing"));
  const failed = sortRecords(records.filter((record) => record.status === "failed"));
  const generatedSkillRecord = records.find((record) => record.id === "generated_skill");
  return {
    objective,
    inferred,
    discovered,
    ready,
    provisioned,
    missing,
    failed,
    catalogRevision: CAPABILITY_CATALOG_REVISION,
    registryPath,
    generatedSkillPath:
      generatedSkillRecord?.details && generatedSkillRecord.status !== "missing"
        ? generatedSkillRecord.details
        : undefined,
  };
}

export async function fetchCapabilityRecords(params: CapabilityFetchParams): Promise<{
  registry: CapabilityRegistry;
  registryPath: string;
  records: CapabilityRecord[];
}> {
  const objective = params.objective?.trim() || "";
  const selectedIds = Array.from(new Set(params.ids));
  const results = await Promise.all(selectedIds.map((id) => inspectCapabilitySource(id, params)));
  const records = results.map((result) => result.record);
  const existing = await loadCapabilityRegistry(params.env);
  const next = new Map(existing.records.map((record) => [record.id, record] as const));
  for (const record of records) {
    next.set(record.id, record);
  }
  const registry: CapabilityRegistry = {
    version: 2,
    generatedAt: new Date().toISOString(),
    catalogRevision: CAPABILITY_CATALOG_REVISION,
    objective: objective || existing.objective,
    records: Array.from(next.values()),
  };
  const registryPath = await saveCapabilityRegistry(registry, params.env);
  return {
    registry,
    registryPath,
    records,
  };
}

export async function inspectCapabilityRegistry(params: {
  ids?: CapabilityId[];
  env?: NodeJS.ProcessEnv;
}): Promise<{
  registry: CapabilityRegistry;
  records: Array<
    CapabilityRecord & {
      spec: CapabilitySpec;
    }
  >;
}> {
  const registry = await loadCapabilityRegistry(params.env);
  const filter = params.ids ? new Set(params.ids) : undefined;
  const records = registry.records
    .filter((record) => (filter ? filter.has(record.id) : true))
    .map((record) => ({
      ...record,
      spec: CAPABILITY_SPECS[record.id],
    }));
  return { registry, records };
}

export async function discoverAndFetchCapabilities(params: {
  objective: string;
  workspaceDir?: string;
  autoInstall?: boolean;
  env?: NodeJS.ProcessEnv;
}): Promise<CapabilityPlan> {
  const discovery = discoverCapabilitySources({ objective: params.objective });
  const fetchTargets = discovery.inferred;
  const fetched = fetchTargets.length
    ? await fetchCapabilityRecords({
        ids: fetchTargets,
        objective: discovery.objective,
        workspaceDir: params.workspaceDir,
        autoInstall: params.autoInstall,
        env: params.env,
      })
    : {
        registry: await loadCapabilityRegistry(params.env),
        registryPath: "",
        records: [],
      };
  return buildCapabilityPlan(
    discovery.objective,
    discovery.inferred,
    discovery.discovered,
    fetched.records,
    fetched.registryPath || undefined,
  );
}

export async function discoverCapabilityFoundry(params: FoundryDiscoverParams): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
}> {
  const existing = await loadCapabilityFoundryRegistry(params.env);
  const built = await buildFoundrySeeds(params);
  const revision = computeFoundryCatalogRevision(built.candidates);
  const mergedCandidates = built.candidates.map((seed) =>
    mergeCandidate(
      seed,
      existing.candidates.find((candidate) => candidate.id === seed.id),
    ),
  );
  const preserved = existing.candidates.filter(
    (candidate) => !mergedCandidates.some((entry) => entry.id === candidate.id),
  );
  const registry: CapabilityFoundryRegistry = {
    version: 1,
    generatedAt:
      existing.generatedAt && existing.generatedAt !== new Date(0).toISOString()
        ? existing.generatedAt
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceCatalogRevision: revision,
    workspaceDir: params.workspaceDir,
    supportedSources: built.supportedSources,
    candidates: [...mergedCandidates, ...preserved],
    usage: existing.usage,
  };
  const registryPath = await saveCapabilityFoundryRegistry(registry, params.env);
  return { registry, registryPath };
}

async function fetchNpmCandidate(
  candidate: CapabilityFoundryCandidate,
  env: NodeJS.ProcessEnv,
): Promise<CapabilityFoundryCandidate> {
  const packageName = candidate.source.packageName;
  if (!packageName) {
    return {
      ...candidate,
      state: "rejected",
      test: {
        status: "failed",
        summary: "npm registry candidate missing package name",
        testedAt: new Date().toISOString(),
      },
      rejectedAt: new Date().toISOString(),
      rejectionReason: "missing package name",
      scope: "rejected",
    };
  }
  const sandboxDir = resolveFoundrySandboxDir(candidate.id, env);
  await fs.mkdir(sandboxDir, { recursive: true });
  const metadataRaw = await runExec("npm", ["view", packageName, "--json"], { timeoutMs: 60_000 });
  const metadata = JSON.parse(metadataRaw.stdout || "{}") as {
    version?: string;
    license?: string;
  };
  const pack = await runExec("npm", ["pack", packageName, "--pack-destination", sandboxDir], {
    timeoutMs: 180_000,
  });
  const tarball = pack.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find(Boolean);
  return {
    ...candidate,
    state: "fetched",
    sandbox: {
      path: sandboxDir,
      fetchedAt: new Date().toISOString(),
    },
    provenance: {
      ...candidate.provenance,
      version: metadata.version ?? candidate.provenance.version,
      license:
        typeof metadata.license === "string" ? metadata.license : candidate.provenance.license,
      fetchedFrom: tarball ? path.join(sandboxDir, tarball) : sandboxDir,
    },
    notes: [...new Set([...(candidate.notes ?? []), tarball ? `packed:${tarball}` : "packed"])],
  };
}

async function fetchGithubRepoCandidate(
  candidate: CapabilityFoundryCandidate,
  env: NodeJS.ProcessEnv,
): Promise<CapabilityFoundryCandidate> {
  const sandboxDir = resolveFoundrySandboxDir(candidate.id, env);
  const repoDir = path.join(sandboxDir, "repo");
  await fs.mkdir(sandboxDir, { recursive: true });
  if (!(await pathExists(repoDir))) {
    const cloneArgs = ["clone", "--depth", "1"];
    if (candidate.source.ref) {
      cloneArgs.push("--branch", candidate.source.ref);
    }
    cloneArgs.push(candidate.source.sourceUrl, repoDir);
    await runExec("git", cloneArgs, { timeoutMs: 180_000 });
  }
  const rev = await checkCommand("git", ["-C", repoDir, "rev-parse", "HEAD"]);
  return {
    ...candidate,
    state: "fetched",
    sandbox: {
      path: repoDir,
      fetchedAt: new Date().toISOString(),
    },
    provenance: {
      ...candidate.provenance,
      sourceRef: rev.ok ? rev.details : candidate.provenance.sourceRef,
      fetchedFrom: repoDir,
    },
  };
}

async function fetchLocalCandidate(
  candidate: CapabilityFoundryCandidate,
  env: NodeJS.ProcessEnv,
): Promise<CapabilityFoundryCandidate> {
  const localPath = candidate.source.localPath;
  if (!(await pathExists(localPath))) {
    return {
      ...candidate,
      state: "rejected",
      test: {
        status: "failed",
        summary: `missing local source: ${localPath ?? "n/a"}`,
        testedAt: new Date().toISOString(),
      },
      rejectedAt: new Date().toISOString(),
      rejectionReason: `missing local source: ${localPath ?? "n/a"}`,
      scope: "rejected",
    };
  }
  const sandboxDir = resolveFoundrySandboxDir(candidate.id, env);
  await fs.mkdir(sandboxDir, { recursive: true });
  await writeJsonAtomic(path.join(sandboxDir, "source.json"), {
    source: candidate.source,
    registration: candidate.registration,
    discoveredAt: new Date().toISOString(),
  });
  return {
    ...candidate,
    state: "fetched",
    sandbox: {
      path: sandboxDir,
      fetchedAt: new Date().toISOString(),
    },
    provenance: {
      ...candidate.provenance,
      fetchedFrom: localPath,
    },
  };
}

export async function ingestCapabilityFoundryCandidates(params: FoundryIngestParams): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const { registry } = await discoverCapabilityFoundry(params);
  const selectedIds = new Set(params.ids);
  const updated: CapabilityFoundryCandidate[] = [];
  for (const candidate of registry.candidates) {
    if (!selectedIds.has(candidate.id)) {
      continue;
    }
    let next = candidate;
    if (candidate.source.kind === "local_repo") {
      next = await fetchLocalCandidate(candidate, params.env ?? process.env);
    } else if (candidate.source.kind === "npm_registry") {
      next = await fetchNpmCandidate(candidate, params.env ?? process.env);
    } else if (candidate.source.kind === "github_repo") {
      next = await fetchGithubRepoCandidate(candidate, params.env ?? process.env);
    }
    updated.push(next);
  }
  const persisted = await upsertCapabilityFoundryCandidates(updated, {
    env: params.env,
    workspaceDir: params.workspaceDir,
    supportedSources: registry.supportedSources,
    sourceCatalogRevision: registry.sourceCatalogRevision,
  });
  return {
    registry: persisted.registry,
    registryPath: persisted.registryPath,
    candidates: updated,
  };
}

async function inspectFoundryCandidate(
  candidate: CapabilityFoundryCandidate,
  params: FoundryDiscoverParams,
): Promise<CapabilityFoundryCandidate> {
  const now = new Date().toISOString();
  if (candidate.state === "rejected") {
    return candidate;
  }
  if (candidate.type === "skill") {
    const localPath = candidate.source.localPath;
    const skillPath = localPath ? path.join(localPath, "SKILL.md") : undefined;
    if (!(await pathExists(skillPath))) {
      return {
        ...candidate,
        state: "rejected",
        scope: "rejected",
        rejectedAt: now,
        rejectionReason: "SKILL.md missing",
        test: {
          status: "failed",
          summary: "SKILL.md missing",
          testedAt: now,
        },
      };
    }
    return {
      ...candidate,
      state: "inspected",
      sandbox: {
        path: candidate.sandbox?.path ?? resolveFoundrySandboxDir(candidate.id, params.env),
        fetchedAt: candidate.sandbox?.fetchedAt,
        inspectedAt: now,
      },
      test: {
        ...candidate.test,
        status: "pending",
        summary: "Skill source inspected and ready for sandbox validation.",
      },
    };
  }
  if (candidate.type === "plugin") {
    const config = params.config ?? loadConfig();
    const pluginRegistry = loadPluginManifestRegistry({
      config,
      workspaceDir: params.workspaceDir,
    });
    const pluginId = candidate.registration?.targetId;
    if (!pluginRegistry.plugins.some((plugin) => plugin.id === pluginId)) {
      return {
        ...candidate,
        state: "rejected",
        scope: "rejected",
        rejectedAt: now,
        rejectionReason: `plugin ${pluginId ?? candidate.id} not loadable`,
        test: {
          status: "failed",
          summary: `plugin ${pluginId ?? candidate.id} not loadable`,
          testedAt: now,
        },
      };
    }
    return {
      ...candidate,
      state: "inspected",
      sandbox: {
        path: candidate.sandbox?.path ?? resolveFoundrySandboxDir(candidate.id, params.env),
        fetchedAt: candidate.sandbox?.fetchedAt,
        inspectedAt: now,
      },
      test: {
        ...candidate.test,
        status: "pending",
        summary: "Plugin manifest registry inspection passed.",
      },
    };
  }
  if (candidate.type === "mcp_server") {
    const packed =
      candidate.provenance.fetchedFrom && (await pathExists(candidate.provenance.fetchedFrom));
    return {
      ...candidate,
      state: "inspected",
      sandbox: {
        path: candidate.sandbox?.path ?? resolveFoundrySandboxDir(candidate.id, params.env),
        fetchedAt: candidate.sandbox?.fetchedAt,
        inspectedAt: now,
      },
      test: {
        ...candidate.test,
        status: packed ? "pending" : "failed",
        summary: packed
          ? "Registry package fetched and ready for sandbox validation."
          : "Registry package missing fetched artifact.",
      },
    };
  }
  if (candidate.type === "repo_integration") {
    const repoDir = candidate.sandbox?.path;
    const readmeExists = await pathExists(repoDir ? path.join(repoDir, "README.md") : undefined);
    const packageExists = await pathExists(
      repoDir ? path.join(repoDir, "package.json") : undefined,
    );
    const pyprojectExists = await pathExists(
      repoDir ? path.join(repoDir, "pyproject.toml") : undefined,
    );
    const ok = readmeExists || packageExists || pyprojectExists;
    return {
      ...candidate,
      state: ok ? "inspected" : "rejected",
      scope: ok ? candidate.scope : "rejected",
      sandbox: {
        path: candidate.sandbox?.path ?? resolveFoundrySandboxDir(candidate.id, params.env),
        fetchedAt: candidate.sandbox?.fetchedAt,
        inspectedAt: now,
      },
      rejectedAt: ok ? candidate.rejectedAt : now,
      rejectionReason: ok ? candidate.rejectionReason : "repo clone missing expected project files",
      test: {
        ...candidate.test,
        status: ok ? "pending" : "failed",
        summary: ok
          ? "Repo integration clone inspected successfully."
          : "Repo clone missing expected project files.",
      },
    };
  }
  const assetPath = candidate.source.localPath;
  const ok = await pathExists(assetPath);
  return {
    ...candidate,
    state: ok ? "inspected" : "rejected",
    scope: ok ? candidate.scope : "rejected",
    sandbox: {
      path: candidate.sandbox?.path ?? resolveFoundrySandboxDir(candidate.id, params.env),
      fetchedAt: candidate.sandbox?.fetchedAt,
      inspectedAt: now,
    },
    rejectedAt: ok ? candidate.rejectedAt : now,
    rejectionReason: ok ? candidate.rejectionReason : "asset dependency source missing",
    test: {
      ...candidate.test,
      status: ok ? "pending" : "failed",
      summary: ok ? "Asset dependency inspected successfully." : "Asset dependency source missing.",
    },
  };
}

export async function inspectCapabilityFoundryRegistry(
  params: FoundryDiscoverParams & {
    ids?: string[];
  },
): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const { registry } = await discoverCapabilityFoundry(params);
  const ids = params.ids ? new Set(params.ids) : undefined;
  const inspected = await Promise.all(
    registry.candidates
      .filter((candidate) => (ids ? ids.has(candidate.id) : true))
      .map((candidate) => inspectFoundryCandidate(candidate, params)),
  );
  const persisted = await upsertCapabilityFoundryCandidates(inspected, {
    env: params.env,
    workspaceDir: params.workspaceDir,
    supportedSources: registry.supportedSources,
    sourceCatalogRevision: registry.sourceCatalogRevision,
  });
  for (const candidate of inspected) {
    await writeFoundryProof(candidate, params.env);
  }
  return {
    registry: persisted.registry,
    registryPath: persisted.registryPath,
    candidates: inspected,
  };
}

async function testFoundryCandidate(
  candidate: CapabilityFoundryCandidate,
  params: FoundryDiscoverParams,
): Promise<CapabilityFoundryCandidate> {
  const now = new Date().toISOString();
  const proofPath = resolveFoundryProofPath(candidate.id, params.env);
  if (candidate.state === "rejected") {
    return candidate;
  }
  if (candidate.type === "skill") {
    const localPath = candidate.source.localPath;
    if (!localPath) {
      return {
        ...candidate,
        state: "rejected",
        scope: "rejected",
        rejectedAt: now,
        rejectionReason: "skill missing local path",
        test: { status: "failed", summary: "skill missing local path", testedAt: now, proofPath },
      };
    }
    const summary = await scanDirectoryWithSummary(localPath);
    const passed = summary.critical === 0;
    return {
      ...candidate,
      state: "tested",
      test: {
        status: passed ? "passed" : "failed",
        summary: passed
          ? `Security scan passed with ${summary.warn} warning(s).`
          : `Security scan found ${summary.critical} critical finding(s).`,
        testedAt: now,
        proofPath,
      },
      rejectionReason: passed ? candidate.rejectionReason : "security scan failed",
      rejectedAt: passed ? candidate.rejectedAt : now,
      scope: passed ? candidate.scope : "rejected",
    };
  }
  if (candidate.type === "plugin") {
    return {
      ...candidate,
      state: "tested",
      test: {
        status: "passed",
        summary: "Plugin manifest registry validation passed.",
        testedAt: now,
        proofPath,
      },
    };
  }
  if (candidate.type === "mcp_server") {
    const packed =
      candidate.provenance.fetchedFrom && (await pathExists(candidate.provenance.fetchedFrom));
    return {
      ...candidate,
      state: "tested",
      test: {
        status: packed ? "passed" : "failed",
        summary: packed
          ? "Registry tarball fetched and registration command recorded."
          : "Registry tarball missing; ingestion incomplete.",
        testedAt: now,
        proofPath,
      },
      rejectionReason: packed ? candidate.rejectionReason : "registry tarball missing",
      rejectedAt: packed ? candidate.rejectedAt : now,
      scope: packed ? candidate.scope : "rejected",
    };
  }
  if (candidate.type === "repo_integration") {
    const repoDir = candidate.sandbox?.path;
    const readmeExists = await pathExists(repoDir ? path.join(repoDir, "README.md") : undefined);
    const packageExists = await pathExists(
      repoDir ? path.join(repoDir, "package.json") : undefined,
    );
    const pyprojectExists = await pathExists(
      repoDir ? path.join(repoDir, "pyproject.toml") : undefined,
    );
    const passed = readmeExists || packageExists || pyprojectExists;
    return {
      ...candidate,
      state: "tested",
      test: {
        status: passed ? "passed" : "failed",
        summary: passed
          ? "Repo integration clone contains expected project files."
          : "Repo integration clone missing expected project files.",
        testedAt: now,
        proofPath,
      },
      rejectionReason: passed
        ? candidate.rejectionReason
        : "repo clone missing expected project files",
      rejectedAt: passed ? candidate.rejectedAt : now,
      scope: passed ? candidate.scope : "rejected",
    };
  }
  const assetExists = await pathExists(candidate.source.localPath);
  return {
    ...candidate,
    state: "tested",
    test: {
      status: assetExists ? "passed" : "failed",
      summary: assetExists
        ? "Asset dependency path is available for bundling."
        : "Asset dependency source path missing.",
      testedAt: now,
      proofPath,
    },
    rejectionReason: assetExists ? candidate.rejectionReason : "asset dependency source missing",
    rejectedAt: assetExists ? candidate.rejectedAt : now,
    scope: assetExists ? candidate.scope : "rejected",
  };
}

export async function sandboxTestCapabilityFoundryCandidates(
  params: FoundryDiscoverParams & {
    ids?: string[];
  },
): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const inspected = await inspectCapabilityFoundryRegistry(params);
  const ids = params.ids ? new Set(params.ids) : undefined;
  const tested = await Promise.all(
    inspected.registry.candidates
      .filter((candidate) => (ids ? ids.has(candidate.id) : true))
      .map((candidate) => testFoundryCandidate(candidate, params)),
  );
  for (const candidate of tested) {
    const proofPath = await writeFoundryProof(candidate, params.env);
    candidate.test.proofPath = proofPath;
  }
  const persisted = await upsertCapabilityFoundryCandidates(tested, {
    env: params.env,
    workspaceDir: params.workspaceDir,
    supportedSources: inspected.registry.supportedSources,
    sourceCatalogRevision: inspected.registry.sourceCatalogRevision,
  });
  return {
    registry: persisted.registry,
    registryPath: persisted.registryPath,
    candidates: tested,
  };
}

export async function promoteCapabilityFoundryCandidates(params: FoundryPromoteParams): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const tested = await sandboxTestCapabilityFoundryCandidates(params);
  const ids = new Set(params.ids);
  const now = new Date().toISOString();
  const promoted = tested.registry.candidates
    .filter((candidate) => ids.has(candidate.id))
    .map((candidate) => {
      if (candidate.test.status !== "passed" || candidate.compatibility === "incompatible") {
        return {
          ...candidate,
          state: "rejected" as CapabilityFoundryState,
          scope: "rejected" as CapabilityFoundryScope,
          rejectedAt: now,
          rejectionReason:
            candidate.rejectionReason ??
            (candidate.test.status !== "passed"
              ? "candidate did not pass sandbox validation"
              : "candidate is incompatible"),
        } satisfies CapabilityFoundryCandidate;
      }
      return {
        ...candidate,
        state: (params.bundle || candidate.scope === "bundled"
          ? "bundled"
          : "promoted") as CapabilityFoundryState,
        scope: (params.bundle || candidate.scope === "bundled"
          ? "bundled"
          : candidate.scope) as CapabilityFoundryScope,
        promotedAt: now,
        rejectedAt: undefined,
        rejectionReason: undefined,
      } satisfies CapabilityFoundryCandidate;
    });
  for (const candidate of promoted) {
    await writeFoundryProof(candidate, params.env);
  }
  const persisted = await upsertCapabilityFoundryCandidates(promoted, {
    env: params.env,
    workspaceDir: params.workspaceDir,
    supportedSources: tested.registry.supportedSources,
    sourceCatalogRevision: tested.registry.sourceCatalogRevision,
  });
  return {
    registry: persisted.registry,
    registryPath: persisted.registryPath,
    candidates: promoted,
  };
}

export async function rejectCapabilityFoundryCandidates(
  params: FoundryPromoteParams & {
    reason: string;
  },
): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const { registry } = await discoverCapabilityFoundry(params);
  const now = new Date().toISOString();
  const ids = new Set(params.ids);
  const rejected = registry.candidates
    .filter((candidate) => ids.has(candidate.id))
    .map(
      (candidate) =>
        ({
          ...candidate,
          state: "rejected" as CapabilityFoundryState,
          scope: "rejected" as CapabilityFoundryScope,
          rejectedAt: now,
          rejectionReason: params.reason.trim(),
          test: {
            ...candidate.test,
            status: (candidate.test.status === "passed"
              ? "passed"
              : "failed") as CapabilityFoundryTestStatus,
            summary: params.reason.trim(),
            testedAt: now,
          },
        }) satisfies CapabilityFoundryCandidate,
    );
  for (const candidate of rejected) {
    await writeFoundryProof(candidate, params.env);
  }
  const persisted = await upsertCapabilityFoundryCandidates(rejected, {
    env: params.env,
    workspaceDir: params.workspaceDir,
    supportedSources: registry.supportedSources,
    sourceCatalogRevision: registry.sourceCatalogRevision,
  });
  return {
    registry: persisted.registry,
    registryPath: persisted.registryPath,
    candidates: rejected,
  };
}

function scoreFoundryCandidate(
  candidate: CapabilityFoundryCandidate,
  objective: string,
): {
  score: number;
  reasons: string[];
} {
  const normalized = normalizeCapabilityObjective(objective);
  const tokens = normalized.split(/\s+/u).filter(Boolean);
  const matchedHints = candidate.classification.objectiveHints.filter((hint) =>
    tokens.some(
      (token) => token.includes(hint) || hint.includes(token) || normalized.includes(hint),
    ),
  );
  const matchedTags = candidate.classification.tags.filter((tag) =>
    tokens.some((token) => token.includes(tag) || tag.includes(token) || normalized.includes(tag)),
  );
  const score =
    matchedHints.length * 6 +
    matchedTags.length * 2 +
    candidate.usage.success * 3 +
    candidate.usage.suggested -
    candidate.usage.failure * 2 +
    (candidate.state === "bundled" ? 2 : candidate.state === "promoted" ? 1 : 0);
  const reasons = [
    ...matchedHints.map((hint) => `hint:${hint}`),
    ...matchedTags.map((tag) => `tag:${tag}`),
    ...(candidate.usage.success > 0 ? [`usage:success=${candidate.usage.success}`] : []),
    ...(candidate.usage.failure > 0 ? [`usage:failure=${candidate.usage.failure}`] : []),
  ];
  return { score, reasons };
}

export async function buildCapabilityFoundryRoutes(params: FoundryRouteParams): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  routes: CapabilityFoundryRoute[];
}> {
  const discovered = await discoverCapabilityFoundry(params);
  const routes = discovered.registry.candidates
    .filter((candidate) => candidate.state === "promoted" || candidate.state === "bundled")
    .map((candidate) => {
      const scored = scoreFoundryCandidate(candidate, params.objective);
      return {
        candidateId: candidate.id,
        name: candidate.name,
        type: candidate.type,
        score: scored.score,
        reasons: scored.reasons,
        scope: candidate.scope,
        state: candidate.state,
        sourceUrl: candidate.source.sourceUrl,
        registration: candidate.registration,
        usage: candidate.usage,
      } satisfies CapabilityFoundryRoute;
    })
    .filter((route) => route.score > 0)
    .toSorted((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.name.localeCompare(right.name);
    })
    .slice(0, params.limit ?? 8);
  return {
    registry: discovered.registry,
    registryPath: discovered.registryPath,
    routes,
  };
}

export async function recordCapabilityFoundryRouteUsage(params: {
  objective: string;
  routes: CapabilityFoundryRoute[];
  outcome: CapabilityFoundryOutcome;
  env?: NodeJS.ProcessEnv;
  missionId?: string;
  note?: string;
}): Promise<void> {
  if (params.routes.length === 0) {
    return;
  }
  await recordCapabilityFoundryUsage(
    params.routes.map((route) => ({
      candidateId: route.candidateId,
      objective: params.objective,
      outcome: params.outcome,
      recordedAt: new Date().toISOString(),
      missionId: params.missionId,
      note: params.note,
    })),
    params.env,
  );
}

export async function refreshCapabilityFoundry(params: FoundryRefreshParams): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  bundled: CapabilityFoundryCandidate[];
  promoted: CapabilityFoundryCandidate[];
  discovered: number;
  rejected: number;
}> {
  const discovered = await discoverCapabilityFoundry(params);
  const defaultIds = discovered.registry.candidates
    .filter(
      (candidate) =>
        candidate.scope === "bundled" ||
        candidate.registration?.autoBundled === true ||
        candidate.type === "asset_dependency",
    )
    .map((candidate) => candidate.id);
  const targets = params.includeRemote
    ? discovered.registry.candidates.map((candidate) => candidate.id)
    : defaultIds;
  if (targets.length > 0) {
    await ingestCapabilityFoundryCandidates({
      ...params,
      ids: targets,
    });
    await sandboxTestCapabilityFoundryCandidates({
      ...params,
      ids: targets,
    });
    await promoteCapabilityFoundryCandidates({
      ...params,
      ids: targets,
      bundle: true,
    });
  }
  const finalRegistry = await loadCapabilityFoundryRegistry(params.env);
  return {
    registry: finalRegistry,
    registryPath: path.join(
      resolveStateDir(params.env ?? process.env),
      "capabilities",
      "foundry",
      "registry.json",
    ),
    bundled: finalRegistry.candidates.filter((candidate) => candidate.state === "bundled"),
    promoted: finalRegistry.candidates.filter((candidate) => candidate.state === "promoted"),
    discovered: finalRegistry.candidates.length,
    rejected: finalRegistry.candidates.filter((candidate) => candidate.state === "rejected").length,
  };
}

export { buildCapabilityPlan };
