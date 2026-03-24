export type MissionTerminalState = "completed" | "failed" | "blocked" | "needs_approval";

export type MissionStatus = "queued" | "running" | MissionTerminalState;

export type MissionDomain =
  | "browser_web"
  | "coding_repo"
  | "research"
  | "content_publication"
  | "documents_office"
  | "ops_infra"
  | "local_computer"
  | "communications_outreach";

export type MissionSubtaskStatus = "planned" | "running" | MissionTerminalState;

export type MissionArtifact = {
  kind: "reply" | "transcript" | "evidence" | "log" | "file";
  label: string;
  value: string;
  createdAt: number;
};

export type MissionEvidence = {
  seq: number;
  at: number;
  stream: string;
  summary: string;
  data: Record<string, unknown>;
};

export type MissionCheckpoint = {
  at: number;
  seq: number;
  summary: string;
};

export type MissionTemporalBoundary = {
  adapter: "temporal";
  backend: "temporal" | "shadow";
  workflowId: string;
  workflowType: string;
  queue: string;
  namespace: string;
  status: MissionStatus;
  attempts: number;
  currentState: string;
  lastCheckpoint?: MissionCheckpoint;
  lastHeartbeatAt: number;
  missionId: string;
  configured: boolean;
  connected: boolean;
  address?: string;
  descriptorPath?: string;
  lastSyncAt?: number;
  lastSyncError?: string;
};

export type MissionLangGraphNodeRole = "sovereign" | "swarm" | "verifier" | "recovery";

export type MissionLangGraphNode = {
  id: string;
  label: string;
  role: MissionLangGraphNodeRole;
  domain?: MissionDomain;
  status: "planned" | MissionStatus;
};

export type MissionLangGraphEdge = {
  from: string;
  to: string;
  relation: "delegates" | "verifies" | "recovers" | "reenters";
};

export type MissionLangGraphBoundary = {
  adapter: "langgraph";
  backend: "langgraph" | "shadow";
  graphId: string;
  version: string;
  topology: string;
  currentNodeId: string;
  sovereignNodeId: string;
  verifierNodeId: string;
  recoveryNodeId: string;
  nodes: MissionLangGraphNode[];
  edges: MissionLangGraphEdge[];
  lastCheckpoint?: MissionCheckpoint;
  configured: boolean;
  connected: boolean;
  endpoint?: string;
  descriptorPath?: string;
  checkpointPath?: string;
  lastSyncAt?: number;
  lastSyncError?: string;
};

export type MissionBrowserBoundary = {
  adapter: "browserd";
  backend: "browserd" | "shadow";
  product: "Viki Browser";
  defaultProfile: string;
  manifestPresent: boolean;
  manifestPath?: string;
  controlUrl?: string;
  sessionVaultReady: boolean;
  evidenceReady: boolean;
  nativeReady: boolean;
  nativeProofPath?: string;
  candidates: string[];
  configuredExecutable?: string;
  descriptorPath?: string;
  lastSyncAt?: number;
  lastSyncError?: string;
};

export type MissionMemoryBoundary = {
  adapter: "graphiti";
  backend: "neo4j" | "local-shadow";
  configured: boolean;
  connected: boolean;
  proofPath?: string;
  localStore?: string;
  delegatedBackend?: string;
  neo4jUri?: string;
  lastSyncAt?: number;
  lastSyncError?: string;
};

export type MissionRuntimeBackbone = {
  temporal: MissionTemporalBoundary;
  langGraph: MissionLangGraphBoundary;
  browser: MissionBrowserBoundary;
  memory: MissionMemoryBoundary;
  updatedAt: number;
  proofPath?: string;
  materialized?: boolean;
};

export type MissionProof = {
  createdAt: number;
  updatedAt: number;
  swarmCount: number;
  domains: MissionDomain[];
  topology: string;
  lastEvidenceSummary?: string;
  checkpoint?: MissionCheckpoint;
  terminalState?: MissionTerminalState;
  terminalMessage?: string;
};

export type MissionApproval = {
  id: string;
  slug?: string;
  status: "pending" | "approved" | "denied" | "unavailable";
  host?: "gateway" | "node";
  command?: string;
  cwd?: string;
  nodeId?: string;
  reason?: string;
  requestedAt: number;
  expiresAt?: number;
};

export type MissionSwarm = {
  id: string;
  domain: MissionDomain;
  lead: string;
  specialists: string[];
  verifier: string;
  recovery: string;
};

export type MissionPlan = {
  sovereign: string;
  summary: string;
  domains: MissionDomain[];
  swarms: MissionSwarm[];
  verifier: string;
  recovery: string;
};

export type MissionSubtask = {
  id: string;
  title: string;
  domain: MissionDomain;
  status: MissionSubtaskStatus;
  updatedAt: number;
};

export type MissionRetryPolicy = {
  maxAttempts: number;
  attemptsUsed: number;
  strategy: "resume_same_request";
};

export type MissionNotificationTarget = {
  sessionKey?: string;
  channel?: string;
  to?: string;
  accountId?: string;
  threadId?: string;
  deliver: boolean;
};

export type MissionReplayRequest = {
  message: string;
  agentId?: string;
  to?: string;
  sessionId?: string;
  sessionKey?: string;
  thinking?: string;
  thinkingOnce?: string;
  verbose?: string;
  timeout?: string;
  deliver?: boolean;
  replyTo?: string;
  replyChannel?: string;
  replyAccountId?: string;
  threadId?: string;
  messageChannel?: string;
  channel?: string;
  accountId?: string;
  lane?: string;
  extraSystemPrompt?: string;
  missionId: string;
};

export type MissionResume = {
  enabled: boolean;
  reason?: string;
  request?: MissionReplayRequest;
};

export type MissionAttempt = {
  number: number;
  runId: string;
  status: "running" | MissionTerminalState;
  startedAt: number;
  endedAt?: number;
  error?: string;
};

export type MissionRecord = {
  id: string;
  objective: string;
  status: MissionStatus;
  currentState: string;
  createdAt: number;
  updatedAt: number;
  runId: string;
  agentId?: string;
  sessionId?: string;
  sessionKey?: string;
  workspaceDir?: string;
  notificationTarget: MissionNotificationTarget;
  completionCriteria: string[];
  retryPolicy: MissionRetryPolicy;
  plan: MissionPlan;
  subtasks: MissionSubtask[];
  dependencies: string[];
  approvals: MissionApproval[];
  artifacts: MissionArtifact[];
  evidence: MissionEvidence[];
  checkpoint?: MissionCheckpoint;
  proof?: MissionProof;
  backbone?: MissionRuntimeBackbone;
  resume: MissionResume;
  attempts: MissionAttempt[];
  terminalMessage?: string;
  lastError?: string;
};
