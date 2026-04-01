import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import type {
  CapabilityFoundryApprovalStatus,
  CapabilityFoundryClassification,
  CapabilityFoundryCompatibility,
  CapabilityFoundryInstallMethod,
  CapabilityFoundryRuntimeRegistration,
  CapabilityFoundrySource,
  CapabilityFoundrySourceFamily,
  CapabilityFoundrySourceKind,
  CapabilityFoundryTestResult,
} from "./types.js";

export type FoundryCatalogSourceKind = "local_repo" | "github_repo" | "npm_registry";

export type FoundryCatalogCapabilityKind =
  | "skill"
  | "plugin"
  | "mcp_server"
  | "repo_integration"
  | "asset_dependency";

export type FoundryCatalogSource = {
  id: string;
  familyId: string;
  label: string;
  kind: FoundryCatalogCapabilityKind;
  sourceKind: FoundryCatalogSourceKind;
  sourceUrl: string;
  installMethod: string;
  dependencies: string[];
  runtimeHint: string;
  origin: "bundled" | "curated" | "remote";
  bundled: boolean;
  repo?: string;
  packageName?: string;
  ref?: string;
  localPath?: string;
  notes?: string;
};

export type FoundryCatalogFamily = {
  id: string;
  label: string;
  summary: string;
  sourceKind: FoundryCatalogSourceKind;
  trustLevel: "bundled" | "curated" | "remote";
  sources: FoundryCatalogSource[];
};

export type FoundryCatalogReadyCapability = {
  id: string;
  label: string;
  kind: FoundryCatalogCapabilityKind;
  familyId: string;
  sourceUrl: string;
  runtimeHint: string;
  bundled: boolean;
  notes?: string;
};

export const CAPABILITY_FOUNDRY_SOURCE_CATALOG_REVISION = "2026-04-02";

const GITHUB_BASE = "https://github.com/rebootix-research/viki-clow/tree/main";

function localRepoUrl(basePath: string): string {
  return `${GITHUB_BASE}/${basePath}`;
}

