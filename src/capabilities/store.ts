import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { CAPABILITY_CATALOG_REVISION } from "./catalog.js";
import type {
  CapabilityFoundryCandidate,
  CapabilityFoundryRegistry,
  CapabilityFoundryUsageRecord,
  CapabilityRecord,
  CapabilityRegistry,
} from "./types.js";

function resolveManifestPath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "capabilities", "manifest.json");
}

function resolveFoundryRegistryPath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "capabilities", "foundry", "registry.json");
}

function resolveFoundryUsagePath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "capabilities", "foundry", "usage.jsonl");
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);
}

function normalizeRecord(record: CapabilityRecord): CapabilityRecord {
  const checkedAt =
    typeof record.checkedAt === "string" ? record.checkedAt : new Date().toISOString();
  return {
    ...record,
    checkedAt,
    matchedHints: record.matchedHints ? [...new Set(record.matchedHints)] : undefined,
  };
}

function normalizeFoundryCandidate(
  candidate: CapabilityFoundryCandidate,
): CapabilityFoundryCandidate {
  return {
    ...candidate,
    source: {
      ...candidate.source,
      dependencies: [...new Set(candidate.source.dependencies ?? [])],
    },
    classification: {
      ...candidate.classification,
      objectiveHints: [...new Set(candidate.classification.objectiveHints ?? [])],
      tags: [...new Set(candidate.classification.tags ?? [])],
      selectionNotes: [...new Set(candidate.classification.selectionNotes ?? [])],
    },
    provenance: {
      ...candidate.provenance,
      dependencies: [...new Set(candidate.provenance.dependencies ?? [])],
    },
    registration: candidate.registration
      ? {
          ...candidate.registration,
          routeHints: [...new Set(candidate.registration.routeHints ?? [])],
        }
      : undefined,
    usage: {
      suggested: Math.max(0, candidate.usage?.suggested ?? 0),
      success: Math.max(0, candidate.usage?.success ?? 0),
      failure: Math.max(0, candidate.usage?.failure ?? 0),
      lastOutcome: candidate.usage?.lastOutcome,
      lastUsedAt: candidate.usage?.lastUsedAt,
    },
    notes: candidate.notes ? [...new Set(candidate.notes)] : undefined,
  };
}

export async function loadCapabilityRegistry(
  env: NodeJS.ProcessEnv = process.env,
): Promise<CapabilityRegistry> {
  const manifestPath = resolveManifestPath(env);
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as {
      version?: number;
      generatedAt?: string;
      catalogRevision?: string;
      objective?: string;
      records?: CapabilityRecord[];
    };
    if (parsed.version === 2 && Array.isArray(parsed.records)) {
      return {
        version: 2,
        generatedAt:
          typeof parsed.generatedAt === "string" && parsed.generatedAt.trim()
            ? parsed.generatedAt
            : new Date(0).toISOString(),
        catalogRevision:
          typeof parsed.catalogRevision === "string" && parsed.catalogRevision.trim()
            ? parsed.catalogRevision
            : CAPABILITY_CATALOG_REVISION,
        objective:
          typeof parsed.objective === "string" && parsed.objective.trim()
            ? parsed.objective.trim()
            : undefined,
        records: parsed.records.map(normalizeRecord),
      };
    }
    if (Number(parsed.version) === 1 && Array.isArray(parsed.records)) {
      return {
        version: 2,
        generatedAt: new Date(0).toISOString(),
        catalogRevision: CAPABILITY_CATALOG_REVISION,
        records: parsed.records.map(normalizeRecord),
      };
    }
  } catch {}
  return {
    version: 2,
    generatedAt: new Date(0).toISOString(),
    catalogRevision: CAPABILITY_CATALOG_REVISION,
    records: [],
  };
}

export const loadCapabilityManifest = loadCapabilityRegistry;

