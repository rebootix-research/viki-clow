export type EvolutionCandidateKind = "repo" | "package" | "model";
export type EvolutionCandidateSource = "github_release" | "github_webhook" | "huggingface" | "manual";
export type EvolutionCandidateStatus =
  | "intake"
  | "benchmarked"
  | "promoted"
  | "rolled_back"
  | "rejected";

export type EvolutionCandidate = {
  id: string;
  name: string;
  kind: EvolutionCandidateKind;
  source: EvolutionCandidateSource;
  sourceUrl?: string;
  receivedAt: string;
  status: EvolutionCandidateStatus;
  notes?: string;
  tags?: string[];
  digest?: string;
};

export type EvolutionExperiment = {
  id: string;
  candidateId: string;
  objective: string;
  createdAt: string;
  summary: string;
  score: number;
  solveRate?: number;
  latencyMs?: number;
  promoted: boolean;
};

export type EvolutionPromotion = {
  id: string;
  candidateId: string;
  experimentId?: string;
  promotedAt?: string;
  rolledBackAt?: string;
  rationale: string;
  status: "promoted" | "rolled_back";
};

export type GitHubWebhookEnvelope = {
  event: string;
  deliveryId?: string;
  signature256?: string;
  payload: string;
};