export const CAPABILITY_FOUNDRY_SOURCE_FAMILIES: FoundryCatalogFamily[] = [
  {
    id: "bundled_skill",
    label: "Bundled skills",
    summary: "Local skills shipped with Vikiclow and ready for immediate workspace bootstrap.",
    sourceKind: "local_repo",
    trustLevel: "bundled",
    sources: [
      {
        id: "skill:viki-skill-factory",
        familyId: "bundled_skill",
        label: "Viki Skill Factory",
        kind: "skill",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("skills/viki-skill-factory"),
        installMethod: "workspace_copy",
        dependencies: ["node"],
        runtimeHint: "Generate reusable mission skills and workflow skills.",
        origin: "bundled",
        bundled: true,
        localPath: "skills/viki-skill-factory",
      },
      {
        id: "skill:cursor-control",
        familyId: "bundled_skill",
        label: "Cursor Control",
        kind: "skill",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("skills/cursor-control"),
        installMethod: "workspace_copy",
        dependencies: ["node"],
        runtimeHint: "Convert desktop actions into deterministic control steps.",
        origin: "bundled",
        bundled: true,
        localPath: "skills/cursor-control",
      },
      {
        id: "skill:openai-whisper",
        familyId: "bundled_skill",
        label: "OpenAI Whisper",
        kind: "skill",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("skills/openai-whisper"),
        installMethod: "download",
        dependencies: ["uv", "python"],
        runtimeHint: "Provision local transcription support for voice missions.",
        origin: "bundled",
        bundled: true,
        localPath: "skills/openai-whisper",
      },
      {
        id: "skill:sherpa-onnx-tts",
        familyId: "bundled_skill",
        label: "Sherpa ONNX TTS",
        kind: "skill",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("skills/sherpa-onnx-tts"),
        installMethod: "download",
        dependencies: ["uv", "python"],
        runtimeHint: "Provision local speech synthesis and wake/readiness support.",
        origin: "bundled",
        bundled: true,
        localPath: "skills/sherpa-onnx-tts",
      },
    ],
  },
  {
    id: "bundled_plugin",
    label: "Bundled plugins",
    summary: "Runtime plugins that ship enabled or ready for safe local activation.",
    sourceKind: "local_repo",
    trustLevel: "bundled",
    sources: [
      {
        id: "plugin:workflow",
        familyId: "bundled_plugin",
        label: "Workflow",
        kind: "plugin",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("extensions/workflow"),
        installMethod: "plugin_enable",
        dependencies: ["node"],
        runtimeHint: "Route workflow missions through the curated workflow plugin.",
        origin: "bundled",
        bundled: true,
        localPath: "extensions/workflow",
      },
      {
        id: "plugin:memory-core",
        familyId: "bundled_plugin",
        label: "Memory Core",
        kind: "plugin",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("extensions/memory-core"),
        installMethod: "plugin_enable",
        dependencies: ["node"],
        runtimeHint: "Provide mission memory and writeback support.",
        origin: "bundled",
        bundled: true,
        localPath: "extensions/memory-core",
      },
      {
        id: "plugin:talk-voice",
        familyId: "bundled_plugin",
        label: "Talk Voice",
        kind: "plugin",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("extensions/talk-voice"),
        installMethod: "plugin_enable",
        dependencies: ["node"],
        runtimeHint: "Keep the voice command center available during bootstrap.",
        origin: "bundled",
        bundled: true,
        localPath: "extensions/talk-voice",
      },
      {
        id: "plugin:device-pair",
        familyId: "bundled_plugin",
        label: "Device Pair",
        kind: "plugin",
        sourceKind: "local_repo",
        sourceUrl: localRepoUrl("extensions/device-pair"),
        installMethod: "plugin_enable",
        dependencies: ["node"],
        runtimeHint: "Support paired-device mission handoff and control.",
        origin: "bundled",
        bundled: true,
        localPath: "extensions/device-pair",
      },
    ],
  },
  {
    id: "curated_mcp",
    label: "Curated MCP servers",
    summary: "Official or high-signal MCP servers that can be installed and sandboxed before promotion.",
    sourceKind: "npm_registry",
    trustLevel: "curated",
    sources: [
      {
        id: "mcp:filesystem",
        familyId: "curated_mcp",
        label: "Filesystem MCP Server",
        kind: "mcp_server",
        sourceKind: "npm_registry",
        sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem",
        installMethod: "npm_pack",
        dependencies: ["node", "npm"],
        runtimeHint: "Read and write workspace files through MCP.",
        origin: "curated",
        bundled: false,
        packageName: "@modelcontextprotocol/server-filesystem",
      },
      {
        id: "mcp:fetch",
        familyId: "curated_mcp",
        label: "Fetch MCP Server",
        kind: "mcp_server",
        sourceKind: "npm_registry",
        sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-fetch",
        installMethod: "npm_pack",
        dependencies: ["node", "npm"],
        runtimeHint: "Provide a safe HTTP fetch surface for capability discovery.",
        origin: "curated",
        bundled: false,
        packageName: "@modelcontextprotocol/server-fetch",
      },
      {
        id: "mcp:github",
        familyId: "curated_mcp",
        label: "GitHub MCP Server",
        kind: "mcp_server",
        sourceKind: "npm_registry",
        sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-github",
        installMethod: "npm_pack",
        dependencies: ["node", "npm"],
        runtimeHint: "Connect missions to curated GitHub actions and issue workflows.",
        origin: "curated",
        bundled: false,
        packageName: "@modelcontextprotocol/server-github",
      },
    ],
  },
  {
    id: "curated_repo",
    label: "Curated GitHub integrations",
    summary: "Selected high-signal repositories that can be cloned, inspected, and promoted.",
    sourceKind: "github_repo",
    trustLevel: "curated",
    sources: [
      {
        id: "repo:graphiti",
        familyId: "curated_repo",
        label: "Graphiti",
        kind: "repo_integration",
        sourceKind: "github_repo",
        sourceUrl: "https://github.com/getzep/graphiti",
        installMethod: "git_clone",
        dependencies: ["git", "python"],
        runtimeHint: "Exercise temporal graph memory workflows and proof paths.",
        origin: "curated",
        bundled: false,
        repo: "getzep/graphiti",
        ref: "main",
      },
      {
        id: "repo:langgraph",
        familyId: "curated_repo",
        label: "LangGraph",
        kind: "repo_integration",
        sourceKind: "github_repo",
        sourceUrl: "https://github.com/langchain-ai/langgraph",
        installMethod: "git_clone",
        dependencies: ["git", "python"],
        runtimeHint: "Validate durable orchestration and subgraph routing.",
        origin: "curated",
        bundled: false,
        repo: "langchain-ai/langgraph",
        ref: "main",
      },
      {
        id: "repo:temporal",
        familyId: "curated_repo",
        label: "Temporal SDK",
        kind: "repo_integration",
        sourceKind: "github_repo",
        sourceUrl: "https://github.com/temporalio/sdk-typescript",
        installMethod: "git_clone",
        dependencies: ["git", "node"],
        runtimeHint: "Support durable mission runtime and workflow-backed execution.",
        origin: "curated",
        bundled: false,
        repo: "temporalio/sdk-typescript",
        ref: "main",
      },
      {
        id: "repo:temporal-sdk-typescript",
        familyId: "curated_repo",
        label: "Temporal SDK TypeScript",
        kind: "repo_integration",
        sourceKind: "github_repo",
        sourceUrl: "https://github.com/temporalio/sdk-typescript",
        installMethod: "git_clone",
        dependencies: ["git", "node"],
        runtimeHint: "Support durable mission runtime and workflow-backed execution.",
        origin: "curated",
        bundled: false,
        repo: "temporalio/sdk-typescript",
        ref: "main",
      },
    ],
  },
  {
    id: "curated_asset",
    label: "Curated runtime assets",
    summary: "Runtime dependencies and asset packs that keep bundled capabilities ready to use.",
    sourceKind: "github_repo",
    trustLevel: "curated",
    sources: [
      {
        id: "asset:sherpa-onnx",
        familyId: "curated_asset",
        label: "Sherpa ONNX release assets",
        kind: "asset_dependency",
        sourceKind: "github_repo",
        sourceUrl: "https://github.com/k2-fsa/sherpa-onnx/releases",
        installMethod: "download",
        dependencies: ["uv", "python"],
        runtimeHint: "Local voice runtime models and backend assets.",
        origin: "curated",
        bundled: true,
        repo: "k2-fsa/sherpa-onnx",
        ref: "releases",
      },
    ],
  },
];

