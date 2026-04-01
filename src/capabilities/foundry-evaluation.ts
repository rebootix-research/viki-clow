import { createHash } from "node:crypto";
import type {
  CapabilityFoundryCandidate,
  CapabilityFoundryOutcome,
  CapabilityFoundryRoute,
} from "./types.js";

export type FoundryEvaluationStage =
  | "discover"
  | "fetch"
  | "inspect"
  | "sandbox"
  | "test"
  | "promote"
  | "reject"
  | "bundle"
  | "route";

export type FoundryEvaluationReceipt = {
  receiptId: string;
  stage: FoundryEvaluationStage;
  outcome: CapabilityFoundryOutcome | "promoted" | "rejected" | "bundled" | "routed";
  evaluatedAt: string;
  objective?: string;
  candidateId: string;
  candidateName: string;
  type: CapabilityFoundryCandidate["type"];
  source: {
    kind: CapabilityFoundryCandidate["source"]["kind"];
    sourceUrl: string;
    ref?: string;
    packageName?: string;
    installMethod: CapabilityFoundryCandidate["source"]["installMethod"];
    sourceCatalogId?: string;
    sourceCatalogEntryId?: string;
    sourceFamily?: CapabilityFoundryCandidate["sourceFamily"];
    approval?: CapabilityFoundryCandidate["approval"];
  };
  state: {
    before: CapabilityFoundryCandidate["state"];
    after: CapabilityFoundryCandidate["state"];
    scope: CapabilityFoundryCandidate["scope"];
    compatibility: CapabilityFoundryCandidate["compatibility"];
  };
  score: number;
  reasons: string[];
  routeHints: string[];
  evidencePaths: string[];
  test: CapabilityFoundryCandidate["test"];
  provenance: CapabilityFoundryCandidate["provenance"];
  registration?: CapabilityFoundryCandidate["registration"];
  usage: CapabilityFoundryCandidate["usage"];
  route?: CapabilityFoundryRoute;
};

export function scoreFoundryCandidate(
  candidate: CapabilityFoundryCandidate,
  objective: string,
): {
  score: number;
  reasons: string[];
} {
  const normalized = objective.trim().toLowerCase();
  const tokens = normalized.split(/[^a-z0-9]+/u).filter(Boolean);
  const hints = candidate.classification.objectiveHints.filter((hint) =>
    tokens.some(
      (token) => token.includes(hint) || hint.includes(token) || normalized.includes(hint),
    ),
  );
  const tags = candidate.classification.tags.filter((tag) =>
    tokens.some((token) => token.includes(tag) || tag.includes(token) || normalized.includes(tag)),
  );
  const routeHints = candidate.registration?.routeHints ?? [];
  const matchedRoutes = routeHints.filter((hint) =>
    tokens.some(
      (token) => token.includes(hint) || hint.includes(token) || normalized.includes(hint),
    ),
  );
  const compatibilityScore =
    candidate.compatibility === "compatible"
      ? 16
      : candidate.compatibility === "wrapped"
        ? 10
        : candidate.compatibility === "manual"
          ? 2
          : -100;
  const scopeScore =
    candidate.scope === "bundled"
      ? 18
      : candidate.scope === "optional"
        ? 9
        : candidate.scope === "experimental"
          ? 4
          : -100;
  const stateScore =
    candidate.state === "bundled"
      ? 12
      : candidate.state === "promoted"
        ? 9
        : candidate.state === "tested"
          ? 6
          : candidate.state === "sandboxed"
            ? 4
            : candidate.state === "inspected"
              ? 3
              : candidate.state === "fetched"
                ? 2
                : 1;
  const sourceScore =
    candidate.source.kind === "local_repo" ? 8 : candidate.source.kind === "github_repo" ? 7 : 6;
  const testScore =
    candidate.test.status === "passed"
      ? 10
      : candidate.test.status === "failed"
        ? -18
        : candidate.test.status === "pending"
          ? 1
          : 0;
  const provenanceScore =
    (candidate.provenance.version ? 1 : 0) +
    (candidate.provenance.license ? 1 : 0) +
    (candidate.provenance.sourceRef ? 2 : 0) +
    (candidate.provenance.fetchedFrom ? 2 : 0);
  const familyScore =
    candidate.sourceFamily === "bundled_skill" || candidate.sourceFamily === "bundled_plugin"
      ? 8
      : candidate.sourceFamily === "curated_mcp"
        ? 7
        : candidate.sourceFamily === "curated_repo"
          ? 6
          : candidate.sourceFamily === "curated_asset"
            ? 6
            : 0;
  const approvalScore =
    candidate.approval === "approved"
      ? 6
      : candidate.approval === "experimental"
        ? 2
        : candidate.approval === "blocked"
          ? -100
          : 0;
  const usageScore =
    candidate.usage.success * 4 +
    candidate.usage.suggested -
    candidate.usage.failure * 3 +
    (candidate.usage.lastOutcome === "success" ? 4 : 0);
  const score =
    scopeScore +
    compatibilityScore +
    stateScore +
    sourceScore +
    testScore +
    provenanceScore +
    familyScore +
    approvalScore +
    usageScore +
    hints.length * 6 +
    tags.length * 2 +
    matchedRoutes.length * 4;
  const reasons = [
    `scope:${candidate.scope}`,
    `compatibility:${candidate.compatibility}`,
    `state:${candidate.state}`,
    `source:${candidate.source.kind}`,
    ...hints.map((hint) => `hint:${hint}`),
    ...tags.map((tag) => `tag:${tag}`),
    ...matchedRoutes.map((route) => `route:${route}`),
    ...(candidate.test.status !== "pending" ? [`test:${candidate.test.status}`] : []),
    ...(candidate.provenance.version ? [`version:${candidate.provenance.version}`] : []),
    ...(candidate.provenance.license ? [`license:${candidate.provenance.license}`] : []),
    ...(candidate.provenance.sourceRef ? [`sourceRef:${candidate.provenance.sourceRef}`] : []),
    ...(candidate.sourceFamily ? [`family:${candidate.sourceFamily}`] : []),
    ...(candidate.approval ? [`approval:${candidate.approval}`] : []),
    ...(candidate.usage.success > 0 ? [`usage:success=${candidate.usage.success}`] : []),
    ...(candidate.usage.failure > 0 ? [`usage:failure=${candidate.usage.failure}`] : []),
  ];
  return {
    score,
    reasons,
  };
}

