import crypto from "node:crypto";
import type { AgentEventPayload } from "../infra/agent-events.js";
import { shortenHomePath } from "../utils.js";
import { materializeMissionBackbone } from "./backbone-materializer.js";
import {
  buildMissionExecutionPrompt,
  buildMissionPlan,
  buildMissionSubtasks,
  labelMissionDomain,
} from "./orchestration.js";
import { loadMissionRecord, saveMissionRecord } from "./store.js";
import { appendMissionMemoryWriteback } from "../memory/mission-writeback.js";
import { recordGraphitiMissionWriteback } from "../memory/graphiti-backbone.js";
import type { CapabilityPlan } from "../capabilities/types.js";
import type {
  MissionApproval,
  MissionArtifact,
  MissionCheckpoint,
  MissionDomain,
  MissionRecord,
  MissionReplayRequest,
  MissionProof,
  MissionStatus,
  MissionTerminalState,
} from "./types.js";

type BeginMissionRunParams = {
  missionId?: string;
  objective: string;
  runId: string;
  agentId?: string;
  sessionId?: string;
  sessionKey?: string;
  workspaceDir?: string;
  deliver: boolean;
  channel?: string;
  to?: string;
  accountId?: string;
  threadId?: string | number;
  replayRequest: MissionReplayRequest;
};

function normalizeThreadId(threadId: string | number | undefined): string | undefined {
  if (threadId == null) {
    return undefined;
  }
  const value = String(threadId).trim();
  return value || undefined;
}

function truncate(value: string, max = 240): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function summarizeEvent(evt: AgentEventPayload): string {
  const phase = typeof evt.data.phase === "string" ? evt.data.phase : undefined;
  if (evt.stream === "assistant") {
    const text = typeof evt.data.text === "string" ? evt.data.text : "";
    return text ? `Assistant: ${truncate(text, 180)}` : "Assistant update";
  }
  if (evt.stream === "tool") {
    const name = typeof evt.data.name === "string" ? evt.data.name : "tool";
    return phase ? `Tool ${name} ${phase}` : `Tool ${name} update`;
  }
  if (evt.stream === "lifecycle") {
    return phase ? `Lifecycle ${phase}` : "Lifecycle update";
  }
  return `${evt.stream} event`;
}

function inferDomainFromToolName(name: string): MissionDomain | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (["browser", "chrome", "playwright", "web_fetch", "scrape", "fetch"].includes(normalized)) {
    return "browser_web";
  }
  if (["write", "read", "edit", "exec", "bash", "git", "search_replace"].includes(normalized)) {
    return "coding_repo";
  }
  if (["web_search", "search", "research"].includes(normalized)) {
    return "research";
  }
  if (["message", "telegram", "discord", "email"].includes(normalized)) {
    return "communications_outreach";
  }
  if (["desktop", "mouse", "cursor", "keyboard", "window", "app"].includes(normalized)) {
    return "local_computer";
  }
  return null;
}

function appendEvidence(record: MissionRecord, evt: AgentEventPayload, summary: string): void {
  record.evidence.push({
    seq: evt.seq,
    at: evt.ts,
    stream: evt.stream,
    summary,
    data: evt.data,
  });
  if (record.evidence.length > 200) {
    record.evidence.splice(0, record.evidence.length - 200);
  }
  record.checkpoint = {
    at: evt.ts,
    seq: evt.seq,
    summary,
  };
}

function appendArtifact(record: MissionRecord, artifact: MissionArtifact): void {
  record.artifacts.push(artifact);
  if (record.artifacts.length > 100) {
    record.artifacts.splice(0, record.artifacts.length - 100);
  }
}

function updateProof(
  record: MissionRecord,
  at: number,
  patch: Partial<MissionProof> & Pick<MissionProof, "swarmCount" | "domains" | "topology">,
): void {
  record.proof = {
    createdAt: record.proof?.createdAt ?? at,
    updatedAt: at,
    swarmCount: patch.swarmCount,
    domains: patch.domains,
    topology: patch.topology,
    lastEvidenceSummary: patch.lastEvidenceSummary ?? record.proof?.lastEvidenceSummary,
    checkpoint: patch.checkpoint ?? record.proof?.checkpoint ?? record.checkpoint,
    terminalState: patch.terminalState ?? record.proof?.terminalState,
    terminalMessage: patch.terminalMessage ?? record.proof?.terminalMessage ?? record.terminalMessage,
  };
}