export const CAPABILITY_FOUNDRY_READY_CAPABILITIES: FoundryCatalogReadyCapability[] =
  CAPABILITY_FOUNDRY_SOURCE_FAMILIES.flatMap((family) =>
    family.sources
      .filter((source) => source.bundled)
      .map((source) => ({
        id: source.id,
        label: source.label,
        kind: source.kind,
        familyId: family.id,
        sourceUrl: source.sourceUrl,
        runtimeHint: source.runtimeHint,
        bundled: source.bundled,
        notes: source.notes,
      })),
  );

export type FoundryApprovedCatalogEntry = FoundryCatalogReadyCapability & {
  catalogId: string;
  family: string;
  name: string;
  type: FoundryCatalogCapabilityKind;
  summary: string;
  compatibility: CapabilityFoundryCompatibility;
  scope: "bundled" | "optional" | "experimental" | "rejected";
  source: CapabilityFoundrySource;
  classification: CapabilityFoundryClassification;
  provenance: {
    version?: string;
    license?: string;
    sourceRef?: string;
    repository?: string;
    registry?: string;
    homepage?: string;
    author?: string;
    artifactDigest?: string;
    dependencies: string[];
    fetchedFrom?: string;
  };
  registration?: CapabilityFoundryRuntimeRegistration;
  sourceCatalogId?: string;
  sourceCatalogEntryId?: string;
  sourceFamily?: CapabilityFoundrySourceFamily;
  approval?: "approved" | "experimental" | "blocked";
  test?: CapabilityFoundryTestResult;
};

