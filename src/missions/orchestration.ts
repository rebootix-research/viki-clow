import { buildMissionBackbone } from "./backbone.js";
export { buildMissionBackbone } from "./backbone.js";
import type {
  MissionDomain,
  MissionPlan,
  MissionRecord,
  MissionSubtask,
  MissionSwarm,
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

const DOMAIN_KEYWORDS: Array<{ domain: MissionDomain; patterns: RegExp[] }> = [
  {
    domain: "browser_web",
    patterns: [
      /\bbrowser\b/i,
      /\bwebsite\b/i,
      /\bplaywright\b/i,
      /\blogin\b/i,
      /\bupload\b/i,
      /\bdownload\b/i,
      /\bpublish\b/i,
    ],
  },
  {
    domain: "coding_repo",
    patterns: [
      /\bcode\b/i,
      /\brepo\b/i,
      /\bbuild\b/i,
      /\btest\b/i,
      /\brefactor\b/i,
      /\btypescript\b/i,
    ],
  },
  {
    domain: "research",
    patterns: [/\bresearch\b/i, /\bcompare\b/i, /\bevaluate\b/i, /\banalyze\b/i, /\bbenchmark\b/i],
  },
  {
    domain: "content_publication",
    patterns: [/\bwrite\b/i, /\bpublish\b/i, /\bpost\b/i, /\bcopy\b/i, /\bcontent\b/i],
  },
  {
    domain: "documents_office",
    patterns: [/\bpdf\b/i, /\bdocument\b/i, /\bspreadsheet\b/i, /\boffice\b/i, /\bslides\b/i],
  },
  {
    domain: "ops_infra",
    patterns: [/\bdeploy\b/i, /\binfra\b/i, /\bserver\b/i, /\bdocker\b/i, /\bkubernetes\b/i],
  },
  {
    domain: "local_computer",
    patterns: [
      /\bmouse\b/i,
      /\bcursor\b/i,
      /\bdesktop\b/i,
      /\bwindow\b/i,
      /\bkeyboard\b/i,
      /\bapp\b/i,
    ],
  },
  {
    domain: "communications_outreach",
    patterns: [/\bemail\b/i, /\bmessage\b/i, /\btelegram\b/i, /\bdiscord\b/i, /\boutreach\b/i],
  },
];

const DOMAIN_SPECIALISTS: Record<MissionDomain, string[]> = {
  browser_web: ["session operator", "web workflow executor", "evidence capturer"],
  coding_repo: ["repo surgeon", "test fixer", "verifier"],
  research: ["source scout", "fact checker", "synthesis analyst"],
  content_publication: ["editor", "publisher", "brand reviewer"],
  documents_office: ["document parser", "ocr workflow", "artifact reviewer"],
  ops_infra: ["runtime operator", "packaging worker", "deployment verifier"],
  local_computer: ["desktop actuator", "window controller", "screen verifier"],
  communications_outreach: ["channel operator", "reply drafter", "delivery verifier"],
};

function inferDomains(objective: string): MissionDomain[] {
  const matched = new Set<MissionDomain>();
  for (const candidate of DOMAIN_KEYWORDS) {
    if (candidate.patterns.some((pattern) => pattern.test(objective))) {
      matched.add(candidate.domain);
    }
  }
  if (matched.size === 0) {
    matched.add("research");
    matched.add("coding_repo");
  }
  if (!matched.has("research")) {
    matched.add("research");
  }
  return Array.from(matched);
}

function buildSwarm(domain: MissionDomain): MissionSwarm {
  const label = DOMAIN_LABELS[domain];
  return {
    id: `swarm-${domain}`,
    domain,
    lead: `${label} lead`,
    specialists: DOMAIN_SPECIALISTS[domain],
    verifier: `${label} verifier`,
    recovery: `${label} recovery`,
  };
}

export function buildMissionPlan(objective: string): MissionPlan {
  const domains = inferDomains(objective);
  return {
    sovereign: "Sovereign orchestrator",
    summary: `Drive the mission through ${domains.map((domain) => DOMAIN_LABELS[domain]).join(", ")} with evidence, verification, and recovery routing.`,
    domains,
    swarms: domains.map((domain) => buildSwarm(domain)),
    verifier: "Mission verifier",
    recovery: "Mission recovery router",
  };
}

export function buildMissionSubtasks(plan: MissionPlan, now: number): MissionSubtask[] {
  return plan.domains.map((domain) => ({
    id: `subtask-${domain}`,
    title: `${DOMAIN_LABELS[domain]} execution`,
    domain,
    status: "planned",
    updatedAt: now,
  }));
}

export function buildMissionExecutionPrompt(record: MissionRecord): string {
  const proof = record.proof;
  const backbone = record.backbone ?? buildMissionBackbone(record);
  const lines = [
    "Mission Runtime",
    `Mission ID: ${record.id}`,
    `Objective: ${record.objective}`,
    "Status target: finish with evidence and a terminal state, never silently.",
    "",
    "Swarm-of-Swarms Topology",
    `${record.plan.sovereign}: break the mission into bounded domain swarms, delegate only when it materially advances execution, and keep one verifier and one recovery route active.`,
    `Domains: ${record.plan.domains.join(", ")}`,
    `Domain swarm count: ${record.plan.swarms.length}`,
    `Temporal boundary: workflow=${backbone.temporal.workflowId}; queue=${backbone.temporal.queue}; state=${backbone.temporal.status}; attempts=${backbone.temporal.attempts}`,
    `LangGraph boundary: graph=${backbone.langGraph.graphId}; current=${backbone.langGraph.currentNodeId}; verifier=${backbone.langGraph.verifierNodeId}; recovery=${backbone.langGraph.recoveryNodeId}`,
    `Viki Browser boundary: profile=${backbone.browser.defaultProfile}; manifest=${backbone.browser.manifestPresent}; nativeReady=${backbone.browser.nativeReady}; evidence=${backbone.browser.evidenceReady}`,
    `Graphiti boundary: backend=${backbone.memory.backend}; configured=${backbone.memory.configured}; connected=${backbone.memory.connected}; proof=${backbone.memory.proofPath ?? "pending"}`,
  ];
  for (const swarm of record.plan.swarms) {
    lines.push(
      `- ${DOMAIN_LABELS[swarm.domain]} swarm: lead=${swarm.lead}; specialists=${swarm.specialists.join(", ")}; verifier=${swarm.verifier}; recovery=${swarm.recovery}`,
    );
  }
  lines.push(
    "",
    "Adapter Contract",
    "- Temporal owns durable mission execution and resumable run identity.",
    "- LangGraph owns the bounded swarm graph, verifier handoff, and recovery routing.",
    "- Viki Browser owns the managed browser/session/evidence surface for web and desktop execution.",
    "- Graphiti owns persistent mission memory state and Neo4j shadow-sync when configured.",
    "- The mission record persists all four layers so execution state survives provider or process churn.",
  );
  if (proof) {
    lines.push(
      "",
      "Mission Proof",
      `Recorded swarm topology: ${proof.topology}`,
      `Recorded swarm count: ${proof.swarmCount}`,
      `Last evidence checkpoint: ${proof.checkpoint?.summary ?? "n/a"}`,
      `Recorded terminal state: ${proof.terminalState ?? "running"}`,
    );
  }
  lines.push(
    "",
    "Execution Rules",
    "- Prefer doing the work over describing the work.",
    "- Capture evidence as you go: tool outputs, screenshots, files, or concrete results.",
    "- If a path is blocked, route to the relevant recovery swarm and continue on the best compliant path.",
    "- If approval is required, stop in a clean needs_approval state with the exact approval action.",
    "- Do not claim mission completion unless the objective is actually satisfied or a concrete blocker remains.",
  );
  return lines.join("\n");
}

export function labelMissionDomain(domain: MissionDomain): string {
  return DOMAIN_LABELS[domain];
}
