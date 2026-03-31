import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { summarizeCapabilityPlan } from "../capabilities/runtime.js";
import { resolveStateDir } from "../config/paths.js";
import type { MissionRecord } from "../missions/types.js";
import type { ResolvedGraphitiConfig } from "./backend-config.js";
import { listMemoryFiles } from "./internal.js";
import type { MissionMemoryWritebackSummary } from "./mission-writeback.js";
import { readLatestMemoryWritebackSummary } from "./persistence-proof.js";
import type {
  MemoryEmbeddingProbeResult,
  MemoryProviderStatus,
  MemorySearchManager,
  MemorySearchResult,
  MemorySyncProgressUpdate,
} from "./types.js";

type GraphitiNeo4jState = {
  enabled: boolean;
  available: boolean;
  reason?: string;
  uri?: string;
  database?: string;
  synced?: boolean;
  lastSyncAt?: string;
  lastSyncError?: string;
};

type GraphitiWritebackSummary = {
  path: string;
  relativePath?: string;
  size?: number;
};

type Neo4jSessionLike = {
  run: (query: string, params?: Record<string, unknown>) => Promise<unknown>;
  close: () => Promise<void>;
};

type Neo4jDriverLike = {
  session: (options?: { database?: string }) => Neo4jSessionLike;
  close: () => Promise<void>;
};

type Neo4jDriverModuleLike = {
  auth: { basic: (user: string, password: string) => unknown };
  driver: (
    uri: string,
    auth?: unknown,
    options?: { connectionAcquisitionTimeout?: number },
  ) => Neo4jDriverLike;
};

export type GraphitiBackbonePaths = {
  baseDir: string;
  ledgerPath: string;
  proofPath: string;
};

export type GraphitiBackboneEntry = {
  version: 1;
  kind: "mission-writeback";
  recordedAt: string;
  agentId: string;
  missionId: string;
  objective: string;
  status: string;
  runId: string;
  sessionId?: string;
  sessionKey?: string;
  workspaceDir?: string;
  writebackPath?: string;
  writebackRelativePath?: string;
  capabilitySummary?: string;
  terminalMessage?: string;
  evidenceCount: number;
  artifactCount: number;
  proof?: {
    terminalState?: string;
    lastEvidenceSummary?: string;
  };
  neo4j: GraphitiNeo4jState;
  summary: string;
};

export type GraphitiBackboneProof = {
  version: 1;
  agentId: string;
  recordedAt: string;
  paths: GraphitiBackbonePaths;
  ledgerEntries: number;
  latestMissionId?: string;
  latestWritebackPath?: string;
  latestWritebackRelativePath?: string;
  latestCapabilitySummary?: string;
  latestStatus?: string;
  latestSummary?: string;
  neo4j: GraphitiNeo4jState;
  delegatedBackend?: string;
  lastSyncReason?: string;
};

export function resolveGraphitiBackbonePaths(params: {
  agentId: string;
  localStore?: string;
  env?: NodeJS.ProcessEnv;
}): GraphitiBackbonePaths {
  const stateDir = resolveStateDir(params.env ?? process.env);
  const baseDir =
    params.localStore?.trim() || path.join(stateDir, "memory", "graphiti", params.agentId);
  return {
    baseDir,
    ledgerPath: path.join(baseDir, "ledger.jsonl"),
    proofPath: path.join(baseDir, "proof.json"),
  };
}

function summarizeMission(record: MissionRecord): string {
  const status = record.status;
  const checkpoint = record.checkpoint?.summary?.trim();
  const terminal = record.terminalMessage?.trim();
  const summary = terminal || checkpoint || record.currentState || record.objective;
  const capabilitySummary = record.capabilityPlan
    ? summarizeCapabilityPlan(record.capabilityPlan)
    : "";
  return [record.id, status, summary, capabilitySummary ? `capabilities=${capabilitySummary}` : ""]
    .filter(Boolean)
    .join(" :: ");
}