function touchSubtask(record: MissionRecord, domain: MissionDomain, status: MissionStatus, at: number): void {
  const subtask = record.subtasks.find((entry) => entry.domain === domain);
  if (!subtask) {
    return;
  }
  if (
    status === "running" ||
    status === "completed" ||
    status === "blocked" ||
    status === "failed" ||
    status === "needs_approval"
  ) {
    subtask.status = status;
  }
  subtask.updatedAt = at;
}

function classifyTerminalState(errorMessage: string): MissionTerminalState {
  const normalized = errorMessage.toLowerCase();
  if (
    normalized.includes("approval required") ||
    normalized.includes("approval-pending") ||
    normalized.includes("/approve")
  ) {
    return "needs_approval";
  }
  if (
    normalized.includes("blocked") ||
    normalized.includes("denied") ||
    normalized.includes("policy") ||
    normalized.includes("timeout waiting for approval")
  ) {
    return "blocked";
  }
  return "failed";
}

export async function beginMissionRun(params: BeginMissionRunParams): Promise<MissionRunTracker> {
  const existing = params.missionId ? await loadMissionRecord(params.missionId) : null;
  const now = Date.now();
  const missionId = existing?.id ?? `mission-${crypto.randomUUID()}`;
  const objective = params.objective.trim();
  const plan = existing?.plan ?? buildMissionPlan(objective);

  const record: MissionRecord = existing ?? {
    id: missionId,
    objective,
    status: "queued",
    currentState: "Queued for execution",
    createdAt: now,
    updatedAt: now,
    runId: params.runId,
    agentId: params.agentId,
    sessionId: params.sessionId,
    sessionKey: params.sessionKey,
    workspaceDir: params.workspaceDir,
    notificationTarget: {
      sessionKey: params.sessionKey,
      channel: params.channel,
      to: params.to,
      accountId: params.accountId,
      threadId: normalizeThreadId(params.threadId),
      deliver: params.deliver,
    },
    completionCriteria: [
      "Reach a concrete terminal state with visible evidence.",
      "Write a terminal completion, failure, blocked, or approval-needed message.",
      "Persist mission state so the run can be inspected or resumed.",
    ],
    retryPolicy: {
      maxAttempts: 3,
      attemptsUsed: 0,
      strategy: "resume_same_request",
    },
    plan,
    subtasks: buildMissionSubtasks(plan, now),
    dependencies: [],
    approvals: [],
    artifacts: [],
    evidence: [],
    resume: {
      enabled: true,
      request: {
        ...params.replayRequest,
        missionId,
      },
    },
    attempts: [],
  };

  record.id = missionId;
  record.objective = objective;
  record.status = "running";
  record.currentState = "Mission started";
  record.updatedAt = now;
  record.runId = params.runId;
  record.agentId = params.agentId;
  record.sessionId = params.sessionId;
  record.sessionKey = params.sessionKey;
  record.workspaceDir = params.workspaceDir;
  record.notificationTarget = {
    sessionKey: params.sessionKey,
    channel: params.channel,
    to: params.to,
    accountId: params.accountId,
    threadId: normalizeThreadId(params.threadId),
    deliver: params.deliver,
  };
  record.resume = {
    enabled: true,
    request: {
      ...params.replayRequest,
      missionId,
    },
  };
  record.retryPolicy.attemptsUsed = existing?.attempts.length ?? 0;
  record.attempts.push({
    number: record.attempts.length + 1,
    runId: params.runId,
    status: "running",
    startedAt: now,
  });
  record.checkpoint = {
    at: now,
    seq: 0,
    summary: "Mission started",
  };
  appendArtifact(record, {
    kind: "log",
    label: "Mission workspace",
    value: params.workspaceDir ? shortenHomePath(params.workspaceDir) : "n/a",
    createdAt: now,
  });
  updateProof(record, now, {
    swarmCount: plan.swarms.length,
    domains: plan.domains,
    topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
    lastEvidenceSummary: "Mission started",
    checkpoint: record.checkpoint,
  });
  record.backbone = await materializeMissionBackbone(record);
  await saveMissionRecord(record);
  return new MissionRunTracker(record);
}