function hashReceiptId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

export function buildFoundryReceipt(params: {
  candidate: CapabilityFoundryCandidate;
  stage: FoundryEvaluationStage;
  outcome: FoundryEvaluationReceipt["outcome"];
  objective?: string;
  route?: CapabilityFoundryRoute;
  score?: number;
  reasons?: string[];
  beforeState?: CapabilityFoundryCandidate["state"];
  afterState?: CapabilityFoundryCandidate["state"];
  evaluatedAt?: string;
}): FoundryEvaluationReceipt {
  const candidate = params.candidate;
  const evaluatedAt = params.evaluatedAt ?? new Date().toISOString();
  const scored = scoreFoundryCandidate(
    candidate,
    params.objective ?? candidate.classification.selectionNotes.join(" "),
  );
  const score = params.score ?? scored.score;
  const reasons = params.reasons ?? scored.reasons;
  const beforeState = params.beforeState ?? candidate.state;
  const afterState = params.afterState ?? candidate.state;
  return {
    receiptId: hashReceiptId([
      candidate.id,
      params.stage,
      params.outcome,
      evaluatedAt,
      candidate.state,
      candidate.scope,
      candidate.compatibility,
      String(score),
    ]),
    stage: params.stage,
    outcome: params.outcome,
    evaluatedAt,
    objective: params.objective?.trim() || undefined,
    candidateId: candidate.id,
    candidateName: candidate.name,
    type: candidate.type,
    source: {
      kind: candidate.source.kind,
      sourceUrl: candidate.source.sourceUrl,
      ref: candidate.source.ref,
      packageName: candidate.source.packageName,
      installMethod: candidate.source.installMethod,
      sourceCatalogId: candidate.sourceCatalogId,
      sourceCatalogEntryId: candidate.sourceCatalogEntryId,
      sourceFamily: candidate.sourceFamily,
      approval: candidate.approval,
    },
    state: {
      before: beforeState,
      after: afterState,
      scope: candidate.scope,
      compatibility: candidate.compatibility,
    },
    score,
    reasons,
    routeHints: candidate.registration?.routeHints ?? candidate.classification.objectiveHints,
    evidencePaths: [
      candidate.sandbox?.path,
      candidate.test.proofPath,
      candidate.provenance.fetchedFrom,
    ].filter((value): value is string => Boolean(value && value.trim())),
    test: candidate.test,
    provenance: candidate.provenance,
    registration: candidate.registration,
    usage: candidate.usage,
    route: params.route,
  };
}