export type FoundryApprovedCatalog = {
  catalogId: string;
  supportedSources: string[];
  sourceCatalogRevision: string;
  entries: FoundryApprovedCatalogEntry[];
};

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, current) => {
    if (Array.isArray(current)) {
      return current;
    }
    if (current && typeof current === "object") {
      return Object.keys(current as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((accumulator, key) => {
          accumulator[key] = (current as Record<string, unknown>)[key];
          return accumulator;
        }, {});
    }
    return current;
  });
}

function hashFoundryCatalogEntries(entries: FoundryApprovedCatalogEntry[]): string {
  return createHash("sha256")
    .update(stableStringify(entries))
    .digest("hex")
    .slice(0, 12);
}

function resolveFoundrySourceFamily(
  familyId: string,
): FoundryApprovedCatalogEntry["sourceFamily"] {
  switch (familyId) {
    case "bundled-skills":
      return "bundled_skill";
    case "bundled-plugins":
      return "bundled_plugin";
    case "curated-mcp":
      return "curated_mcp";
    case "curated-github":
      return "curated_repo";
    case "curated-assets":
      return "curated_asset";
    default:
      return familyId.replace(/-/g, "_") as FoundryApprovedCatalogEntry["sourceFamily"];
  }
}

function resolveSupportedSourceLabel(familyId: string): string {
  switch (familyId) {
    case "bundled-skills":
      return "repo-skills";
    case "bundled-plugins":
      return "repo-plugins";
    case "curated-mcp":
      return "npm-mcp";
    case "curated-github":
    case "curated-assets":
      return "github-repo";
    default:
      return familyId;
  }
}

function resolveFoundrySourceKind(sourceUrl: string, installMethod: string): FoundryCatalogSourceKind {
  if (installMethod === "download") {
    return "github_repo";
  }
  if (sourceUrl.includes("npmjs.com")) {
    return "npm_registry";
  }
  return "local_repo";
}

function resolveFoundrySourceKindForCatalog(source: FoundryCatalogSource): CapabilityFoundrySourceKind {
  if (source.sourceKind === "npm_registry") {
    return "npm_registry";
  }
  if (source.sourceKind === "github_repo") {
    return "github_repo";
  }
  return "local_repo";
}

function resolveCompatibility(source: FoundryCatalogSource): CapabilityFoundryCompatibility {
  if (source.origin === "remote") {
    return "manual";
  }
  return source.bundled ? "compatible" : "wrapped";
}

function resolveScope(source: FoundryCatalogSource): "bundled" | "optional" | "experimental" | "rejected" {
  if (source.origin === "remote") {
    return "experimental";
  }
  return source.bundled ? "bundled" : "optional";
}

function resolveApproval(source: FoundryCatalogSource): CapabilityFoundryApprovalStatus {
  return source.origin === "remote" ? "experimental" : "approved";
}

function buildClassification(source: FoundryCatalogSource): CapabilityFoundryClassification {
  return {
    objectiveHints: [...new Set([source.familyId, source.kind, ...(source.notes ? [source.notes] : [])])],
    tags: [...new Set([source.familyId, source.kind, source.origin, ...(source.notes ? [source.notes] : [])])],
    selectionNotes: [
      `family:${source.familyId}`,
      `origin:${source.origin}`,
      source.bundled ? "bundled:true" : "bundled:false",
    ],
  };
}

function buildSource(source: FoundryCatalogSource): CapabilityFoundrySource {
  return {
    kind: resolveFoundrySourceKindForCatalog(source),
    sourceUrl: source.sourceUrl,
    repo: source.repo,
    packageName: source.packageName,
    ref: source.ref,
    localPath: source.localPath,
    installMethod: source.installMethod as CapabilityFoundryInstallMethod,
    dependencies: [...new Set(source.dependencies)],
    notes: source.notes,
  };
}

function buildProvenance(source: FoundryCatalogSource) {
  return {
    version: source.ref,
    license: undefined,
    sourceRef: source.ref,
    repository: source.repo,
    registry: source.packageName,
    homepage: source.sourceUrl,
    author: undefined,
    artifactDigest: undefined,
    dependencies: [...new Set(source.dependencies)],
    fetchedFrom: source.sourceUrl,
  };
}