export class MissionRunTracker {
  private record: MissionRecord;
  private updateChain: Promise<void> = Promise.resolve();
  private lastAssistantText = "";
  private terminalStatus: MissionTerminalState | null = null;

  constructor(record: MissionRecord) {
    this.record = record;
  }

  get missionId(): string {
    return this.record.id;
  }

  get status(): MissionStatus {
    return this.record.status;
  }

  get snapshot(): MissionRecord {
    return this.record;
  }

  buildExecutionPrompt(): string {
    return buildMissionExecutionPrompt(this.record);
  }

  private queueUpdate(mutator: (record: MissionRecord) => void | Promise<void>): Promise<void> {
    this.updateChain = this.updateChain.then(async () => {
      this.record.updatedAt = Date.now();
      await mutator(this.record);
      this.record.backbone = await materializeMissionBackbone(this.record);
      await saveMissionRecord(this.record);
    });
    return this.updateChain;
  }

  async onEvent(evt: AgentEventPayload): Promise<void> {
    const summary = summarizeEvent(evt);
    await this.queueUpdate((record) => {
      appendEvidence(record, evt, summary);
      record.currentState = summary;
      updateProof(record, evt.ts, {
        swarmCount: record.plan.swarms.length,
        domains: record.plan.domains,
        topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
        lastEvidenceSummary: summary,
        checkpoint: record.checkpoint,
      });
      if (evt.stream === "assistant") {
        const text = typeof evt.data.text === "string" ? evt.data.text.trim() : "";
        if (text && text.length >= this.lastAssistantText.length + 120) {
          this.lastAssistantText = text;
          appendArtifact(record, {
            kind: "reply",
            label: "Assistant progress",
            value: truncate(text, 600),
            createdAt: evt.ts,
          });
        }
      }
      if (evt.stream === "tool") {
        const toolName = typeof evt.data.name === "string" ? evt.data.name : "";
        const domain = toolName ? inferDomainFromToolName(toolName) : null;
        const phase = typeof evt.data.phase === "string" ? evt.data.phase : "";
        if (domain) {
          if (phase === "start" || phase === "update") {
            touchSubtask(record, domain, "running", evt.ts);
          } else if (phase === "result" && evt.data.isError !== true) {
            touchSubtask(record, domain, "completed", evt.ts);
          }
        }
        if (phase === "result") {
          const result =
            evt.data.result && typeof evt.data.result === "object"
              ? (evt.data.result as Record<string, unknown>)
              : undefined;
          const details =
            result?.details && typeof result.details === "object"
              ? (result.details as Record<string, unknown>)
              : result;
          if (details?.status === "approval-pending") {
            const approval: MissionApproval = {
              id: typeof details.approvalId === "string" ? details.approvalId : crypto.randomUUID(),
              slug: typeof details.approvalSlug === "string" ? details.approvalSlug : undefined,
              status: "pending",
              host:
                details.host === "node"
                  ? "node"
                  : details.host === "gateway"
                    ? "gateway"
                    : undefined,
              command: typeof details.command === "string" ? details.command : undefined,
              cwd: typeof details.cwd === "string" ? details.cwd : undefined,
              nodeId: typeof details.nodeId === "string" ? details.nodeId : undefined,
              requestedAt: evt.ts,
              expiresAt: typeof details.expiresAtMs === "number" ? details.expiresAtMs : undefined,
            };
            record.approvals.push(approval);
            record.status = "needs_approval";
            record.currentState = `Waiting for approval${approval.command ? `: ${truncate(approval.command, 120)}` : ""}`;
            this.terminalStatus = "needs_approval";
            updateProof(record, evt.ts, {
              swarmCount: record.plan.swarms.length,
              domains: record.plan.domains,
              topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
              lastEvidenceSummary: record.currentState,
              checkpoint: record.checkpoint,
              terminalState: "needs_approval",
              terminalMessage: buildMissionTerminalNotice(record, "needs_approval"),
            });
          } else if (details?.status === "approval-unavailable") {
            record.approvals.push({
              id: crypto.randomUUID(),
              status: "unavailable",
              reason: typeof details.reason === "string" ? details.reason : "approval-unavailable",
              requestedAt: evt.ts,
            });
            record.status = "blocked";
            record.currentState = "Approval route unavailable";
            this.terminalStatus = "blocked";
            updateProof(record, evt.ts, {
              swarmCount: record.plan.swarms.length,
              domains: record.plan.domains,
              topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
              lastEvidenceSummary: record.currentState,
              checkpoint: record.checkpoint,
              terminalState: "blocked",
              terminalMessage: buildMissionTerminalNotice(record, "blocked"),
            });
          }
        }
      }
    });
  }

