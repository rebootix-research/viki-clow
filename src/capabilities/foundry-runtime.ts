import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { normalizeCapabilityObjective } from "./catalog.js";
import { loadCapabilityFoundryRegistry, upsertCapabilityFoundryCandidates } from "./store.js";
import type {
  CapabilityFoundryApprovalStatus,
  CapabilityFoundryCandidate,
  CapabilityFoundryCompatibility,
  CapabilityFoundryRegistry,
  CapabilityFoundryRoute,
  CapabilityFoundryScope,
  CapabilityFoundrySourceCatalog,
  CapabilityFoundrySourceCatalogEntry,
  CapabilityFoundrySourceKind,
  CapabilityFoundryState,
  CapabilityFoundryUsageSummary,
} from "./types.js";

function resolveFoundryRegistryPath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "capabilities", "foundry", "registry.json");
}

function sourceKindForFamily(
  family: CapabilityFoundrySourceCatalogEntry["family"],
): CapabilityFoundrySourceKind {
  switch (family) {
    case "bundled_skill":
    case "bundled_plugin":
      return "local_repo";
    case "curated_mcp":
      return "npm_registry";
    case "curated_repo":
      return "github_repo";
    case "curated_asset":
      return "local_repo";
    default: {
      const exhaustive: never = family;
      return exhaustive;
    }
  }
}

function compatibilityForApproval(
  approval: CapabilityFoundryApprovalStatus,
): CapabilityFoundryCompatibility {
  if (approval === "blocked") {
    return "incompatible";
  }
  if (approval === "experimental") {
    return "wrapped";
  }
  return "compatible";
}

function scopeForEntry(entry: CapabilityFoundrySourceCatalogEntry): CapabilityFoundryScope {
  if (entry.approval === "blocked") {
    return "rejected";
  }
  return entry.bundle ? "bundled" : "optional";
}

function targetIdForEntry(entry: CapabilityFoundrySourceCatalogEntry): string {
  return entry.id.replace(/^[^:]+:/u, "");
}

function usageRecipeForEntry(entry: CapabilityFoundrySourceCatalogEntry): string | undefined {
  const trimmedDescription = entry.description.trim();
  if (!trimmedDescription) {
    return undefined;
  }
  return `Use ${entry.name} when ${trimmedDescription.toLowerCase()}.`;
}

function buildUsageSummary(
  existing?: CapabilityFoundryUsageSummary,
): CapabilityFoundryUsageSummary {
  return {
    suggested: existing?.suggested ?? 0,
    success: existing?.success ?? 0,
    failure: existing?.failure ?? 0,
    lastOutcome: existing?.lastOutcome,
    lastUsedAt: existing?.lastUsedAt,
  };
}

function materializeCandidateFromEntry(
  entry: CapabilityFoundrySourceCatalogEntry,
  catalog: CapabilityFoundrySourceCatalog,
  existing?: CapabilityFoundryCandidate,
): CapabilityFoundryCandidate {
  const now = new Date().toISOString();
  const sourceUrl = entry.sourceUrl.trim();
  return {
    id: entry.id,
    name: entry.name,
    type: entry.kind,
    summary: entry.description,
    compatibility: compatibilityForApproval(entry.approval),
    scope: existing?.scope ?? scopeForEntry(entry),
    state: existing?.state ?? (entry.bundle ? "bundled" : "discovered"),
    source: {
      kind: sourceKindForFamily(entry.family),
      sourceUrl,
      repo: entry.provenance.repository,
      packageName: entry.provenance.registry,
      ref: entry.ref,
      installMethod: entry.installMethod,
      dependencies: [...entry.dependencies],
      notes: entry.notes?.join("; "),
    },
    sourceCatalogId: existing?.sourceCatalogId ?? catalog.id,
    sourceCatalogEntryId: existing?.sourceCatalogEntryId ?? entry.id,
    sourceFamily: existing?.sourceFamily ?? entry.family,
    approval: existing?.approval ?? entry.approval,
    classification: {
      objectiveHints: [...entry.routeHints],
      tags: [entry.family, entry.kind, ...(entry.bundle ? ["bundled"] : ["curated"])],
      selectionNotes:
        entry.notes && entry.notes.length > 0
          ? [...entry.notes]
          : [entry.description, `catalog:${catalog.id}`],
    },
    lifecycleReceipt: existing?.lifecycleReceipt ?? {
      discoveredAt: now,
    },
    provenance: {
      dependencies: [...entry.dependencies],
      version: existing?.provenance.version ?? entry.ref,
      license: existing?.provenance.license ?? entry.provenance.license,
      sourceRef: existing?.provenance.sourceRef ?? entry.ref,
      repository: existing?.provenance.repository ?? entry.provenance.repository,
      registry: existing?.provenance.registry ?? entry.provenance.registry,
      homepage: existing?.provenance.homepage ?? entry.provenance.homepage,
      author: existing?.provenance.author ?? entry.provenance.author,
      artifactDigest: existing?.provenance.artifactDigest,
      fetchedFrom: existing?.provenance.fetchedFrom ?? sourceUrl,
    },
    test: existing?.test ?? {
      status: "pending",
      summary: entry.testCommand
        ? `Ready to run ${entry.testCommand.join(" ")}`
        : "Candidate not yet tested.",
    },
    registration: existing?.registration ?? {
      kind: entry.kind,
      targetId: targetIdForEntry(entry),
      entrypoint: entry.runtimeEntrypoint ?? sourceUrl,
      autoBundled: entry.bundle,
      routeHints: [...entry.routeHints],
      usageRecipe: usageRecipeForEntry(entry),
    },
    usage: buildUsageSummary(existing?.usage),
    notes: [...new Set([...(existing?.notes ?? []), ...(entry.notes ?? [])])],
  };
}