export async function loadCapabilityFoundryRegistry(
  env: NodeJS.ProcessEnv = process.env,
): Promise<CapabilityFoundryRegistry> {
  const registryPath = resolveFoundryRegistryPath(env);
  try {
    const raw = await fs.readFile(registryPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CapabilityFoundryRegistry>;
    if (parsed.version === 1 && Array.isArray(parsed.candidates) && Array.isArray(parsed.usage)) {
      return {
        version: 1,
        generatedAt:
          typeof parsed.generatedAt === "string" && parsed.generatedAt.trim()
            ? parsed.generatedAt
            : new Date(0).toISOString(),
        updatedAt:
          typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
            ? parsed.updatedAt
            : new Date(0).toISOString(),
        sourceCatalogRevision:
          typeof parsed.sourceCatalogRevision === "string" && parsed.sourceCatalogRevision.trim()
            ? parsed.sourceCatalogRevision
            : CAPABILITY_CATALOG_REVISION,
        workspaceDir:
          typeof parsed.workspaceDir === "string" && parsed.workspaceDir.trim()
            ? parsed.workspaceDir
            : undefined,
        supportedSources: Array.isArray(parsed.supportedSources)
          ? [
              ...new Set(
                parsed.supportedSources.filter(
                  (value): value is string => typeof value === "string",
                ),
              ),
            ]
          : [],
        candidates: parsed.candidates.map(normalizeFoundryCandidate),
        usage: parsed.usage.filter(
          (entry): entry is CapabilityFoundryUsageRecord =>
            Boolean(entry) &&
            typeof entry.candidateId === "string" &&
            typeof entry.objective === "string" &&
            typeof entry.outcome === "string" &&
            typeof entry.recordedAt === "string",
        ),
      };
    }
  } catch {}
  return {
    version: 1,
    generatedAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    sourceCatalogRevision: CAPABILITY_CATALOG_REVISION,
    supportedSources: [],
    candidates: [],
    usage: [],
  };
}

export async function saveCapabilityRegistry(
  registry: CapabilityRegistry,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const manifestPath = resolveManifestPath(env);
  await writeJsonAtomic(manifestPath, registry);
  return manifestPath;
}

export async function saveCapabilityFoundryRegistry(
  registry: CapabilityFoundryRegistry,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const registryPath = resolveFoundryRegistryPath(env);
  await writeJsonAtomic(registryPath, {
    ...registry,
    candidates: registry.candidates.map(normalizeFoundryCandidate),
  });
  return registryPath;
}

export async function saveCapabilityRecords(
  records: CapabilityRecord[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  return await saveCapabilityRegistry(
    {
      version: 2,
      generatedAt: new Date().toISOString(),
      catalogRevision: CAPABILITY_CATALOG_REVISION,
      records: records.map(normalizeRecord),
    },
    env,
  );
}

export async function upsertCapabilityRecords(
  records: CapabilityRecord[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const manifest = await loadCapabilityRegistry(env);
  const next = new Map(manifest.records.map((record) => [record.id, record] as const));
  for (const record of records) {
    next.set(record.id, normalizeRecord(record));
  }
  return await saveCapabilityRegistry(
    {
      version: 2,
      generatedAt: new Date().toISOString(),
      catalogRevision: CAPABILITY_CATALOG_REVISION,
      objective: manifest.objective,
      records: Array.from(next.values()),
    },
    env,
  );
}

export async function upsertCapabilityFoundryCandidates(
  candidates: CapabilityFoundryCandidate[],
  params: {
    env?: NodeJS.ProcessEnv;
    workspaceDir?: string;
    supportedSources?: string[];
    sourceCatalogRevision?: string;
  } = {},
): Promise<{ registry: CapabilityFoundryRegistry; registryPath: string }> {
  const env = params.env ?? process.env;
  const existing = await loadCapabilityFoundryRegistry(env);
  const next = new Map(existing.candidates.map((candidate) => [candidate.id, candidate] as const));
  for (const candidate of candidates) {
    next.set(candidate.id, normalizeFoundryCandidate(candidate));
  }
  const registry: CapabilityFoundryRegistry = {
    version: 1,
    generatedAt:
      existing.generatedAt && existing.generatedAt !== new Date(0).toISOString()
        ? existing.generatedAt
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceCatalogRevision: params.sourceCatalogRevision ?? existing.sourceCatalogRevision,
    workspaceDir: params.workspaceDir ?? existing.workspaceDir,
    supportedSources:
      params.supportedSources && params.supportedSources.length > 0
        ? [...new Set(params.supportedSources)]
        : existing.supportedSources,
    candidates: Array.from(next.values()),
    usage: existing.usage,
  };
  const registryPath = await saveCapabilityFoundryRegistry(registry, env);
  return { registry, registryPath };
}

export async function recordCapabilityFoundryUsage(
  usageRecords: CapabilityFoundryUsageRecord[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ registry: CapabilityFoundryRegistry; registryPath: string; usagePath: string }> {
  const registry = await loadCapabilityFoundryRegistry(env);
  if (usageRecords.length === 0) {
    return {
      registry,
      registryPath: resolveFoundryRegistryPath(env),
      usagePath: resolveFoundryUsagePath(env),
    };
  }
  const candidateMap = new Map(
    registry.candidates.map(
      (candidate) => [candidate.id, normalizeFoundryCandidate(candidate)] as const,
    ),
  );
  const normalizedUsage = usageRecords.map((record) => ({
    ...record,
    objective: record.objective.trim(),
    recordedAt: record.recordedAt || new Date().toISOString(),
  }));
  for (const usage of normalizedUsage) {
    const candidate = candidateMap.get(usage.candidateId);
    if (!candidate) {
      continue;
    }
    candidate.usage.lastOutcome = usage.outcome;
    candidate.usage.lastUsedAt = usage.recordedAt;
    if (usage.outcome === "suggested") {
      candidate.usage.suggested += 1;
    } else if (usage.outcome === "success") {
      candidate.usage.success += 1;
    } else if (usage.outcome === "failure") {
      candidate.usage.failure += 1;
    }
  }
  const nextRegistry: CapabilityFoundryRegistry = {
    ...registry,
    updatedAt: new Date().toISOString(),
    candidates: Array.from(candidateMap.values()),
    usage: [...registry.usage, ...normalizedUsage].slice(-500),
  };
  const registryPath = await saveCapabilityFoundryRegistry(nextRegistry, env);
  const usagePath = resolveFoundryUsagePath(env);
  await fs.mkdir(path.dirname(usagePath), { recursive: true });
  await fs.appendFile(
    usagePath,
    normalizedUsage.map((entry) => JSON.stringify(entry)).join("\n") + "\n",
    "utf8",
  );
  return { registry: nextRegistry, registryPath, usagePath };
}
