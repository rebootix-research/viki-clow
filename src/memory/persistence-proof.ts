import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { hashText, listMemoryFiles } from "./internal.js";
import type { MemoryProviderStatus } from "./types.js";

export type MemoryPersistenceProofResult =
  | "ready"
  | "completed"
  | "failed"
  | "blocked"
  | "needs_approval";

export type MemoryPersistenceProofPaths = {
  baseDir: string;
  agentDir: string;
  manifestPath: string;
  eventsPath: string;
};

export type MemoryPersistenceProofSummary = {
  result: MemoryPersistenceProofResult;
  recordedAt: string;
  lineageId: string;
  proofPath: string;
  eventsPath: string;
  agentId: string;
  backend: string;
  provider: string;
  model?: string;
  requestedProvider?: string;
  syncReason?: string;
};

export type MemoryWritebackSummary = {
  path: string;
  relativePath: string;
  recordedAt: string;
  size: number;
};

export type MemoryPersistenceProofRecord = MemoryPersistenceProofSummary & {
  version: 1;
  workspaceDir?: string;
  dbPath?: string;
  reason?: string;
  snapshotHash: string;
  status: Pick<
    MemoryProviderStatus,
    | "files"
    | "chunks"
    | "dirty"
    | "sources"
    | "extraPaths"
    | "cache"
    | "fts"
    | "fallback"
    | "vector"
    | "batch"
    | "custom"
    | "workspaceDir"
    | "dbPath"
    | "provider"
    | "model"
    | "requestedProvider"
    | "backend"
  >;
};

type ProofParams = {
  agentId: string;
  env?: NodeJS.ProcessEnv;
  stateDir?: string;
};

type RecordProofParams = ProofParams & {
  status: MemoryProviderStatus;
  result: MemoryPersistenceProofResult;
  reason?: string;
  syncReason?: string;
};

function sanitizeAgentId(input: string): string {
  const cleaned = input.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return cleaned.replace(/^-+|-+$/g, "") || "default";
}

export function resolveMemoryPersistenceProofPaths(params: ProofParams): MemoryPersistenceProofPaths {
  const stateDir = params.stateDir ?? resolveStateDir(params.env ?? process.env);
  const baseDir = path.join(stateDir, "memory", "proof");
  const agentDir = path.join(baseDir, sanitizeAgentId(params.agentId));
  return {
    baseDir,
    agentDir,
    manifestPath: path.join(agentDir, "manifest.json"),
    eventsPath: path.join(agentDir, "events.jsonl"),
  };
}

function stableStatusSnapshot(status: MemoryProviderStatus): Record<string, unknown> {
  return {
    backend: status.backend,
    provider: status.provider,
    model: status.model,
    requestedProvider: status.requestedProvider,
    workspaceDir: status.workspaceDir,
    dbPath: status.dbPath,
    files: status.files,
    chunks: status.chunks,
    dirty: status.dirty,
    sources: status.sources ?? [],
    extraPaths: status.extraPaths ?? [],
    cache: status.cache ?? null,
    fts: status.fts ?? null,
    fallback: status.fallback ?? null,
    vector: status.vector ?? null,
    batch: status.batch ?? null,
    custom: status.custom ?? null,
  };
}

function stableLineageId(agentId: string, status: MemoryProviderStatus): string {
  return hashText(
    JSON.stringify({
      agentId: sanitizeAgentId(agentId),
      backend: status.backend,
      workspaceDir: status.workspaceDir ?? "",
      dbPath: status.dbPath ?? "",
      sources: status.sources ?? [],
      extraPaths: status.extraPaths ?? [],
      cacheEnabled: status.cache?.enabled ?? false,
      ftsEnabled: status.fts?.enabled ?? false,
      vectorEnabled: status.vector?.enabled ?? false,
    }),
  );
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tempPath = `${filePath}.tmp-${crypto.randomUUID()}`;
  const json = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(tempPath, json, "utf-8");
  await fs.rename(tempPath, filePath);
}

async function appendJsonl(filePath: string, value: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf-8");
}

