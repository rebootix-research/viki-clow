import type {
  MissionBrowserBoundary,
  MissionDomain,
  MissionLangGraphBoundary,
  MissionLangGraphEdge,
  MissionLangGraphNode,
  MissionMemoryBoundary,
  MissionRecord,
  MissionRuntimeBackbone,
  MissionTemporalBoundary,
} from "./types.js";

const DOMAIN_LABELS: Record<MissionDomain, string> = {
  browser_web: "Browser and Web",
  coding_repo: "Coding and Repo",
  research: "Research",
  content_publication: "Content and Publication",
  documents_office: "Documents and Office",
  ops_infra: "Ops and Infra",
  local_computer: "Local Computer Control",
  communications_outreach: "Communications and Outreach",
};

function domainNodeId(domain: MissionDomain): string {
  return `swarm-${domain}`;
}

function domainNodeLabel(domain: MissionDomain): string {
  return `${DOMAIN_LABELS[domain]} swarm`;
}

function resolveActiveDomain(record: MissionRecord): MissionDomain | undefined {
  const running = record.subtasks.find((entry) => entry.status === "running")?.domain;
  if (running) {
    return running;
  }
  const planned = record.subtasks.find((entry) => entry.status === "planned")?.domain;
  if (planned) {
    return planned;
  }
  return record.plan.domains[0];
}

function resolveCurrentNodeId(record: MissionRecord): string {
  if (record.status === "completed") {
    return "swarm-verifier";
  }
  if (record.status === "blocked" || record.status === "failed") {
    return "swarm-recovery";
  }
  if (record.status === "needs_approval") {
    return "swarm-verifier";
  }
  const activeDomain = resolveActiveDomain(record);
  return activeDomain ? domainNodeId(activeDomain) : "swarm-sovereign";
}

function resolveNodeStatus(
  record: MissionRecord,
  nodeRole: "sovereign" | "swarm" | "verifier" | "recovery",
  domain?: MissionDomain,
): "planned" | MissionRecord["status"] {
  if (record.status === "completed") {
    return "completed";
  }
  if (
    record.status === "blocked" ||
    record.status === "failed" ||
    record.status === "needs_approval"
  ) {
    if (nodeRole === "recovery" || nodeRole === "verifier") {
      return record.status;
    }
    if (
      nodeRole === "swarm" &&
      domain &&
      record.subtasks.some((entry) => entry.domain === domain && entry.status === "running")
    ) {
      return record.status;
    }
    return "planned";
  }
  if (nodeRole === "sovereign") {
    return "running";
  }
  if (
    nodeRole === "swarm" &&
    domain &&
    record.subtasks.some((entry) => entry.domain === domain && entry.status === "running")
  ) {
    return "running";
  }
  return "planned";
}

function buildNodes(record: MissionRecord): MissionLangGraphNode[] {
  const activeDomain = resolveActiveDomain(record);
  const nodes: MissionLangGraphNode[] = [
    {
      id: "swarm-sovereign",
      label: "Sovereign orchestrator",
      role: "sovereign",
      status: resolveNodeStatus(record, "sovereign"),
    },
    ...record.plan.domains.map<MissionLangGraphNode>((domain) => ({
      id: domainNodeId(domain),
      label: domainNodeLabel(domain),
      role: "swarm",
      domain,
      status: resolveNodeStatus(record, "swarm", domain),
    })),
    {
      id: "swarm-verifier",
      label: "Mission verifier",
      role: "verifier",
      status: resolveNodeStatus(record, "verifier"),
    },
    {
      id: "swarm-recovery",
      label: "Mission recovery router",
      role: "recovery",
      status: resolveNodeStatus(record, "recovery"),
    },
  ];

  if (activeDomain) {
    const activeNode = nodes.find((node) => node.id === domainNodeId(activeDomain));
    if (activeNode && activeNode.status === "planned" && record.status === "running") {
      activeNode.status = "running";
    }
  }
  return nodes;
}

function buildEdges(record: MissionRecord): MissionLangGraphEdge[] {
  const edges: MissionLangGraphEdge[] = [];
  for (const domain of record.plan.domains) {
    edges.push({
      from: "swarm-sovereign",
      to: domainNodeId(domain),
      relation: "delegates",
    });
    edges.push({
      from: domainNodeId(domain),
      to: "swarm-verifier",
      relation: "verifies",
    });
  }
  edges.push({
    from: "swarm-verifier",
    to: "swarm-recovery",
    relation: "recovers",
  });
  edges.push({
    from: "swarm-recovery",
    to: "swarm-sovereign",
    relation: "reenters",
  });
  return edges;
}

export function buildMissionTemporalBoundary(record: MissionRecord): MissionTemporalBoundary {
  return {
    adapter: "temporal",
    backend: "shadow",
    workflowId: `mission-${record.id}`,
    workflowType: "mission-runtime",
    queue: "vikiclow-missions",
    namespace: "vikiclow",
    status: record.status,
    attempts: record.attempts.length,
    currentState: record.currentState,
    lastCheckpoint: record.checkpoint,
    lastHeartbeatAt: record.updatedAt,
    missionId: record.id,
    configured: false,
    connected: false,
  };
}

export function buildMissionLangGraphBoundary(record: MissionRecord): MissionLangGraphBoundary {
  return {
    adapter: "langgraph",
    backend: "shadow",
    graphId: `mission-${record.id}`,
    version: "1",
    topology: "sovereign orchestrator -> domain swarms -> verifier -> recovery -> sovereign",
    currentNodeId: resolveCurrentNodeId(record),
    sovereignNodeId: "swarm-sovereign",
    verifierNodeId: "swarm-verifier",
    recoveryNodeId: "swarm-recovery",
    nodes: buildNodes(record),
    edges: buildEdges(record),
    lastCheckpoint: record.checkpoint,
    configured: false,
    connected: false,
  };
}

export function buildMissionBrowserBoundary(_record: MissionRecord): MissionBrowserBoundary {
  return {
    adapter: "browserd",
    backend: "shadow",
    product: "Viki Browser",
    defaultProfile: "vikiclow",
    manifestPresent: false,
    sessionVaultReady: false,
    evidenceReady: false,
    nativeReady: false,
    candidates: [],
    lastSyncError: "browserd manifest not materialized yet",
  };
}

export function buildMissionMemoryBoundary(record: MissionRecord): MissionMemoryBoundary {
  return {
    adapter: "graphiti",
    backend: "local-shadow",
    configured: false,
    connected: false,
    localStore: record.workspaceDir,
  };
}

export function buildMissionBackbone(record: MissionRecord): MissionRuntimeBackbone {
  return {
    temporal: buildMissionTemporalBoundary(record),
    langGraph: buildMissionLangGraphBoundary(record),
    browser: buildMissionBrowserBoundary(record),
    memory: buildMissionMemoryBoundary(record),
    updatedAt: record.updatedAt,
  };
}