function materializeCandidatesFromRegistry(
  registry: CapabilityFoundryRegistry,
): CapabilityFoundryCandidate[] {
  const existingById = new Map(
    registry.candidates.map((candidate) => [candidate.id, candidate] as const),
  );
  const materialized: CapabilityFoundryCandidate[] = [];
  for (const catalog of registry.sourceCatalogs ?? []) {
    for (const entry of catalog.entries) {
      materialized.push(materializeCandidateFromEntry(entry, catalog, existingById.get(entry.id)));
    }
  }
  for (const candidate of registry.candidates) {
    if (!materialized.some((entry) => entry.id === candidate.id)) {
      materialized.push(candidate);
    }
  }
  return materialized.toSorted((left, right) => left.name.localeCompare(right.name));
}

function scoreCandidateForObjective(
  candidate: CapabilityFoundryCandidate,
  objective: string,
): { score: number; reasons: string[] } {
  const normalizedObjective = normalizeCapabilityObjective(objective);
  const matchedHints = candidate.classification.objectiveHints.filter((hint) =>
    normalizedObjective.includes(hint),
  );
  const reasons = matchedHints.length > 0 ? matchedHints.map((hint) => `hint:${hint}`) : [];
  if (candidate.scope === "bundled") {
    reasons.push("bundled");
  }
  if (candidate.registration?.autoBundled) {
    reasons.push("auto-bundled");
  }
  if (candidate.usage.success > 0) {
    reasons.push(`usage:success=${candidate.usage.success}`);
  }
  if (candidate.usage.failure > 0) {
    reasons.push(`usage:failure=${candidate.usage.failure}`);
  }
  const score =
    matchedHints.length * 3 +
    (candidate.scope === "bundled" ? 3 : 0) +
    (candidate.registration?.autoBundled ? 2 : 0) +
    candidate.usage.success * 2 -
    candidate.usage.failure +
    (candidate.state === "promoted" || candidate.state === "bundled" ? 2 : 0);
  return {
    score,
    reasons: reasons.length > 0 ? reasons : ["catalog"],
  };
}

function mapCandidateToRoute(
  candidate: CapabilityFoundryCandidate,
  objective: string,
): CapabilityFoundryRoute & { score: number } {
  const scored = scoreCandidateForObjective(candidate, objective);
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
    scoreReceipt: candidate.scoreReceipt,
  };
}

export async function loadCuratedFoundryRegistry(
  params: {
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
}> {
  const registry = await loadCapabilityFoundryRegistry(params.env);
  return {
    registry,
    registryPath: resolveFoundryRegistryPath(params.env),
  };
}

export async function discoverCuratedCapabilityFoundry(
  params: {
    env?: NodeJS.ProcessEnv;
    objective?: string;
  } = {},
): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const loaded = await loadCuratedFoundryRegistry(params);
  const candidates = materializeCandidatesFromRegistry(loaded.registry);
  return {
    ...loaded,
    candidates,
  };
}

