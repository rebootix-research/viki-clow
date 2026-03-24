import crypto from "node:crypto";
import {
  listEvolutionCandidates,
  listEvolutionExperiments,
  listEvolutionPromotions,
  saveEvolutionCandidate,
  saveEvolutionExperiment,
  saveEvolutionPromotion,
} from "./store.js";
import { parseGitHubWebhookCandidate, verifyGitHubWebhookSignature } from "./github-webhook.js";
import type {
  EvolutionCandidate,
  EvolutionExperiment,
  EvolutionPromotion,
  GitHubWebhookEnvelope,
} from "./types.js";

export async function ingestGitHubWebhookCandidate(params: {
  envelope: GitHubWebhookEnvelope;
  secret: string;
  env?: NodeJS.ProcessEnv;
}): Promise<EvolutionCandidate> {
  if (
    !verifyGitHubWebhookSignature({
      payload: params.envelope.payload,
      secret: params.secret,
      signature256: params.envelope.signature256 ?? "",
    })
  ) {
    throw new Error("Invalid GitHub webhook signature.");
  }
  const candidate = parseGitHubWebhookCandidate({
    event: params.envelope.event,
    payload: params.envelope.payload,
    deliveryId: params.envelope.deliveryId,
  });
  if (!candidate) {
    throw new Error(`Unsupported GitHub webhook event: ${params.envelope.event}`);
  }
  await saveEvolutionCandidate(candidate, params.env);
  return candidate;
}

export async function recordEvolutionExperiment(params: {
  candidateId: string;
  objective: string;
  summary: string;
  score: number;
  solveRate?: number;
  latencyMs?: number;
  env?: NodeJS.ProcessEnv;
}): Promise<EvolutionExperiment> {
  const experiment: EvolutionExperiment = {
    id: `experiment-${crypto.randomUUID()}`,
    candidateId: params.candidateId,
    objective: params.objective.trim(),
    createdAt: new Date().toISOString(),
    summary: params.summary.trim(),
    score: params.score,
    solveRate: params.solveRate,
    latencyMs: params.latencyMs,
    promoted: false,
  };
  await saveEvolutionExperiment(experiment, params.env);
  return experiment;
}

export async function promoteEvolutionCandidate(params: {
  candidateId: string;
  experimentId?: string;
  rationale: string;
  env?: NodeJS.ProcessEnv;
}): Promise<EvolutionPromotion> {
  const candidates = await listEvolutionCandidates(params.env);
  const candidate = candidates.find((entry) => entry.id === params.candidateId);
  if (!candidate) {
    throw new Error(`Evolution candidate not found: ${params.candidateId}`);
  }
  candidate.status = "promoted";
  await saveEvolutionCandidate(candidate, params.env);

  const promotion: EvolutionPromotion = {
    id: `promotion-${crypto.randomUUID()}`,
    candidateId: candidate.id,
    experimentId: params.experimentId,
    promotedAt: new Date().toISOString(),
    rationale: params.rationale.trim(),
    status: "promoted",
  };
  await saveEvolutionPromotion(promotion, params.env);
  return promotion;
}

export async function rollbackEvolutionCandidate(params: {
  candidateId: string;
  rationale: string;
  env?: NodeJS.ProcessEnv;
}): Promise<EvolutionPromotion> {
  const candidates = await listEvolutionCandidates(params.env);
  const candidate = candidates.find((entry) => entry.id === params.candidateId);
  if (!candidate) {
    throw new Error(`Evolution candidate not found: ${params.candidateId}`);
  }
  candidate.status = "rolled_back";
  await saveEvolutionCandidate(candidate, params.env);
  const promotion: EvolutionPromotion = {
    id: `rollback-${crypto.randomUUID()}`,
    candidateId: candidate.id,
    rolledBackAt: new Date().toISOString(),
    rationale: params.rationale.trim(),
    status: "rolled_back",
  };
  await saveEvolutionPromotion(promotion, params.env);
  return promotion;
}

export async function createManualEvolutionCandidate(params: {
  name: string;
  kind: EvolutionCandidate["kind"];
  sourceUrl?: string;
  notes?: string;
  tags?: string[];
  env?: NodeJS.ProcessEnv;
}): Promise<EvolutionCandidate> {
  const candidate: EvolutionCandidate = {
    id: `candidate-${crypto.randomUUID()}`,
    name: params.name.trim(),
    kind: params.kind,
    source: "manual",
    sourceUrl: params.sourceUrl?.trim() || undefined,
    receivedAt: new Date().toISOString(),
    status: "intake",
    notes: params.notes?.trim() || undefined,
    tags: params.tags?.filter(Boolean),
  };
  await saveEvolutionCandidate(candidate, params.env);
  return candidate;
}

export async function summarizeEvolutionState(env: NodeJS.ProcessEnv = process.env) {
  const [candidates, experiments, promotions] = await Promise.all([
    listEvolutionCandidates(env),
    listEvolutionExperiments(env),
    listEvolutionPromotions(env),
  ]);
  return {
    candidates,
    experiments,
    promotions,
  };
}
