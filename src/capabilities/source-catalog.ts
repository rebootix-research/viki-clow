import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  CapabilityFoundryKind,
  CapabilityFoundrySourceCatalog,
  CapabilityFoundrySourceCatalogEntry,
  CapabilityFoundrySourceFamily,
  CapabilityFoundryInstallMethod,
  CapabilityFoundryApprovalStatus,
} from "./types.js";

export type CapabilityFoundrySourceCatalogLoadParams = {
  rootDir?: string;
  env?: NodeJS.ProcessEnv;
  includeBuiltins?: boolean;
};

export const DEFAULT_FOUNDRY_SOURCE_CATALOG_RELATIVE_PATHS = [
  path.join(".vikiclow", "capabilities", "sources.json"),
  path.join(".vikiclow", "capabilities", "foundry-sources.json"),
  path.join("config", "capabilities", "foundry-sources.json"),
  path.join("config", "capabilities-foundry.sources.json"),
  path.join("capabilities", "foundry-sources.json"),
  path.join("capabilities", "sources.json"),
] as const;

const ENV_CATALOG_PATH_KEYS = [
  "VIKICLOW_FOUNDRY_SOURCE_CATALOG_PATHS",
  "VIKICLOW_CAPABILITY_SOURCE_CATALOG_PATHS",
  "VIKICLOW_FOUNDRY_CATALOG_PATH",
  "VIKICLOW_FOUNDRY_CATALOG_PATHS",
] as const;

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, current) => {
    if (Array.isArray(current)) {
      return current;
    }
    if (current && typeof current === "object") {
      return Object.keys(current as Record<string, unknown>)
        .toSorted()
        .reduce<Record<string, unknown>>((accumulator, key) => {
          accumulator[key] = (current as Record<string, unknown>)[key];
          return accumulator;
        }, {});
    }
    return current;
  });
}

function hashCatalogEntries(entries: CapabilityFoundrySourceCatalogEntry[]): string {
  return createHash("sha256").update(stableStringify(entries)).digest("hex").slice(0, 12);
}

function resolveCatalogPaths(params: CapabilityFoundrySourceCatalogLoadParams = {}): string[] {
  const rootDir = params.rootDir?.trim() ? path.resolve(params.rootDir) : process.cwd();
  const env = params.env ?? process.env;
  const explicit = ENV_CATALOG_PATH_KEYS.flatMap((key) => {
    const raw = env[key]?.trim();
    if (!raw) {
      return [];
    }
    return raw
      .split(path.delimiter)
      .flatMap((chunk) => chunk.split(","))
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => (path.isAbsolute(entry) ? entry : path.resolve(rootDir, entry)));
  });
  if (explicit.length > 0) {
    return [...new Set(explicit)];
  }
  return DEFAULT_FOUNDRY_SOURCE_CATALOG_RELATIVE_PATHS.map((relative) =>
    path.resolve(rootDir, relative),
  );
}

function dedupeStrings(values: Array<string | undefined | null>): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim()),
    ),
  ];
}

function normalizeInstallMethod(value: unknown): CapabilityFoundryInstallMethod {
  if (
    value === "workspace_copy" ||
    value === "plugin_enable" ||
    value === "npm_pack" ||
    value === "git_clone" ||
    value === "download"
  ) {
    return value;
  }
  return "workspace_copy";
}

function normalizeFamily(value: unknown): CapabilityFoundrySourceFamily {
  if (
    value === "bundled_skill" ||
    value === "bundled_plugin" ||
    value === "curated_mcp" ||
    value === "curated_repo" ||
    value === "curated_asset"
  ) {
    return value;
  }
  return "curated_repo";
}

function normalizeApproval(value: unknown): CapabilityFoundryApprovalStatus {
  if (value === "approved" || value === "experimental" || value === "blocked") {
    return value;
  }
  return "approved";
}

function normalizeKind(value: unknown): CapabilityFoundryKind {
  if (
    value === "skill" ||
    value === "plugin" ||
    value === "mcp_server" ||
    value === "repo_integration" ||
    value === "asset_dependency"
  ) {
    return value;
  }
  return "repo_integration";
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? dedupeStrings(value.map((entry) => (typeof entry === "string" ? entry : undefined)))
    : [];
}