function buildRegistration(source: FoundryCatalogSource): CapabilityFoundryRuntimeRegistration | undefined {
  if (source.kind === "skill") {
    return {
      kind: "skill",
      targetId: source.id,
      entrypoint: source.localPath ?? source.sourceUrl,
      path: source.localPath,
      autoBundled: source.bundled,
      routeHints: [source.familyId, source.kind, source.runtimeHint],
      usageRecipe: source.runtimeHint,
    };
  }
  if (source.kind === "plugin") {
    return {
      kind: "plugin",
      targetId: source.id,
      entrypoint: source.localPath ?? source.sourceUrl,
      path: source.localPath,
      autoBundled: source.bundled,
      routeHints: [source.familyId, source.kind, source.runtimeHint],
      usageRecipe: source.runtimeHint,
    };
  }
  if (source.kind === "mcp_server") {
    return {
      kind: "mcp_server",
      targetId: source.packageName ?? source.id,
      entrypoint: source.packageName ?? source.id,
      command: "npx",
      args: ["-y", source.packageName ?? source.id],
      autoBundled: source.bundled,
      routeHints: [source.familyId, source.kind, source.runtimeHint],
      usageRecipe: source.runtimeHint,
    };
  }
  if (source.kind === "repo_integration") {
    return {
      kind: "repo_integration",
      targetId: source.repo ?? source.id,
      entrypoint: source.localPath ?? source.sourceUrl,
      path: source.localPath,
      autoBundled: source.bundled,
      routeHints: [source.familyId, source.kind, source.runtimeHint],
      usageRecipe: source.runtimeHint,
    };
  }
  return {
    kind: "asset_dependency",
    targetId: source.id,
    entrypoint: source.localPath ?? source.sourceUrl,
    path: source.localPath,
    autoBundled: source.bundled,
    routeHints: [source.familyId, source.kind, source.runtimeHint],
    usageRecipe: source.runtimeHint,
  };
}

function mapFamilySource(
  family: FoundryCatalogFamily,
  source: FoundryCatalogSource,
  catalogId: string,
): FoundryApprovedCatalogEntry {
  return {
    id: source.id,
    catalogId,
    family: family.id,
    label: source.label,
    name: source.label,
    kind: source.kind,
    type: source.kind,
    familyId: family.id,
    sourceUrl: source.sourceUrl,
    runtimeHint: source.runtimeHint,
    bundled: source.bundled,
    notes: source.notes,
    summary: source.runtimeHint,
    compatibility: resolveCompatibility(source),
    scope: resolveScope(source),
    source: buildSource(source),
    classification: buildClassification(source),
    provenance: buildProvenance(source),
    registration: buildRegistration(source),
    sourceCatalogId: catalogId,
    sourceCatalogEntryId: source.id,
    sourceFamily: resolveFoundrySourceFamily(family.id),
    approval: resolveApproval(source),
    test: {
      status: "pending",
      summary: "Curated capability awaiting runtime promotion.",
    },
  };
}

