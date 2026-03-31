import fs from "node:fs/promises";
import path from "node:path";
import { formatCapabilityPlanLines } from "../capabilities/runtime.js";
import type { MissionRecord } from "../missions/types.js";
import { shortenHomePath } from "../utils.js";

export type MissionMemoryWritebackSummary = {
  path: string;
  relativePath: string;
  size: number;
  recordedAt: string;
  appended: boolean;
};

function formatDateStampInTimezone(nowMs: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(nowMs));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }
  return new Date(nowMs).toISOString().slice(0, 10);
}

function resolveMissionWritebackTimezone(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone.trim();
    if (resolved) {
      return resolved;
    }
  } catch {}
  return "UTC";
}

export function resolveMissionMemoryWritebackRelativePath(
  params: {
    nowMs?: number;
    timezone?: string;
  } = {},
): string {
  const nowMs = Number.isFinite(params.nowMs) ? (params.nowMs as number) : Date.now();
  const timezone = params.timezone?.trim() || resolveMissionWritebackTimezone();
  const dateStamp = formatDateStampInTimezone(nowMs, timezone);
  return path.join("memory", `${dateStamp}.md`).replace(/\\/g, "/");
}

function formatListItem(label: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return `- ${label}: ${trimmed}`;
}

function buildMissionMemoryWritebackMarkdown(record: MissionRecord, recordedAt: string): string {
  const lines = [
    `## Mission Writeback - ${recordedAt}`,
    `- Mission: ${record.id}`,
    `- Objective: ${record.objective}`,
    `- Status: ${record.status}`,
    `- Run: ${record.runId}`,
    ...[
      formatListItem("Agent", record.agentId),
      formatListItem("Session", record.sessionId),
      formatListItem(
        "Workspace",
        record.workspaceDir ? shortenHomePath(record.workspaceDir) : undefined,
      ),
      formatListItem("Checkpoint", record.checkpoint?.summary),
      formatListItem("Terminal message", record.terminalMessage),
      formatListItem("Last error", record.lastError),
    ].filter((line): line is string => Boolean(line)),
    `- Evidence entries: ${record.evidence.length}`,
    `- Artifacts: ${record.artifacts.length}`,
  ];

  if (record.approvals.length > 0) {
    const lastApproval = record.approvals.at(-1);
    if (lastApproval) {
      lines.push(
        `- Latest approval: ${lastApproval.status}${lastApproval.command ? ` :: ${lastApproval.command}` : ""}`,
      );
    }
  }

  if (record.capabilityPlan) {
    lines.push("- Capability Foundry:");
    for (const line of formatCapabilityPlanLines(record.capabilityPlan)) {
      lines.push(`  ${line}`);
    }
  }

  if (record.artifacts.length > 0) {
    lines.push("- Artifact log:");
    for (const artifact of record.artifacts.slice(-5)) {
      lines.push(`  - ${artifact.kind}: ${artifact.label} :: ${artifact.value}`);
    }
  }

  if (record.evidence.length > 0) {
    const latestEvidence = record.evidence.at(-1);
    if (latestEvidence) {
      lines.push(`- Latest evidence: ${latestEvidence.summary}`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function appendMissionMemoryWriteback(
  record: MissionRecord,
  params: {
    nowMs?: number;
    timezone?: string;
  } = {},
): Promise<MissionMemoryWritebackSummary | null> {
  if (!record.workspaceDir?.trim()) {
    return null;
  }

  const recordedAt = new Date(
    Number.isFinite(params.nowMs) ? (params.nowMs as number) : Date.now(),
  ).toISOString();
  const relativePath = resolveMissionMemoryWritebackRelativePath(params);
  const absolutePath = path.join(record.workspaceDir, relativePath);
  const existing = await readTextIfExists(absolutePath);
  if (existing?.includes(`- Mission: ${record.id}`)) {
    const stat = await fs.stat(absolutePath).catch(() => null);
    return {
      path: absolutePath,
      relativePath,
      size: stat?.size ?? Buffer.byteLength(existing, "utf8"),
      recordedAt,
      appended: false,
    };
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  const section = buildMissionMemoryWritebackMarkdown(record, recordedAt);
  const needsSeparator = Boolean(existing && !existing.endsWith("\n"));
  await fs.appendFile(absolutePath, `${needsSeparator ? "\n" : ""}${section}`, "utf8");
  const stat = await fs.stat(absolutePath);
  return {
    path: absolutePath,
    relativePath,
    size: stat.size,
    recordedAt,
    appended: true,
  };
}
