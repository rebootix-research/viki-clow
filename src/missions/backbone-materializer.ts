import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import { writeNativeVikiBrowserProof } from "../browser/native-proof.js";
import { readBrowserdManifest } from "../browser/browserd.js";
import { resolveDefaultAgentId } from "../agents/agent-scope.js";
import { resolveMemoryBackendConfig } from "../memory/backend-config.js";
import { readLatestGraphitiBackboneProof, writeGraphitiBackboneProof } from "../memory/graphiti-backbone.js";
import { buildMissionBackbone } from "./backbone.js";
import type { MissionRecord, MissionRuntimeBackbone, MissionStatus } from "./types.js";

type MissionBackbonePaths = {
  baseDir: string;
  temporalPath: string;
  langGraphPath: string;
  proofPath: string;
  checkpointPath: string;
};

type TemporalMaterialization = {
  backend: "temporal" | "shadow";
  configured: boolean;
  connected: boolean;
  address?: string;
  namespace: string;
  queue: string;
  workflowId: string;
  workflowType: string;
  missionId: string;
  runId: string;
  status: MissionStatus;
  currentState: string;
  attempts: number;
  lastCheckpoint?: MissionRecord["checkpoint"];
  lastHeartbeatAt: number;
  descriptorPath: string;
  lastSyncAt: number;
  lastSyncError?: string;
};

type TemporalConnectionLike = {
  workflowService: {
    getSystemInfo: (request: Record<string, never>) => Promise<unknown>;
  };
  close: () => Promise<void>;
};

type TemporalClientModuleLike = {
  Connection: {
    connect: (options: { address: string }) => Promise<TemporalConnectionLike>;
  };
};

type LangGraphMaterialization = {
  backend: "langgraph" | "shadow";
  configured: boolean;
  connected: boolean;
  endpoint?: string;
  graphId: string;
  version: string;
  topology: string;
  currentNodeId: string;
  sovereignNodeId: string;
  verifierNodeId: string;
  recoveryNodeId: string;
  nodes: MissionRuntimeBackbone["langGraph"]["nodes"];
  edges: MissionRuntimeBackbone["langGraph"]["edges"];
  checkpointPath: string;
  descriptorPath: string;
  lastCheckpoint?: MissionRecord["checkpoint"];
  lastSyncAt: number;
  lastSyncError?: string;
};

type BrowserMaterialization = {
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
  lastSyncAt: number;
  lastSyncError?: string;
};

type MemoryMaterialization = {
  backend: "neo4j" | "local-shadow";
  configured: boolean;
  connected: boolean;
  proofPath?: string;
  localStore?: string;
  delegatedBackend?: string;
  neo4jUri?: string;
  lastSyncAt: number;
  lastSyncError?: string;
};

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function resolveMissionBackbonePaths(
  missionId: string,
  env: NodeJS.ProcessEnv = process.env,
): MissionBackbonePaths {
  const baseDir = path.join(resolveStateDir(env), "missions", "backbone", missionId);
  return {
    baseDir,
    temporalPath: path.join(baseDir, "temporal.json"),
    langGraphPath: path.join(baseDir, "langgraph.json"),
    proofPath: path.join(baseDir, "proof.json"),
    checkpointPath: path.join(baseDir, "langgraph.checkpoint.json"),
  };
}