  async recordCapabilityPlan(plan: CapabilityPlan): Promise<void> {
    const summaryParts = [
      plan.ready.length > 0 ? `ready=${plan.ready.map((record) => record.id).join(",")}` : "",
      plan.provisioned.length > 0
        ? `provisioned=${plan.provisioned.map((record) => record.id).join(",")}`
        : "",
      plan.missing.length > 0 ? `missing=${plan.missing.map((record) => record.id).join(",")}` : "",
      plan.failed.length > 0 ? `failed=${plan.failed.map((record) => record.id).join(",")}` : "",
    ].filter(Boolean);
    const summary = summaryParts.length > 0 ? summaryParts.join(" | ") : "No capability changes";
    await this.queueUpdate((record) => {
      appendArtifact(record, {
        kind: "evidence",
        label: "Capability preflight",
        value: summary,
        createdAt: Date.now(),
      });
      if (plan.generatedSkillPath) {
        appendArtifact(record, {
          kind: "file",
          label: "Generated mission skill",
          value: shortenHomePath(plan.generatedSkillPath),
          createdAt: Date.now(),
        });
      }
      record.currentState = `Capability preflight: ${summary}`;
      record.checkpoint = {
        at: Date.now(),
        seq: record.checkpoint?.seq ?? 0,
        summary: record.currentState,
      };
      updateProof(record, Date.now(), {
        swarmCount: record.plan.swarms.length,
        domains: record.plan.domains,
        topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
        lastEvidenceSummary: record.currentState,
        checkpoint: record.checkpoint,
      });
    });
  }

  async finalizeCompleted(params: {
    replyText?: string;
    sessionFile?: string;
    aborted?: boolean;
  }): Promise<MissionRecord> {
    await this.queueUpdate((record) => {
      const status: MissionTerminalState =
        this.terminalStatus ?? (params.aborted ? "blocked" : "completed");
      record.status = status;
      record.currentState =
        status === "completed"
          ? "Mission completed"
          : status === "needs_approval"
            ? "Mission paused for approval"
            : "Mission blocked";
      record.terminalMessage = buildMissionTerminalNotice(record, status);
      updateProof(record, Date.now(), {
        swarmCount: record.plan.swarms.length,
        domains: record.plan.domains,
        topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
        lastEvidenceSummary: params.replyText?.trim() ? truncate(params.replyText, 180) : record.currentState,
        checkpoint: record.checkpoint,
        terminalState: status,
        terminalMessage: record.terminalMessage,
      });
      const activeAttempt = record.attempts.find((attempt) => attempt.runId === record.runId);
      if (activeAttempt) {
        activeAttempt.status = status;
        activeAttempt.endedAt = Date.now();
      }
      if (params.replyText?.trim()) {
        appendArtifact(record, {
          kind: "reply",
          label: "Terminal reply",
          value: truncate(params.replyText, 2000),
          createdAt: Date.now(),
        });
      }
      if (params.sessionFile) {
        appendArtifact(record, {
          kind: "transcript",
          label: "Transcript",
          value: shortenHomePath(params.sessionFile),
          createdAt: Date.now(),
        });
      }
      for (const subtask of record.subtasks) {
        if (subtask.status === "planned" || subtask.status === "running") {
          subtask.status = status === "completed" ? "completed" : status;
          subtask.updatedAt = Date.now();
        }
      }
    });
    await this.updateChain;
    const writeback = await appendMissionMemoryWriteback(this.record);
    if (writeback?.appended) {
      await this.queueUpdate((record) => {
        record.artifacts.push({
          kind: "file",
          label: "Mission memory writeback",
          value: shortenHomePath(writeback.path),
          createdAt: Date.now(),
        });
      });
      await this.updateChain;
    }
    try {
      const graphitiProof = await recordGraphitiMissionWriteback({
        agentId: this.record.agentId ?? "main",
        record: this.record,
        writeback,
      });
      await this.queueUpdate((record) => {
        record.artifacts.push({
          kind: "file",
          label: "Graphiti ledger proof",
          value: graphitiProof.paths.proofPath,
          createdAt: Date.now(),
        });
      });
      await this.updateChain;
    } catch {}
    return this.record;
  }