export async function routeCuratedCapabilityFoundry(params: {
  env?: NodeJS.ProcessEnv;
  objective: string;
  limit?: number;
}): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  routes: CapabilityFoundryRoute[];
}> {
  const discovered = await discoverCuratedCapabilityFoundry(params);
  const routes = discovered.candidates
    .filter(
      (candidate) =>
        candidate.state === "promoted" ||
        candidate.state === "bundled" ||
        candidate.test.status === "passed" ||
        candidate.approval === "approved",
    )
    .map((candidate) => mapCandidateToRoute(candidate, params.objective))
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

export async function updateCuratedFoundryCandidates(params: {
  env?: NodeJS.ProcessEnv;
  ids: string[];
  decision: "inspect" | "test" | "promote" | "reject" | "bundle" | "ingest";
  reason?: string;
  objective?: string;
}): Promise<{
  registry: CapabilityFoundryRegistry;
  registryPath: string;
  candidates: CapabilityFoundryCandidate[];
}> {
  const discovered = await discoverCuratedCapabilityFoundry({
    env: params.env,
    objective: params.objective,
  });
  const now = new Date().toISOString();
  const ids = new Set(params.ids);
  const next: CapabilityFoundryCandidate[] = materializeCandidatesFromRegistry(
    discovered.registry,
  ).map((candidate) => {
    if (!ids.has(candidate.id)) {
      return candidate;
    }
    if (params.decision === "reject") {
      return {
        ...candidate,
        state: "rejected" as CapabilityFoundryState,
        scope: "rejected" as CapabilityFoundryScope,
        rejectedAt: now,
        rejectionReason: params.reason?.trim() || "Rejected by operator",
        test: {
          ...candidate.test,
          status: "failed",
          summary: params.reason?.trim() || "Rejected by operator",
          testedAt: now,
        },
        notes: [...new Set([...(candidate.notes ?? []), "decision:rejected"])],
      };
    }
    if (params.decision === "promote" || params.decision === "bundle") {
      return {
        ...candidate,
        state: (params.decision === "bundle" || candidate.scope === "bundled"
          ? "bundled"
          : "promoted") as CapabilityFoundryState,
        scope: (params.decision === "bundle" || candidate.scope === "bundled"
          ? "bundled"
          : candidate.scope) as CapabilityFoundryScope,
        promotedAt: now,
        rejectedAt: undefined,
        rejectionReason: undefined,
        test: {
          ...candidate.test,
          status: "passed",
          summary: candidate.test.summary || "Candidate promoted from curated source catalog.",
          testedAt: candidate.test.testedAt ?? now,
        },
        notes: [...new Set([...(candidate.notes ?? []), "decision:promoted"])],
      };
    }
    if (params.decision === "inspect") {
      return {
        ...candidate,
        state: "inspected",
        test: {
          ...candidate.test,
          status: candidate.test.status === "failed" ? "failed" : "pending",
          summary: "Candidate inspected from curated source catalog.",
          testedAt: candidate.test.testedAt,
        },
        notes: [...new Set([...(candidate.notes ?? []), "stage:inspect"])],
      };
    }
    if (params.decision === "test") {
      return {
        ...candidate,
        state: "tested",
        test: {
          ...candidate.test,
          status: candidate.test.status === "failed" ? "failed" : "passed",
          summary: "Candidate sandbox validation completed from curated source catalog.",
          testedAt: now,
        },
        notes: [...new Set([...(candidate.notes ?? []), "stage:sandbox"])],
      };
    }
    if (params.decision === "ingest") {
      return {
        ...candidate,
        state: "fetched",
        lifecycleReceipt: {
          ...candidate.lifecycleReceipt,
          fetchedAt: now,
        },
        test: {
          ...candidate.test,
          status: candidate.test.status === "failed" ? "failed" : "pending",
          summary: "Candidate fetched from curated source catalog.",
          testedAt: candidate.test.testedAt,
        },
        notes: [...new Set([...(candidate.notes ?? []), "stage:ingest"])],
      };
    }
    return candidate;
  });
  const persisted = await upsertCapabilityFoundryCandidates(next, {
    env: params.env,
    supportedSources: discovered.registry.supportedSources,
    sourceCatalogRevision: discovered.registry.sourceCatalogRevision,
  });
  return {
    registry: persisted.registry,
    registryPath: persisted.registryPath,
    candidates: next.filter((candidate) => ids.has(candidate.id)),
  };
}