function scoreMissionEntry(entry: GraphitiBackboneEntry, query: string): number {
  const haystack = [
    entry.missionId,
    entry.objective,
    entry.status,
    entry.summary,
    entry.capabilitySummary ?? "",
    entry.terminalMessage ?? "",
    entry.writebackRelativePath ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return 1;
  }
  let score = 0;
  for (const token of needle.split(/\s+/).filter(Boolean)) {
    if (haystack.includes(token)) {
      score += 1;
    }
  }
  if (haystack.includes(needle)) {
    score += needle.length / 10;
  }
  return score;
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

async function appendJsonl(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  const raw = await readTextIfExists(filePath);
  if (!raw) {
    return [];
  }
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function readTextIfExistsSync(filePath: string): string | null {
  try {
    return fsSync.readFileSync(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function readJsonSyncIfExists<T>(filePath: string): T | null {
  const raw = readTextIfExistsSync(filePath);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as T;
}

async function probeNeo4jConnection(config?: ResolvedGraphitiConfig): Promise<GraphitiNeo4jState> {
  if (!config?.neo4jUri) {
    return { enabled: false, available: false };
  }
  try {
    const parsed = new URL(config.neo4jUri);
    const host = parsed.hostname;
    const port = parsed.port ? Number(parsed.port) : 7687;
    if (!host || !Number.isFinite(port) || port <= 0) {
      return {
        enabled: true,
        available: false,
        reason: "invalid neo4j uri",
        uri: config.neo4jUri,
        database: config.neo4jDatabase,
      };
    }
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      const finish = (error?: Error) => {
        socket.removeAllListeners();
        socket.destroy();
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };
      socket.setTimeout(config.connectionTimeoutMs, () => {
        finish(new Error("neo4j connection timeout"));
      });
      socket.once("connect", () => finish());
      socket.once("error", (error) =>
        finish(error instanceof Error ? error : new Error(String(error))),
      );
    });
    return {
      enabled: true,
      available: true,
      uri: config.neo4jUri,
      database: config.neo4jDatabase,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      enabled: true,
      available: false,
      reason,
      uri: config.neo4jUri,
      database: config.neo4jDatabase,
    };
  }
}

async function loadNeo4jDriver(): Promise<Neo4jDriverModuleLike | null> {
  try {
    return (await import("neo4j-driver")) as Neo4jDriverModuleLike;
  } catch {
    return null;
  }
}

function stringifyGraphValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

export function buildGraphitiNeo4jMissionQuery(): string {
  return [
    "MERGE (mission:VikiMission {missionId: $missionId})",
    "SET mission.agentId = $agentId,",
    "    mission.objective = $objective,",
    "    mission.status = $status,",
    "    mission.runId = $runId,",
    "    mission.sessionId = $sessionId,",
    "    mission.sessionKey = $sessionKey,",
    "    mission.workspaceDir = $workspaceDir,",
    "    mission.capabilitySummary = $capabilitySummary,",
    "    mission.terminalMessage = $terminalMessage,",
    "    mission.summary = $summary,",
    "    mission.evidenceCount = $evidenceCount,",
    "    mission.artifactCount = $artifactCount,",
    "    mission.updatedAt = $updatedAt,",
    "    mission.recordedAt = $recordedAt",
  ].join("\n");
}

export function buildGraphitiNeo4jWritebackQuery(): string {
  return [
    "MATCH (mission:VikiMission {missionId: $missionId})",
    "MERGE (writeback:VikiWriteback {missionId: $missionId, relativePath: $writebackRelativePath})",
    "SET writeback.path = $writebackPath,",
    "    writeback.recordedAt = $recordedAt,",
    "    writeback.summary = $summary",
    "MERGE (mission)-[:WROTE_BACK]->(writeback)",
  ].join("\n");
}

export function buildGraphitiNeo4jSearchQuery(): string {
  return [
    "MATCH (mission:VikiMission)",
    "OPTIONAL MATCH (mission)-[:WROTE_BACK]->(writeback:VikiWriteback)",
    "WHERE toLower(coalesce(mission.objective, '')) CONTAINS $query",
    "   OR toLower(coalesce(mission.summary, '')) CONTAINS $query",
    "   OR toLower(coalesce(mission.capabilitySummary, '')) CONTAINS $query",
    "   OR toLower(coalesce(mission.terminalMessage, '')) CONTAINS $query",
    "   OR toLower(coalesce(writeback.relativePath, '')) CONTAINS $query",
    "RETURN mission.missionId AS missionId,",
    "       mission.summary AS summary,",
    "       mission.status AS status,",
    "       writeback.path AS writebackPath,",
    "       writeback.relativePath AS writebackRelativePath,",
    "       mission.updatedAt AS updatedAt",
    "ORDER BY mission.updatedAt DESC",
    "LIMIT $limit",
  ].join("\n");
}

async function withNeo4jSession<T>(
  config: ResolvedGraphitiConfig | undefined,
  run: (session: Neo4jSessionLike) => Promise<T>,
): Promise<T | null> {
  if (!config?.neo4jUri) {
    return null;
  }
  const neo4j = await loadNeo4jDriver();
  if (!neo4j) {
    return null;
  }
  const auth = config.neo4jUser
    ? neo4j.auth.basic(config.neo4jUser, config.neo4jPassword ?? "")
    : undefined;
  const driver = neo4j.driver(config.neo4jUri, auth, {
    connectionAcquisitionTimeout: config.connectionTimeoutMs,
  });
  try {
    const session = driver.session({
      database: config.neo4jDatabase || undefined,
    });
    try {
      return await run(session);
    } finally {
      await session.close();
    }
  } finally {
    await driver.close();
  }
}

async function syncGraphitiEntryToNeo4j(
  entry: GraphitiBackboneEntry,
  config?: ResolvedGraphitiConfig,
): Promise<GraphitiNeo4jState> {
  const state = await probeNeo4jConnection(config);
  if (!config?.neo4jUri || !state.available) {
    return state;
  }
  try {
    await withNeo4jSession(config, async (session) => {
      await session.run(buildGraphitiNeo4jMissionQuery(), {
        missionId: entry.missionId,
        agentId: entry.agentId,
        objective: entry.objective,
        status: entry.status,
        runId: entry.runId,
        sessionId: entry.sessionId ?? null,
        sessionKey: entry.sessionKey ?? null,
        workspaceDir: entry.workspaceDir ?? null,
        capabilitySummary: entry.capabilitySummary ?? null,
        terminalMessage: entry.terminalMessage ?? null,
        summary: entry.summary,
        evidenceCount: entry.evidenceCount,
        artifactCount: entry.artifactCount,
        updatedAt: Date.parse(entry.recordedAt),
        recordedAt: entry.recordedAt,
      });
      if (entry.writebackRelativePath || entry.writebackPath) {
        await session.run(buildGraphitiNeo4jWritebackQuery(), {
          missionId: entry.missionId,
          writebackRelativePath: entry.writebackRelativePath ?? entry.missionId,
          writebackPath: entry.writebackPath ?? null,
          recordedAt: entry.recordedAt,
          summary: entry.summary,
        });
      }
    });
    return {
      ...state,
      synced: true,
      lastSyncAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...state,
      synced: false,
      lastSyncAt: new Date().toISOString(),
      lastSyncError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function recordGraphitiMissionWriteback(params: {
  agentId: string;
  record: MissionRecord;
  writeback?: GraphitiWritebackSummary | MissionMemoryWritebackSummary | null;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
}): Promise<GraphitiBackboneProof> {
  const paths = resolveGraphitiBackbonePaths({
    agentId: params.agentId,
    localStore: params.config?.localStore,
    env: params.env,
  });
  const recordedAt = new Date().toISOString();
  let entry: GraphitiBackboneEntry = {
    version: 1,
    kind: "mission-writeback",
    recordedAt,
    agentId: params.agentId,
    missionId: params.record.id,
    objective: params.record.objective,
    status: params.record.status,
    runId: params.record.runId,
    sessionId: params.record.sessionId,
    sessionKey: params.record.sessionKey,
    workspaceDir: params.record.workspaceDir,
    writebackPath: params.writeback?.path,
    writebackRelativePath: params.writeback?.relativePath,
    capabilitySummary: params.record.capabilityPlan
      ? summarizeCapabilityPlan(params.record.capabilityPlan)
      : undefined,
    terminalMessage: params.record.terminalMessage,
    evidenceCount: params.record.evidence.length,
    artifactCount: params.record.artifacts.length,
    proof: params.record.proof
      ? {
          terminalState: params.record.proof.terminalState,
          lastEvidenceSummary: params.record.proof.lastEvidenceSummary,
        }
      : undefined,
    neo4j: await probeNeo4jConnection(params.config),
    summary: summarizeMission(params.record),
  };
  entry = {
    ...entry,
    neo4j: await syncGraphitiEntryToNeo4j(entry, params.config),
  };
  await appendJsonl(paths.ledgerPath, entry);
  const proof = await writeGraphitiBackboneProof({
    agentId: params.agentId,
    config: params.config,
    env: params.env,
    delegatedBackend: entry.neo4j.synced ? "neo4j" : "local-shadow",
    lastSyncReason: "mission-writeback",
  });
  return proof;
}

export async function writeGraphitiBackboneProof(params: {
  agentId: string;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
  delegatedBackend?: string;
  lastSyncReason?: string;
}): Promise<GraphitiBackboneProof> {
  const paths = resolveGraphitiBackbonePaths({
    agentId: params.agentId,
    localStore: params.config?.localStore,
    env: params.env,
  });
  const entries = await readJsonl<GraphitiBackboneEntry>(paths.ledgerPath);
  const latest = entries.at(-1);
  const neo4j = await probeNeo4jConnection(params.config);
  const proof: GraphitiBackboneProof = {
    version: 1,
    agentId: params.agentId,
    recordedAt: new Date().toISOString(),
    paths,
    ledgerEntries: entries.length,
    latestMissionId: latest?.missionId,
    latestWritebackPath: latest?.writebackPath,
    latestWritebackRelativePath: latest?.writebackRelativePath,
    latestCapabilitySummary: latest?.capabilitySummary,
    latestStatus: latest?.status,
    latestSummary: latest?.summary,
    neo4j,
    delegatedBackend: params.delegatedBackend,
    lastSyncReason: params.lastSyncReason,
  };
  await writeJson(paths.proofPath, proof);
  return proof;
}

function readLatestGraphitiBackboneProofSync(params: {
  agentId: string;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
}): GraphitiBackboneProof | null {
  const paths = resolveGraphitiBackbonePaths({
    agentId: params.agentId,
    localStore: params.config?.localStore,
    env: params.env,
  });
  return readJsonSyncIfExists<GraphitiBackboneProof>(paths.proofPath);
}

export async function readLatestGraphitiBackboneProof(params: {
  agentId: string;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
}): Promise<GraphitiBackboneProof | null> {
  const paths = resolveGraphitiBackbonePaths({
    agentId: params.agentId,
    localStore: params.config?.localStore,
    env: params.env,
  });
  const raw = await readTextIfExists(paths.proofPath);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as GraphitiBackboneProof;
    if (parsed && parsed.version === 1) {
      return parsed;
    }
  } catch {}
  return null;
}

export function summarizeGraphitiBackboneProof(
  proof: GraphitiBackboneProof | null | undefined,
): GraphitiBackboneProof | null {
  if (!proof) {
    return null;
  }
  return proof;
}

export async function syncGraphitiBackboneFromWorkspace(params: {
  agentId: string;
  workspaceDir: string;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
}): Promise<GraphitiBackboneProof> {
  const paths = resolveGraphitiBackbonePaths({
    agentId: params.agentId,
    localStore: params.config?.localStore,
    env: params.env,
  });
  const writebackFiles = await listMemoryFiles(params.workspaceDir);
  const existing = await readJsonl<GraphitiBackboneEntry>(paths.ledgerPath);
  const seen = new Set(existing.map((entry) => entry.writebackRelativePath ?? entry.missionId));
  for (const absPath of writebackFiles) {
    const relativePath = path.relative(params.workspaceDir, absPath).replace(/\\/g, "/");
    if (!relativePath.startsWith("memory/")) {
      continue;
    }
    if (seen.has(relativePath)) {
      continue;
    }
    const summary = await readLatestMemoryWritebackSummary({ workspaceDir: params.workspaceDir });
    if (!summary || summary.relativePath !== relativePath) {
      continue;
    }
    const missionId = hashText(`${relativePath}:${summary.size}`);
    let entry: GraphitiBackboneEntry = {
      version: 1,
      kind: "mission-writeback",
      recordedAt: summary.recordedAt,
      agentId: params.agentId,
      missionId,
      objective: `Workspace writeback: ${relativePath}`,
      status: "completed",
      runId: missionId,
      workspaceDir: params.workspaceDir,
      writebackPath: summary.path,
      writebackRelativePath: summary.relativePath,
      evidenceCount: 0,
      artifactCount: 0,
      neo4j: await probeNeo4jConnection(params.config),
      summary: `Workspace writeback ${relativePath}`,
    };
    entry = {
      ...entry,
      neo4j: await syncGraphitiEntryToNeo4j(entry, params.config),
    };
    await appendJsonl(paths.ledgerPath, entry);
    seen.add(relativePath);
  }
  return await writeGraphitiBackboneProof({
    agentId: params.agentId,
    config: params.config,
    env: params.env,
    delegatedBackend: params.config?.neo4jUri ? "neo4j" : "local-shadow",
    lastSyncReason: "workspace-sync",
  });
}

export async function searchGraphitiBackbone(params: {
  agentId: string;
  query: string;
  limit?: number;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
}): Promise<MemorySearchResult[]> {
  const paths = resolveGraphitiBackbonePaths({
    agentId: params.agentId,
    localStore: params.config?.localStore,
    env: params.env,
  });
  if (params.config?.neo4jUri) {
    try {
      const graphResults = await withNeo4jSession(params.config, async (session) => {
        const raw = (await session.run(buildGraphitiNeo4jSearchQuery(), {
          query: params.query.trim().toLowerCase(),
          limit: Math.max(1, params.limit ?? 10),
        })) as {
          records?: Array<{ get: (key: string) => unknown }>;
        };
        const records = raw.records ?? [];
        return records.map((record) => {
          const snippet = stringifyGraphValue(record.get("summary"));
          const writebackPath = stringifyGraphValue(record.get("writebackPath"));
          const relativePath = stringifyGraphValue(record.get("writebackRelativePath"));
          const missionId = stringifyGraphValue(record.get("missionId"));
          return {
            path: writebackPath || paths.proofPath,
            startLine: 1,
            endLine: 1,
            score: scoreMissionEntry(
              {
                version: 1,
                kind: "mission-writeback",
                recordedAt: new Date().toISOString(),
                agentId: params.agentId,
                missionId,
                objective: snippet,
                status: stringifyGraphValue(record.get("status"), "completed"),
                runId: missionId,
                evidenceCount: 0,
                artifactCount: 0,
                neo4j: {
                  enabled: true,
                  available: true,
                },
                summary: snippet,
                writebackPath: writebackPath || undefined,
                writebackRelativePath: relativePath || undefined,
              },
              params.query,
            ),
            snippet,
            source: "memory",
            citation: relativePath || missionId,
          } satisfies MemorySearchResult;
        });
      });
      if (graphResults && graphResults.length > 0) {
        return graphResults;
      }
    } catch {}
  }
  const entries = await readJsonl<GraphitiBackboneEntry>(paths.ledgerPath);
  const normalized = params.query.trim().toLowerCase();
  const scored = entries
    .map((entry) => ({
      entry,
      score: scoreMissionEntry(entry, normalized),
    }))
    .filter((item) => !normalized || item.score > 0)
    .toSorted((left, right) => right.score - left.score)
    .slice(0, Math.max(1, params.limit ?? 10));
  return scored.map((item) => ({
    path: item.entry.writebackPath ?? paths.proofPath,
    startLine: 1,
    endLine: 1,
    score: item.score,
    snippet: item.entry.summary,
    source: "memory",
    citation: item.entry.writebackRelativePath ?? item.entry.missionId,
  }));
}

export function buildGraphitiBackboneStatus(params: {
  agentId: string;
  config?: ResolvedGraphitiConfig;
  env?: NodeJS.ProcessEnv;
}): MemoryProviderStatus {
  const proof = readLatestGraphitiBackboneProofSync(params);
  const neo4j = proof?.neo4j ?? {
    enabled: Boolean(params.config?.neo4jUri),
    available: false,
    uri: params.config?.neo4jUri,
    database: params.config?.neo4jDatabase,
  };
  return {
    backend: "graphiti",
    provider: neo4j.available ? "neo4j" : "graphiti-local",
    model: "graphiti-backbone",
    workspaceDir: proof?.paths.baseDir ?? params.config?.localStore,
    dbPath:
      proof?.paths.proofPath ??
      resolveGraphitiBackbonePaths({
        agentId: params.agentId,
        localStore: params.config?.localStore,
        env: params.env,
      }).proofPath,
    files: proof?.ledgerEntries,
    chunks: proof?.ledgerEntries,
    dirty: false,
    custom: {
      graphiti: proof ?? {
        version: 1,
        agentId: params.agentId,
        recordedAt: new Date().toISOString(),
        paths: resolveGraphitiBackbonePaths({
          agentId: params.agentId,
          localStore: params.config?.localStore,
          env: params.env,
        }),
        ledgerEntries: 0,
        neo4j,
      },
    },
  };
}

export class GraphitiBackboneManager implements MemorySearchManager {
  constructor(
    private readonly params: {
      agentId: string;
      config?: ResolvedGraphitiConfig;
      env?: NodeJS.ProcessEnv;
      delegate?: MemorySearchManager | null;
    },
  ) {}

  async search(
    query: string,
    opts?: { maxResults?: number; minScore?: number; sessionKey?: string },
  ): Promise<MemorySearchResult[]> {
    const graphResults = await searchGraphitiBackbone({
      agentId: this.params.agentId,
      query,
      limit: opts?.maxResults,
      config: this.params.config,
      env: this.params.env,
    });
    const delegateResults = this.params.delegate
      ? await this.params.delegate.search(query, opts)
      : [];
    const merged = [...graphResults, ...delegateResults].toSorted(
      (left, right) => right.score - left.score,
    );
    const minScore = opts?.minScore ?? 0;
    return merged.filter((entry) => entry.score >= minScore).slice(0, opts?.maxResults ?? 10);
  }

  async readFile(params: { relPath: string; from?: number; lines?: number }) {
    if (this.params.delegate) {
      try {
        return await this.params.delegate.readFile(params);
      } catch {}
    }
    const rawPath = params.relPath.trim();
    if (!rawPath) {
      throw new Error("path required");
    }
    const paths = resolveGraphitiBackbonePaths({
      agentId: this.params.agentId,
      localStore: this.params.config?.localStore,
      env: this.params.env,
    });
    const target =
      rawPath === "graphiti/proof.json"
        ? paths.proofPath
        : rawPath === "graphiti/ledger.jsonl"
          ? paths.ledgerPath
          : path.isAbsolute(rawPath)
            ? rawPath
            : path.resolve(resolveStateDir(this.params.env), rawPath);
    const text = await fs.readFile(target, "utf8");
    return { text, path: rawPath };
  }

  status(): MemoryProviderStatus {
    const status = buildGraphitiBackboneStatus({
      agentId: this.params.agentId,
      config: this.params.config,
      env: this.params.env,
    });
    const delegateStatus = this.params.delegate?.status();
    if (!delegateStatus) {
      return status;
    }
    return {
      ...delegateStatus,
      backend: "graphiti",
      provider: status.provider,
      model: status.model,
      dbPath: status.dbPath ?? delegateStatus.dbPath,
      custom: {
        ...delegateStatus.custom,
        graphiti: status.custom?.graphiti,
      },
      fallback: delegateStatus.fallback,
    };
  }

  async sync(params?: {
    reason?: string;
    force?: boolean;
    progress?: (update: MemorySyncProgressUpdate) => void;
  }) {
    const status = this.status();
    const workspaceDir = status.workspaceDir;
    if (workspaceDir) {
      await syncGraphitiBackboneFromWorkspace({
        agentId: this.params.agentId,
        workspaceDir,
        config: this.params.config,
        env: this.params.env,
      });
    }
    await this.params.delegate?.sync?.(params);
  }

  async probeEmbeddingAvailability(): Promise<MemoryEmbeddingProbeResult> {
    return this.params.delegate?.probeEmbeddingAvailability() ?? { ok: true };
  }

  async probeVectorAvailability(): Promise<boolean> {
    return this.params.delegate?.probeVectorAvailability() ?? false;
  }

  async close(): Promise<void> {
    await this.params.delegate?.close?.();
  }
}

function hashText(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