function normalizeCatalogEntry(
  raw: Partial<CapabilityFoundrySourceCatalogEntry> & Record<string, unknown>,
  fallbackId: string,
): CapabilityFoundrySourceCatalogEntry {
  const provenance = (raw.provenance ?? {}) as Record<string, unknown>;
  const family = normalizeFamily(raw.family);
  const kind = normalizeKind(raw.kind);
  const installMethod = normalizeInstallMethod(raw.installMethod);
  const bundle = typeof raw.bundle === "boolean" ? raw.bundle : true;
  const sourceUrl =
    typeof raw.sourceUrl === "string" && raw.sourceUrl.trim()
      ? raw.sourceUrl.trim()
      : `https://example.invalid/${fallbackId}`;
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : fallbackId,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : fallbackId,
    family,
    kind,
    sourceUrl,
    ref: typeof raw.ref === "string" && raw.ref.trim() ? raw.ref.trim() : undefined,
    installMethod,
    dependencies: normalizeStringArray(raw.dependencies),
    provenance: {
      repository:
        typeof provenance.repository === "string" && provenance.repository.trim()
          ? provenance.repository.trim()
          : undefined,
      registry:
        typeof provenance.registry === "string" && provenance.registry.trim()
          ? provenance.registry.trim()
          : undefined,
      homepage:
        typeof provenance.homepage === "string" && provenance.homepage.trim()
          ? provenance.homepage.trim()
          : undefined,
      license:
        typeof provenance.license === "string" && provenance.license.trim()
          ? provenance.license.trim()
          : undefined,
      author:
        typeof provenance.author === "string" && provenance.author.trim()
          ? provenance.author.trim()
          : undefined,
    },
    routeHints: normalizeStringArray(raw.routeHints),
    approval: normalizeApproval(raw.approval),
    bundle,
    testCommand: normalizeStringArray(raw.testCommand),
    runtimeEntrypoint:
      typeof raw.runtimeEntrypoint === "string" && raw.runtimeEntrypoint.trim()
        ? raw.runtimeEntrypoint.trim()
        : undefined,
    notes: normalizeStringArray(raw.notes),
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : `${fallbackId} capability source`,
  };
}

function normalizeCatalog(
  raw: Partial<CapabilityFoundrySourceCatalog> & Record<string, unknown>,
  sourcePath: string,
): CapabilityFoundrySourceCatalog {
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : path.basename(sourcePath).replace(/\.[^.]+$/u, "");
  const normalizedEntries = rawEntries
    .map((entry, index) =>
      normalizeCatalogEntry(
        (entry ?? {}) as Partial<CapabilityFoundrySourceCatalogEntry> & Record<string, unknown>,
        `${id}:${index + 1}`,
      ),
    )
    .toSorted((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind.localeCompare(right.kind);
      }
      return left.id.localeCompare(right.id);
    });
  const generatedAt =
    typeof raw.generatedAt === "string" && raw.generatedAt.trim()
      ? raw.generatedAt.trim()
      : new Date(0).toISOString();
  const updatedAt =
    typeof raw.updatedAt === "string" && raw.updatedAt.trim() ? raw.updatedAt.trim() : generatedAt;
  return {
    version: 1,
    id,
    sourcePath,
    generatedAt,
    updatedAt,
    catalogRevision:
      typeof raw.catalogRevision === "string" && raw.catalogRevision.trim()
        ? raw.catalogRevision.trim()
        : hashCatalogEntries(normalizedEntries),
    entries: normalizedEntries,
  };
}

function createCatalog(
  id: string,
  sourcePath: string,
  entries: CapabilityFoundrySourceCatalogEntry[],
): CapabilityFoundrySourceCatalog {
  return {
    version: 1,
    id,
    sourcePath,
    generatedAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    catalogRevision: hashCatalogEntries(entries),
    entries: entries.toSorted((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind.localeCompare(right.kind);
      }
      return left.id.localeCompare(right.id);
    }),
  };
}

