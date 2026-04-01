import type {
  CapabilityFoundryCandidate,
  CapabilityFoundryRegistry,
  CapabilityFoundryRoute,
} from "./types.js";

function formatUsageSummary(usage: CapabilityFoundryCandidate["usage"]): string {
  const parts = [
    `suggested=${usage.suggested}`,
    `success=${usage.success}`,
    `failure=${usage.failure}`,
  ];
  if (usage.lastOutcome) {
    parts.push(`last=${usage.lastOutcome}`);
  }
  return parts.join(", ");
}

function formatStateCounts(candidates: CapabilityFoundryCandidate[]): string {
  const counts = {
    discovered: 0,
    fetched: 0,
    inspected: 0,
    sandboxed: 0,
    tested: 0,
    promoted: 0,
    rejected: 0,
    bundled: 0,
  } as Record<CapabilityFoundryCandidate["state"], number>;
  for (const candidate of candidates) {
    counts[candidate.state] += 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([state, count]) => `${state}=${count}`)
    .join(", ");
}

function formatScopeCounts(candidates: CapabilityFoundryCandidate[]): string {
  const counts = {
    bundled: 0,
    optional: 0,
    experimental: 0,
    rejected: 0,
  } as Record<CapabilityFoundryCandidate["scope"], number>;
  for (const candidate of candidates) {
    counts[candidate.scope] += 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([scope, count]) => `${scope}=${count}`)
    .join(", ");
}

export function formatFoundryCandidateLine(candidate: CapabilityFoundryCandidate): string {
  const sourceBits = [
    candidate.source.kind,
    candidate.source.repo ? `repo=${candidate.source.repo}` : null,
    candidate.source.packageName ? `pkg=${candidate.source.packageName}` : null,
    candidate.source.ref ? `ref=${candidate.source.ref}` : null,
  ].filter(Boolean);
  const provenanceBits = [
    candidate.provenance.version ? `version=${candidate.provenance.version}` : null,
    candidate.provenance.license ? `license=${candidate.provenance.license}` : null,
    candidate.provenance.sourceRef ? `sourceRef=${candidate.provenance.sourceRef}` : null,
  ].filter(Boolean);
  const registrationBits = candidate.registration
    ? [
        `autoBundled=${candidate.registration.autoBundled}`,
        `target=${candidate.registration.targetId}`,
        candidate.registration.entrypoint
          ? `entrypoint=${candidate.registration.entrypoint}`
          : null,
        candidate.registration.usageRecipe ? `recipe=${candidate.registration.usageRecipe}` : null,
      ].filter(Boolean)
    : [];
  const rejection = candidate.rejectionReason ? ` :: rejected=${candidate.rejectionReason}` : "";
  const proof = candidate.test.proofPath ? ` :: proof=${candidate.test.proofPath}` : "";
  return [
    `${candidate.id} :: ${candidate.name} :: ${candidate.type}`,
    `${candidate.scope}/${candidate.state}`,
    candidate.compatibility,
    `source=${sourceBits.join(" | ") || "unknown"}`,
    `test=${candidate.test.status}`,
    `usage={${formatUsageSummary(candidate.usage)}}`,
    provenanceBits.length > 0 ? `prov={${provenanceBits.join(", ")}}` : null,
    registrationBits.length > 0 ? `reg={${registrationBits.join(", ")}}` : null,
  ]
    .filter(Boolean)
    .join(" :: ")
    .concat(proof, rejection);
}

export function formatFoundryCandidateLines(candidates: CapabilityFoundryCandidate[]): string[] {
  if (candidates.length === 0) {
    return ["No Capability Foundry candidates recorded yet."];
  }
  return candidates.map(formatFoundryCandidateLine);
}

export function formatFoundryRouteLine(route: CapabilityFoundryRoute): string {
  const reasons = route.reasons.length > 0 ? route.reasons.join(", ") : "none";
  const registrationBits = route.registration
    ? [
        `autoBundled=${route.registration.autoBundled}`,
        route.registration.entrypoint ? `entrypoint=${route.registration.entrypoint}` : null,
        route.registration.usageRecipe ? `recipe=${route.registration.usageRecipe}` : null,
        route.registration.path ? `path=${route.registration.path}` : null,
      ].filter(Boolean)
    : [];
  return [
    `${route.candidateId} :: ${route.name} :: ${route.type}`,
    `${route.scope}/${route.state}`,
    `score=${route.score}`,
    `reasons=${reasons}`,
    `source=${route.sourceUrl}`,
    `usage={${formatUsageSummary(route.usage)}}`,
    registrationBits.length > 0 ? `route={${registrationBits.join(", ")}}` : null,
  ]
    .filter(Boolean)
    .join(" :: ");
}

export function formatFoundryRouteLines(routes: CapabilityFoundryRoute[]): string[] {
  if (routes.length === 0) {
    return ["No Foundry routes matched this objective."];
  }
  return routes.map(formatFoundryRouteLine);
}

export function formatFoundryRegistryInventoryLines(registry: CapabilityFoundryRegistry): string[] {
  const stateCounts = formatStateCounts(registry.candidates);
  const scopeCounts = formatScopeCounts(registry.candidates);
  const sourceCounts = Array.from(
    registry.candidates.reduce((counts, candidate) => {
      const key = candidate.source.kind;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([kind, count]) => `${kind}=${count}`)
    .join(", ");
  return [
    `Registry generated: ${registry.generatedAt}`,
    `Registry updated: ${registry.updatedAt}`,
    `Source catalog revision: ${registry.sourceCatalogRevision}`,
    `Supported sources: ${registry.supportedSources.join(", ") || "none"}`,
    `State counts: ${stateCounts || "none"}`,
    `Scope counts: ${scopeCounts || "none"}`,
    `Source counts: ${sourceCounts || "none"}`,
    "Candidates:",
    ...formatFoundryCandidateLines(registry.candidates).map((line) => `- ${line}`),
  ];
}