  async finalizeFailed(error: unknown): Promise<MissionRecord> {
    const message = error instanceof Error ? error.message : String(error);
    const status = this.terminalStatus ?? classifyTerminalState(message);
    await this.queueUpdate((record) => {
      record.status = status;
      record.currentState =
        status === "needs_approval"
          ? "Mission paused for approval"
          : status === "blocked"
            ? "Mission blocked"
            : "Mission failed";
      record.lastError = message;
      record.terminalMessage = buildMissionTerminalNotice(record, status, message);
      updateProof(record, Date.now(), {
        swarmCount: record.plan.swarms.length,
        domains: record.plan.domains,
        topology: "sovereign orchestrator -> domain swarms -> specialists -> verifier/recovery",
        lastEvidenceSummary: record.currentState,
        checkpoint: record.checkpoint,
        terminalState: status,
        terminalMessage: record.terminalMessage,
      });
      const activeAttempt = record.attempts.find((attempt) => attempt.runId === record.runId);
      if (activeAttempt) {
        activeAttempt.status = status;
        activeAttempt.endedAt = Date.now();
        activeAttempt.error = message;
      }
      appendArtifact(record, {
        kind: "evidence",
        label: "Terminal error",
        value: truncate(message, 2000),
        createdAt: Date.now(),
      });
    });
    await this.updateChain;
    const writeback = await appendMissionMemoryWriteback(this.record);
    if (writeback?.appended) {
      await this.queueUpdate((record) => {
        record.artifacts.push({
          kind: "file",
          label: "Mission memory writeback",
          value: shortenHomePath(writeback.path),
          createdAt: Date.now(),
        });
      });
      await this.updateChain;
    }
    try {
      const graphitiProof = await recordGraphitiMissionWriteback({
        agentId: this.record.agentId ?? "main",
        record: this.record,
        writeback,
      });
      await this.queueUpdate((record) => {
        record.artifacts.push({
          kind: "file",
          label: "Graphiti ledger proof",
          value: graphitiProof.paths.proofPath,
          createdAt: Date.now(),
        });
      });
      await this.updateChain;
    } catch {}
    return this.record;
  }
}

export function buildMissionTerminalNotice(
  record: MissionRecord,
  status: MissionTerminalState,
  errorMessage?: string,
): string {
  const approval = record.approvals.at(-1);
  if (status === "completed") {
    return `Mission ${record.id} completed. Objective: ${record.objective}`;
  }
  if (status === "needs_approval") {
    const approvalHint = approval?.slug
      ? ` Approval ${approval.slug} is waiting${approval.command ? ` for: ${truncate(approval.command, 140)}` : ""}.`
      : "";
    return `Mission ${record.id} needs approval before it can continue.${approvalHint}`;
  }
  if (status === "blocked") {
    return `Mission ${record.id} is blocked.${errorMessage ? ` Reason: ${truncate(errorMessage, 180)}` : ""}`;
  }
  return `Mission ${record.id} failed.${errorMessage ? ` Error: ${truncate(errorMessage, 180)}` : ""}`;
}

export function summarizeMissionForList(record: MissionRecord): string {
  const checkpoint = (record.checkpoint as MissionCheckpoint | undefined)?.summary;
  return `${record.id}  ${record.status}  ${truncate(record.objective, 60)}${checkpoint ? `  (${truncate(checkpoint, 50)})` : ""}`;
}

export function summarizeMissionPlan(record: MissionRecord): string[] {
  return record.plan.swarms.map(
    (swarm) =>
      `${labelMissionDomain(swarm.domain)}: lead=${swarm.lead}; verifier=${swarm.verifier}; recovery=${swarm.recovery}`,
  );
}