function normalizeOverrideEntries(entries: Array<Record<string, unknown>>, catalogId: string): FoundryApprovedCatalogEntry[] {
  return entries.map((entry, index) => {
    const provenance = (entry.provenance ?? {}) as Record<string, unknown>;
    const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `${catalogId}:${index + 1}`;
    const label = typeof entry.label === "string" && entry.label.trim()
      ? entry.label.trim()
      : typeof entry.name === "string" && entry.name.trim()
        ? entry.name.trim()
        : id;
    const familyId = typeof entry.familyId === "string" && entry.familyId.trim()
      ? entry.familyId.trim()
      : typeof entry.family === "string" && entry.family.trim()
        ? entry.family.trim()
        : "curated_repo";
    const kind = (entry.kind === "skill" ||
      entry.kind === "plugin" ||
      entry.kind === "mcp_server" ||
      entry.kind === "repo_integration" ||
      entry.kind === "asset_dependency")
      ? entry.kind
      : "repo_integration";
    const sourceUrl = typeof entry.sourceUrl === "string" && entry.sourceUrl.trim()
      ? entry.sourceUrl.trim()
      : `https://example.invalid/${id}`;
    const source: FoundryCatalogSource = {
      id,
      familyId,
      label,
      kind,
      sourceKind: resolveFoundrySourceKind(sourceUrl, typeof entry.installMethod === "string" ? entry.installMethod : "workspace_copy"),
      sourceUrl,
      installMethod: typeof entry.installMethod === "string" ? entry.installMethod : "workspace_copy",
      dependencies: Array.isArray(entry.dependencies)
        ? entry.dependencies.filter((value): value is string => typeof value === "string")
        : [],
      runtimeHint:
        typeof entry.runtimeHint === "string" && entry.runtimeHint.trim()
          ? entry.runtimeHint.trim()
          : typeof entry.description === "string" && entry.description.trim()
            ? entry.description.trim()
            : label,
      origin:
        entry.origin === "bundled" || entry.origin === "remote" || entry.origin === "curated"
          ? entry.origin
          : "curated",
      bundled: entry.bundled === false || entry.bundle === false ? false : true,
      repo:
        typeof entry.repo === "string"
          ? entry.repo
          : typeof provenance.repository === "string"
            ? provenance.repository
            : undefined,
      packageName:
        typeof entry.packageName === "string"
          ? entry.packageName
          : typeof provenance.registry === "string"
            ? provenance.registry
            : undefined,
      ref:
        typeof entry.ref === "string"
          ? entry.ref
          : typeof provenance.ref === "string"
            ? provenance.ref
            : undefined,
      localPath:
        typeof entry.localPath === "string"
          ? entry.localPath
          : typeof provenance.localPath === "string"
            ? provenance.localPath
            : undefined,
      notes: Array.isArray(entry.notes)
        ? entry.notes.filter((value): value is string => typeof value === "string").join("; ")
        : typeof entry.notes === "string"
          ? entry.notes
          : undefined,
    };
    return mapFamilySource(
      {
        id: familyId,
        label: familyId,
        summary: familyId,
        sourceKind: source.sourceKind,
        trustLevel: source.origin,
        sources: [],
      },
      source,
      catalogId,
    );
  });
}

function buildCatalogId(): string {
  return "vikiclow.foundry.approved";
}

export function buildApprovedFoundryCatalog(): FoundryApprovedCatalog {
  const catalogId = buildCatalogId();
  const entries = CAPABILITY_FOUNDRY_SOURCE_FAMILIES.flatMap((family) =>
    family.sources.map((source) => mapFamilySource(family, source, catalogId)),
  );
  return {
    catalogId,
    supportedSources: [...new Set(entries.map((entry) => `${entry.sourceFamily}:${entry.kind}`))].sort(
      (left, right) => left.localeCompare(right),
    ),
    sourceCatalogRevision: hashFoundryCatalogEntries(entries),
    entries,
  };
}

export async function loadApprovedFoundryCatalog(params: {
  rootDir?: string;
  env?: NodeJS.ProcessEnv;
} = {}): Promise<FoundryApprovedCatalog> {
  const builtin = buildApprovedFoundryCatalog();
  const rootDir = params.rootDir?.trim() ? path.resolve(params.rootDir) : process.cwd();
  const env = params.env ?? process.env;
  const overridePath =
    env.VIKICLOW_FOUNDRY_CATALOG_PATH?.trim() ||
    path.join(rootDir, ".vikiclow", "foundry", "catalog.json");
  try {
    const raw = await fs.readFile(overridePath, "utf8");
    const parsed = JSON.parse(raw) as { catalogId?: string; entries?: Array<Record<string, unknown>> };
    const overrideEntries = Array.isArray(parsed.entries)
      ? normalizeOverrideEntries(parsed.entries, parsed.catalogId?.trim() || builtin.catalogId)
      : [];
    const entries = [...builtin.entries, ...overrideEntries];
    return {
      catalogId: parsed.catalogId?.trim() || builtin.catalogId,
      supportedSources: [...new Set(entries.map((entry) => `${entry.sourceFamily}:${entry.kind}`))].sort(
        (left, right) => left.localeCompare(right),
      ),
      sourceCatalogRevision: hashFoundryCatalogEntries(entries),
      entries,
    };
  } catch {
    return builtin;
  }
}

export function computeFoundryCatalogRevision(entries: FoundryApprovedCatalogEntry[]): string {
  return hashFoundryCatalogEntries(entries);
}