function builtinCatalogs(): CapabilityFoundrySourceCatalog[] {
  const skills = createCatalog("vikiclow.bundled.skills", "builtin:skills", [
    {
      id: "skill:vikiclow-skills",
      name: "Vikiclow Skills",
      family: "bundled_skill",
      kind: "skill",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/skills/vikiclow-skills",
      ref: "main",
      installMethod: "workspace_copy",
      dependencies: ["node"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["skill", "workflow", "automation", "vikiclow"],
      approval: "approved",
      bundle: true,
      description: "Core Vikiclow skill pack shipped with the runtime.",
      notes: ["bundled-from-repo"],
    },
    {
      id: "skill:viki-skill-factory",
      name: "Viki Skill Factory",
      family: "bundled_skill",
      kind: "skill",
      sourceUrl:
        "https://github.com/rebootix-research/viki-clow/tree/main/skills/viki-skill-factory",
      ref: "main",
      installMethod: "workspace_copy",
      dependencies: ["node"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["skill", "workflow", "automation", "factory"],
      approval: "approved",
      bundle: true,
      description: "Reusable skill factory for building mission-ready Vikiclow skills.",
      notes: ["bundled-from-repo"],
    },
    {
      id: "skill:openai-whisper",
      name: "OpenAI Whisper Skill",
      family: "bundled_skill",
      kind: "skill",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/skills/openai-whisper",
      ref: "main",
      installMethod: "workspace_copy",
      dependencies: ["python"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["voice", "transcribe", "speech", "whisper"],
      approval: "approved",
      bundle: true,
      description: "Local speech-to-text skill for voice-native missions.",
      notes: ["voice-core"],
    },
    {
      id: "skill:sherpa-onnx-tts",
      name: "Sherpa ONNX TTS Skill",
      family: "bundled_skill",
      kind: "skill",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/skills/sherpa-onnx-tts",
      ref: "main",
      installMethod: "download",
      dependencies: ["python"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["voice", "speak", "tts", "audio"],
      approval: "approved",
      bundle: true,
      description: "Local text-to-speech runtime used by the mandatory voice lane.",
      notes: ["voice-core"],
    },
    {
      id: "skill:mcporter",
      name: "McPorter",
      family: "bundled_skill",
      kind: "skill",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/skills/mcporter",
      ref: "main",
      installMethod: "workspace_copy",
      dependencies: ["node"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["browser", "workflow", "publish", "automation"],
      approval: "approved",
      bundle: true,
      description: "Curated local skill for execution and transfer workflows.",
      notes: ["bundled-helper"],
    },
  ]);

  const plugins = createCatalog("vikiclow.bundled.plugins", "builtin:plugins", [
    {
      id: "plugin:workflow",
      name: "Workflow",
      family: "bundled_plugin",
      kind: "plugin",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/extensions/workflow",
      ref: "main",
      installMethod: "plugin_enable",
      dependencies: ["node"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["workflow", "automation", "skills", "mission"],
      approval: "approved",
      bundle: true,
      description: "Bundled workflow plugin that anchors the current foundry lane.",
      notes: ["runtime-plugin"],
    },
    {
      id: "plugin:memory-core",
      name: "Memory Core",
      family: "bundled_plugin",
      kind: "plugin",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/extensions/memory-core",
      ref: "main",
      installMethod: "plugin_enable",
      dependencies: ["node"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["memory", "graphiti", "usage", "persistence"],
      approval: "approved",
      bundle: true,
      description: "Bundled memory-routing plugin for mission writeback and recall.",
      notes: ["memory-routing"],
    },
    {
      id: "plugin:talk-voice",
      name: "Talk Voice",
      family: "bundled_plugin",
      kind: "plugin",
      sourceUrl: "https://github.com/rebootix-research/viki-clow/tree/main/extensions/talk-voice",
      ref: "main",
      installMethod: "plugin_enable",
      dependencies: ["node"],
      provenance: {
        repository: "rebootix-research/viki-clow",
        homepage: "https://github.com/rebootix-research/viki-clow",
      },
      routeHints: ["voice", "speak", "command center"],
      approval: "approved",
      bundle: true,
      description: "Voice command center plugin for runtime speech surfaces.",
      notes: ["voice-routing"],
    },
  ]);

  const mcp = createCatalog("vikiclow.curated.mcp", "builtin:mcp", [
    {
      id: "mcp:filesystem",
      name: "MCP Filesystem",
      family: "curated_mcp",
      kind: "mcp_server",
      sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem",
      ref: "latest",
      installMethod: "npm_pack",
      dependencies: ["node", "npm"],
      provenance: {
        registry: "npm",
        homepage: "https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem",
      },
      routeHints: ["filesystem", "files", "workspace"],
      approval: "approved",
      bundle: false,
      description: "Standards-based filesystem MCP server.",
      notes: ["curated-mcp"],
    },
    {
      id: "mcp:fetch",
      name: "MCP Fetch",
      family: "curated_mcp",
      kind: "mcp_server",
      sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-fetch",
      ref: "latest",
      installMethod: "npm_pack",
      dependencies: ["node", "npm"],
      provenance: {
        registry: "npm",
        homepage: "https://www.npmjs.com/package/@modelcontextprotocol/server-fetch",
      },
      routeHints: ["fetch", "web", "http", "browser"],
      approval: "experimental",
      bundle: false,
      description: "Curated fetch MCP server for deterministic HTTP extraction.",
      notes: ["curated-mcp"],
    },
    {
      id: "mcp:github",
      name: "MCP GitHub",
      family: "curated_mcp",
      kind: "mcp_server",
      sourceUrl: "https://www.npmjs.com/package/@modelcontextprotocol/server-github",
      ref: "latest",
      installMethod: "npm_pack",
      dependencies: ["node", "npm"],
      provenance: {
        registry: "npm",
        homepage: "https://www.npmjs.com/package/@modelcontextprotocol/server-github",
      },
      routeHints: ["github", "repo", "issue", "pull request"],
      approval: "experimental",
      bundle: false,
      description: "Curated GitHub MCP server for repository-aware missions.",
      notes: ["curated-mcp"],
    },
  ]);

  const repos = createCatalog("vikiclow.curated.repos", "builtin:repos", [
    {
      id: "repo:graphiti",
      name: "Graphiti",
      family: "curated_repo",
      kind: "repo_integration",
      sourceUrl: "https://github.com/getzep/graphiti",
      ref: "main",
      installMethod: "git_clone",
      dependencies: ["python", "neo4j"],
      provenance: {
        repository: "getzep/graphiti",
        homepage: "https://github.com/getzep/graphiti",
      },
      routeHints: ["memory", "graph", "retrieval", "neo4j"],
      approval: "approved",
      bundle: false,
      testCommand: ["python", "-m", "pytest"],
      description: "Graph memory integration used by Vikiclow persistence lanes.",
      notes: ["memory-backbone"],
    },
    {
      id: "repo:langgraph",
      name: "LangGraph",
      family: "curated_repo",
      kind: "repo_integration",
      sourceUrl: "https://github.com/langchain-ai/langgraph",
      ref: "main",
      installMethod: "git_clone",
      dependencies: ["python"],
      provenance: {
        repository: "langchain-ai/langgraph",
        homepage: "https://github.com/langchain-ai/langgraph",
      },
      routeHints: ["orchestration", "swarm", "graph", "workflow"],
      approval: "approved",
      bundle: false,
      testCommand: ["python", "-m", "pytest"],
      description: "Durable graph orchestration integration for agent swarms.",
      notes: ["orchestration-backbone"],
    },
    {
      id: "repo:temporal",
      name: "Temporal",
      family: "curated_repo",
      kind: "repo_integration",
      sourceUrl: "https://github.com/temporalio/temporal",
      ref: "main",
      installMethod: "git_clone",
      dependencies: ["go", "docker"],
      provenance: {
        repository: "temporalio/temporal",
        homepage: "https://github.com/temporalio/temporal",
      },
      routeHints: ["mission", "durable", "workflow", "replay"],
      approval: "approved",
      bundle: false,
      testCommand: ["go", "test", "./..."],
      description: "Durable mission runtime upstream used by the live stack.",
      notes: ["durable-runtime"],
    },
  ]);

  const assets = createCatalog("vikiclow.curated.assets", "builtin:assets", [
    {
      id: "asset:ffmpeg",
      name: "FFmpeg",
      family: "curated_asset",
      kind: "asset_dependency",
      sourceUrl: "https://ffmpeg.org/",
      ref: "stable",
      installMethod: "download",
      dependencies: ["audio", "video"],
      provenance: {
        homepage: "https://ffmpeg.org/",
      },
      routeHints: ["audio", "video", "media", "voice"],
      approval: "approved",
      bundle: true,
      testCommand: ["ffmpeg", "-version"],
      description: "Media asset dependency for voice and video workflows.",
      notes: ["media"],
    },
    {
      id: "asset:playwright-browsers",
      name: "Playwright Browsers",
      family: "curated_asset",
      kind: "asset_dependency",
      sourceUrl: "https://playwright.dev/docs/browsers",
      ref: "stable",
      installMethod: "download",
      dependencies: ["node"],
      provenance: {
        homepage: "https://playwright.dev/docs/browsers",
      },
      routeHints: ["browser", "trace", "screenshot", "automation"],
      approval: "approved",
      bundle: true,
      testCommand: ["pnpm", "exec", "playwright", "--version"],
      description: "Deterministic browser asset bundle for visible browser missions.",
      notes: ["browser-runtime"],
    },
  ]);

  return [skills, plugins, mcp, repos, assets];
}

export function computeCapabilityFoundrySourceCatalogRevision(
  catalogs: CapabilityFoundrySourceCatalog[],
): string {
  return createHash("sha256")
    .update(
      stableStringify(
        catalogs.map((catalog) => ({
          id: catalog.id,
          sourcePath: catalog.sourcePath,
          entries: catalog.entries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            family: entry.family,
            kind: entry.kind,
            sourceUrl: entry.sourceUrl,
            ref: entry.ref,
            installMethod: entry.installMethod,
            dependencies: entry.dependencies,
            provenance: entry.provenance,
            routeHints: entry.routeHints,
            approval: entry.approval,
            bundle: entry.bundle,
            testCommand: entry.testCommand,
            runtimeEntrypoint: entry.runtimeEntrypoint,
            notes: entry.notes,
            description: entry.description,
          })),
        })),
      ),
    )
    .digest("hex")
    .slice(0, 12);
}

export async function loadApprovedCapabilitySourceCatalogs(
  params: CapabilityFoundrySourceCatalogLoadParams = {},
): Promise<CapabilityFoundrySourceCatalog[]> {
  const catalogs = params.includeBuiltins === false ? [] : builtinCatalogs();
  const paths = resolveCatalogPaths(params);
  const loaded = await Promise.all(
    paths.map(async (catalogPath) => {
      try {
        const raw = await fs.readFile(catalogPath, "utf8");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const sourcePath = path.resolve(catalogPath);
        if (Array.isArray(parsed.catalogs)) {
          return parsed.catalogs.flatMap((entry, index) =>
            loadApprovedCapabilitySourceCatalogsFromObject(
              entry as Record<string, unknown>,
              `${sourcePath}#${index + 1}`,
            ),
          );
        }
        return loadApprovedCapabilitySourceCatalogsFromObject(parsed, sourcePath);
      } catch {
        return [];
      }
    }),
  );
  const merged = [...catalogs, ...loaded.flat()];
  const deduped = new Map<string, CapabilityFoundrySourceCatalog>();
  for (const catalog of merged) {
    deduped.set(`${catalog.sourcePath}:${catalog.id}`, catalog);
  }
  return Array.from(deduped.values()).toSorted((left, right) => {
    const sourcePath = left.sourcePath.localeCompare(right.sourcePath);
    if (sourcePath !== 0) {
      return sourcePath;
    }
    return left.id.localeCompare(right.id);
  });
}

function loadApprovedCapabilitySourceCatalogsFromObject(
  raw: Record<string, unknown>,
  sourcePath: string,
): CapabilityFoundrySourceCatalog[] {
  if (Array.isArray(raw.entries)) {
    return [normalizeCatalog(raw, sourcePath)];
  }
  if (Array.isArray(raw.capabilities)) {
    return [
      normalizeCatalog(
        {
          ...raw,
          entries: raw.capabilities,
        },
        sourcePath,
      ),
    ];
  }
  return [];
}

export function flattenCapabilityFoundrySourceCatalogEntries(
  catalogs: CapabilityFoundrySourceCatalog[],
): CapabilityFoundrySourceCatalogEntry[] {
  return catalogs.flatMap((catalog) => catalog.entries);
}