export async function recordMemoryPersistenceProof(
  params: RecordProofParams,
): Promise<MemoryPersistenceProofRecord> {
  const paths = resolveMemoryPersistenceProofPaths(params);
  const recordedAt = new Date().toISOString();
  const snapshot = stableStatusSnapshot(params.status);
  const lineageId = stableLineageId(params.agentId, params.status);
  const snapshotHash = hashText(JSON.stringify(snapshot));
  const record: MemoryPersistenceProofRecord = {
    version: 1,
    result: params.result,
    recordedAt,
    lineageId,
    proofPath: paths.manifestPath,
    eventsPath: paths.eventsPath,
    agentId: params.agentId,
    backend: params.status.backend,
    provider: params.status.provider,
    model: params.status.model,
    requestedProvider: params.status.requestedProvider,
    workspaceDir: params.status.workspaceDir,
    dbPath: params.status.dbPath,
    reason: params.reason,
    syncReason: params.syncReason,
    snapshotHash,
    status: snapshot as MemoryPersistenceProofRecord["status"],
  };
  await writeJsonAtomic(paths.manifestPath, record);
  await appendJsonl(paths.eventsPath, record);
  return record;
}

export async function readLatestMemoryPersistenceProof(
  params: ProofParams,
): Promise<MemoryPersistenceProofRecord | null> {
  const paths = resolveMemoryPersistenceProofPaths(params);
  try {
    const raw = await fs.readFile(paths.manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as MemoryPersistenceProofRecord;
    if (parsed && typeof parsed === "object" && parsed.version === 1) {
      return parsed;
    }
  } catch {}
  try {
    const raw = await fs.readFile(paths.eventsPath, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);
    if (lines.length === 0) {
      return null;
    }
    const parsed = JSON.parse(lines[lines.length - 1]) as MemoryPersistenceProofRecord;
    if (parsed && typeof parsed === "object" && parsed.version === 1) {
      return parsed;
    }
  } catch {}
  return null;
}

export function summarizeMemoryPersistenceProof(
  record: MemoryPersistenceProofRecord | null | undefined,
): MemoryPersistenceProofSummary | null {
  if (!record) {
    return null;
  }
  return {
    result: record.result,
    recordedAt: record.recordedAt,
    lineageId: record.lineageId,
    proofPath: record.proofPath,
    eventsPath: record.eventsPath,
    agentId: record.agentId,
    backend: record.backend,
    provider: record.provider,
    model: record.model,
    requestedProvider: record.requestedProvider,
    syncReason: record.syncReason,
  };
}

export function summarizeMemoryWritebackSummary(
  record: MemoryWritebackSummary | null | undefined,
): MemoryWritebackSummary | null {
  if (!record) {
    return null;
  }
  return record;
}

export async function readLatestMemoryWritebackSummary(params: {
  workspaceDir: string;
}): Promise<MemoryWritebackSummary | null> {
  const files = await listMemoryFiles(params.workspaceDir);
  const candidates = await Promise.all(
    files.map(async (absPath) => {
      const relativePath = path.relative(params.workspaceDir, absPath).replace(/\\/g, "/");
      if (relativePath.startsWith("..")) {
        return null;
      }
      try {
        const stat = await fs.stat(absPath);
        if (!stat.isFile()) {
          return null;
        }
        return {
          path: absPath,
          relativePath,
          recordedAt: new Date(stat.mtimeMs).toISOString(),
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        };
      } catch {
        return null;
      }
    }),
  );
  const sorted = candidates
    .filter((value): value is MemoryWritebackSummary & { mtimeMs: number } => Boolean(value))
    .sort((left, right) => {
      if (right.mtimeMs !== left.mtimeMs) {
        return right.mtimeMs - left.mtimeMs;
      }
      return left.path.localeCompare(right.path);
    });
  const latest = sorted[0];
  if (!latest) {
    return null;
  }
  return {
    path: latest.path,
    relativePath: latest.relativePath,
    recordedAt: latest.recordedAt,
    size: latest.size,
  };
}