async function probeTemporalConnection(address: string): Promise<{ connected: boolean; error?: string }> {
  try {
    const mod = await loadTemporalClient();
    if (!mod) {
      return {
        connected: false,
        error: "Temporal client package not installed",
      };
    }
    const connection = await mod.Connection.connect({ address });
    try {
      await connection.workflowService.getSystemInfo({});
    } finally {
      await connection.close();
    }
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadTemporalClient(): Promise<TemporalClientModuleLike | null> {
  try {
    const loader = new Function("return import('@temporalio/client');") as () => Promise<unknown>;
    return (await loader()) as TemporalClientModuleLike;
  } catch {
    return null;
  }
}

async function probeLangGraphEndpoint(endpoint: string): Promise<{ connected: boolean; error?: string }> {
  try {
    const base = new URL(endpoint);
    const healthPath = trimEnv(process.env.VIKICLOW_LANGGRAPH_HEALTHCHECK_PATH) ?? "/ok";
    const target = new URL(healthPath, base).toString();
    const response = await fetch(target, {
      method: "GET",
      headers: { accept: "application/json,text/plain,*/*" },
    });
    if (!response.ok) {
      return { connected: false, error: `healthcheck returned ${response.status}` };
    }
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function materializeTemporalBoundary(
  record: MissionRecord,
  backbone: MissionRuntimeBackbone,
  paths: MissionBackbonePaths,
  env: NodeJS.ProcessEnv,
): Promise<TemporalMaterialization> {
  const address = trimEnv(env.VIKICLOW_TEMPORAL_ADDRESS);
  const configured = Boolean(address);
  const lastSyncAt = Date.now();
  const connection = address ? await probeTemporalConnection(address) : { connected: false as const };
  const materialized: TemporalMaterialization = {
    backend: connection.connected ? "temporal" : "shadow",
    configured,
    connected: connection.connected,
    address,
    namespace: trimEnv(env.VIKICLOW_TEMPORAL_NAMESPACE) ?? backbone.temporal.namespace,
    queue: trimEnv(env.VIKICLOW_TEMPORAL_QUEUE) ?? backbone.temporal.queue,
    workflowId: backbone.temporal.workflowId,
    workflowType: backbone.temporal.workflowType,
    missionId: record.id,
    runId: record.runId,
    status: record.status,
    currentState: record.currentState,
    attempts: record.attempts.length,
    lastCheckpoint: record.checkpoint,
    lastHeartbeatAt: record.updatedAt,
    descriptorPath: paths.temporalPath,
    lastSyncAt,
    lastSyncError: connection.error,
  };
  await writeJson(paths.temporalPath, materialized);
  return materialized;
}

async function materializeLangGraphBoundary(
  record: MissionRecord,
  backbone: MissionRuntimeBackbone,
  paths: MissionBackbonePaths,
  env: NodeJS.ProcessEnv,
): Promise<LangGraphMaterialization> {
  const endpoint = trimEnv(env.VIKICLOW_LANGGRAPH_ENDPOINT);
  const configured = Boolean(endpoint);
  const lastSyncAt = Date.now();
  const connection = endpoint ? await probeLangGraphEndpoint(endpoint) : { connected: false as const };
  const checkpointPayload = {
    missionId: record.id,
    runId: record.runId,
    checkpoint: record.checkpoint,
    currentNodeId: backbone.langGraph.currentNodeId,
    status: record.status,
    updatedAt: record.updatedAt,
  };
  await writeJson(paths.checkpointPath, checkpointPayload);
  const materialized: LangGraphMaterialization = {
    backend: connection.connected ? "langgraph" : "shadow",
    configured,
    connected: connection.connected,
    endpoint,
    graphId: backbone.langGraph.graphId,
    version: backbone.langGraph.version,
    topology: backbone.langGraph.topology,
    currentNodeId: backbone.langGraph.currentNodeId,
    sovereignNodeId: backbone.langGraph.sovereignNodeId,
    verifierNodeId: backbone.langGraph.verifierNodeId,
    recoveryNodeId: backbone.langGraph.recoveryNodeId,
    nodes: backbone.langGraph.nodes,
    edges: backbone.langGraph.edges,
    checkpointPath: paths.checkpointPath,
    descriptorPath: paths.langGraphPath,
    lastCheckpoint: record.checkpoint,
    lastSyncAt,
    lastSyncError: connection.error,
  };
  await writeJson(paths.langGraphPath, materialized);
  return materialized;
}

async function materializeBrowserBoundary(
  backbone: MissionRuntimeBackbone,
  env: NodeJS.ProcessEnv,
): Promise<BrowserMaterialization> {
  const lastSyncAt = Date.now();
  const manifest = await readBrowserdManifest(env);
  try {
    const { proof, jsonPath } = await writeNativeVikiBrowserProof({ env });
    return {
      backend: manifest ? "browserd" : "shadow",
      product: "Viki Browser",
      defaultProfile: manifest?.defaultProfile ?? backbone.browser.defaultProfile,
      manifestPresent: proof.manifestPresent,
      manifestPath: proof.manifestPath,
      controlUrl: manifest?.controlUrl,
      sessionVaultReady: proof.sessionVaultReady,
      evidenceReady: proof.evidenceReady,
      nativeReady: proof.passed,
      nativeProofPath: jsonPath,
      candidates: proof.candidates.filter((candidate) => candidate.exists).map((candidate) => candidate.executablePath),
      configuredExecutable: proof.configuredExecutable,
      descriptorPath: manifest?.manifestPath,
      lastSyncAt,
      lastSyncError: proof.notes.length > 0 ? proof.notes.join("; ") : undefined,
    };
  } catch (error) {
    return {
      backend: manifest ? "browserd" : "shadow",
      product: "Viki Browser",
      defaultProfile: manifest?.defaultProfile ?? backbone.browser.defaultProfile,
      manifestPresent: Boolean(manifest),
      manifestPath: manifest?.manifestPath,
      controlUrl: manifest?.controlUrl,
      sessionVaultReady: false,
      evidenceReady: false,
      nativeReady: false,
      candidates: [],
      descriptorPath: manifest?.manifestPath,
      lastSyncAt,
      lastSyncError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function materializeMemoryBoundary(
  record: MissionRecord,
  env: NodeJS.ProcessEnv,
): Promise<MemoryMaterialization> {
  const lastSyncAt = Date.now();
  try {
    const cfg = loadConfig();
    const agentId = record.agentId ?? resolveDefaultAgentId(cfg);
    const resolved = resolveMemoryBackendConfig({ cfg, agentId });
    const graphiti = resolved.graphiti;
    if (!graphiti) {
      return {
        backend: "local-shadow",
        configured: false,
        connected: false,
        localStore: record.workspaceDir,
        lastSyncAt,
      };
    }
    const latestProof = await readLatestGraphitiBackboneProof({
      agentId,
      config: graphiti,
      env,
    });
    const proof =
      latestProof ??
      (await writeGraphitiBackboneProof({
        agentId,
        config: graphiti,
        env,
        delegatedBackend: graphiti.neo4jUri ? "neo4j-or-shadow" : "local-shadow",
        lastSyncReason: "mission-backbone",
      }));
    return {
      backend: proof.neo4j.available ? "neo4j" : "local-shadow",
      configured: Boolean(graphiti.neo4jUri),
      connected: proof.neo4j.available,
      proofPath: proof.paths.proofPath,
      localStore: proof.paths.baseDir,
      delegatedBackend: proof.delegatedBackend,
      neo4jUri: graphiti.neo4jUri,
      lastSyncAt,
      lastSyncError: proof.neo4j.lastSyncError ?? proof.neo4j.reason,
    };
  } catch (error) {
    return {
      backend: "local-shadow",
      configured: false,
      connected: false,
      localStore: record.workspaceDir,
      lastSyncAt,
      lastSyncError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function materializeMissionBackbone(
  record: MissionRecord,
  env: NodeJS.ProcessEnv = process.env,
): Promise<MissionRuntimeBackbone> {
  const backbone = buildMissionBackbone(record);
  const paths = resolveMissionBackbonePaths(record.id, env);
  const [temporal, langGraph, browser, memory] = await Promise.all([
    materializeTemporalBoundary(record, backbone, paths, env),
    materializeLangGraphBoundary(record, backbone, paths, env),
    materializeBrowserBoundary(backbone, env),
    materializeMemoryBoundary(record, env),
  ]);
  const materialized: MissionRuntimeBackbone = {
    temporal: {
      ...backbone.temporal,
      ...temporal,
    },
    langGraph: {
      ...backbone.langGraph,
      ...langGraph,
    },
    browser: {
      ...backbone.browser,
      ...browser,
    },
    memory: {
      ...backbone.memory,
      ...memory,
    },
    updatedAt: Date.now(),
    proofPath: paths.proofPath,
    materialized: true,
  };
  await writeJson(paths.proofPath, {
    missionId: record.id,
    updatedAt: materialized.updatedAt,
    temporal: {
      backend: materialized.temporal.backend,
      configured: materialized.temporal.configured,
      connected: materialized.temporal.connected,
      workflowId: materialized.temporal.workflowId,
      descriptorPath: materialized.temporal.descriptorPath,
      lastSyncError: materialized.temporal.lastSyncError,
    },
    langGraph: {
      backend: materialized.langGraph.backend,
      configured: materialized.langGraph.configured,
      connected: materialized.langGraph.connected,
      graphId: materialized.langGraph.graphId,
      currentNodeId: materialized.langGraph.currentNodeId,
      descriptorPath: materialized.langGraph.descriptorPath,
      checkpointPath: materialized.langGraph.checkpointPath,
      lastSyncError: materialized.langGraph.lastSyncError,
    },
    browser: {
      backend: materialized.browser.backend,
      manifestPresent: materialized.browser.manifestPresent,
      controlUrl: materialized.browser.controlUrl,
      nativeReady: materialized.browser.nativeReady,
      nativeProofPath: materialized.browser.nativeProofPath,
      descriptorPath: materialized.browser.descriptorPath,
      lastSyncError: materialized.browser.lastSyncError,
    },
    memory: {
      backend: materialized.memory.backend,
      configured: materialized.memory.configured,
      connected: materialized.memory.connected,
      proofPath: materialized.memory.proofPath,
      delegatedBackend: materialized.memory.delegatedBackend,
      neo4jUri: materialized.memory.neo4jUri,
      lastSyncError: materialized.memory.lastSyncError,
    },
  });
  return materialized;
}
