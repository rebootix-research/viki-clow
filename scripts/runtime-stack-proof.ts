#!/usr/bin/env -S node --import tsx

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { beginMissionRun } from "../src/missions/runtime.ts";
import { loadMissionRecord } from "../src/missions/store.ts";
import { resolveMemoryBackendConfig } from "../src/memory/backend-config.ts";
import { searchGraphitiBackbone } from "../src/memory/graphiti-backbone.ts";
import type { VikiClowConfig } from "../src/config/config.ts";

function sh(command: string, args: string[]) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 20,
  }).trim();
}

async function waitForPort(host: string, port: number, timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const connected = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ host, port });
      const done = (ok: boolean) => {
        socket.removeAllListeners();
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(1500, () => done(false));
      socket.once("connect", () => done(true));
      socket.once("error", () => done(false));
    });
    if (connected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  label: string,
): Promise<T> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        lastError = new Error(`${label} returned ${response.status}`);
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} did not become ready before timeout`);
}

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const rootDir = path.resolve(".");
const composePath = path.join(rootDir, "docker-compose.runtime-stack.yml");
const outDir = path.join(rootDir, ".artifacts", "runtime-stack-proof");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-runtime-stack-"));
const stateDir = path.join(tempRoot, "state");
const workspaceDir = path.join(tempRoot, "workspace");
const configPath = path.join(tempRoot, "vikiclow.json");
const proofPath = path.join(outDir, "runtime-stack-proof.json");
const temporalHostPort = "17233";
const neo4jHostPort = "17687";
const langGraphHostPort = "12024";

const config: VikiClowConfig = {
  agents: {
    defaults: {
      workspace: workspaceDir,
    },
  },
  browser: {
    enabled: true,
  },
  gateway: {
    port: 18789,
  },
};

const envPatch: Record<string, string> = {
  VIKICLOW_CONFIG_PATH: configPath,
  VIKICLOW_STATE_DIR: stateDir,
  VIKICLOW_MEMORY_BACKEND: "graphiti",
  VIKICLOW_GRAPHITI_NEO4J_URI: `neo4j://127.0.0.1:${neo4jHostPort}`,
  VIKICLOW_GRAPHITI_NEO4J_USER: "neo4j",
  VIKICLOW_GRAPHITI_NEO4J_PASSWORD: "vikiclow-dev-password",
  VIKICLOW_GRAPHITI_NEO4J_DATABASE: "neo4j",
  VIKICLOW_TEMPORAL_ADDRESS: `127.0.0.1:${temporalHostPort}`,
  VIKICLOW_LANGGRAPH_ENDPOINT: `http://127.0.0.1:${langGraphHostPort}`,
  VIKICLOW_LANGGRAPH_HEALTHCHECK_PATH: "/ok",
};

function renderMarkdownProof(proof: {
  generatedAt: string;
  compose: { file: string; services: string[] };
  mission: {
    id: string;
    status: string;
    proofPath: string;
    temporal: {
      configured: boolean;
      connected: boolean;
      backend: string;
      address: string;
      descriptorPath: string;
      lastSyncError: string | null;
    };
    langGraph: {
      configured: boolean;
      connected: boolean;
      backend: string;
      endpoint: string | null;
      descriptorPath: string | null;
      lastSyncError: string | null;
    };
    memory: {
      configured: boolean;
      connected: boolean;
      backend: string;
      proofPath: string | null;
      delegatedBackend: string | null;
      neo4jUri: string | null;
      lastSyncError: string | null;
    };
  };
  search: {
    hits: number;
    firstCitation: string | null;
  };
  langGraphProbe?: {
    service: string | null;
    version: string | null;
    runtime: string | null;
    graphId: string | null;
    invokedTrace: string[];
  };
}) {
  return [
    "# Runtime Stack Proof",
    "",
    `- Generated at: ${proof.generatedAt}`,
    `- Compose file: ${proof.compose.file}`,
    `- Services: ${proof.compose.services.join(", ")}`,
    `- Mission id: ${proof.mission.id}`,
    `- Mission status: ${proof.mission.status}`,
    `- Mission proof: ${proof.mission.proofPath}`,
    "",
    "## Temporal",
    `- Configured: ${proof.mission.temporal.configured}`,
    `- Connected: ${proof.mission.temporal.connected}`,
    `- Backend: ${proof.mission.temporal.backend}`,
    `- Address: ${proof.mission.temporal.address}`,
    `- Descriptor: ${proof.mission.temporal.descriptorPath}`,
    `- Last sync error: ${proof.mission.temporal.lastSyncError ?? "none"}`,
    "",
    "## LangGraph",
    `- Configured: ${proof.mission.langGraph.configured}`,
    `- Connected: ${proof.mission.langGraph.connected}`,
    `- Backend: ${proof.mission.langGraph.backend}`,
    `- Endpoint: ${proof.mission.langGraph.endpoint ?? "not configured"}`,
    `- Descriptor: ${proof.mission.langGraph.descriptorPath ?? "not generated"}`,
    `- Last sync error: ${proof.mission.langGraph.lastSyncError ?? "none"}`,
    `- Probe version: ${proof.langGraphProbe?.version ?? "unknown"}`,
    `- Probe runtime: ${proof.langGraphProbe?.runtime ?? "unknown"}`,
    `- Probe graph: ${proof.langGraphProbe?.graphId ?? "unknown"}`,
    `- Probe trace: ${
      proof.langGraphProbe && proof.langGraphProbe.invokedTrace.length > 0
        ? proof.langGraphProbe.invokedTrace.join(" -> ")
        : "none"
    }`,
    "",
    "## Memory",
    `- Configured: ${proof.mission.memory.configured}`,
    `- Connected: ${proof.mission.memory.connected}`,
    `- Backend: ${proof.mission.memory.backend}`,
    `- Delegated backend: ${proof.mission.memory.delegatedBackend ?? "none"}`,
    `- Neo4j URI: ${proof.mission.memory.neo4jUri ?? "not configured"}`,
    `- Memory proof: ${proof.mission.memory.proofPath ?? "not generated"}`,
    `- Last sync error: ${proof.mission.memory.lastSyncError ?? "none"}`,
    "",
    "## Search",
    `- Hits: ${proof.search.hits}`,
    `- First citation: ${proof.search.firstCitation ?? "none"}`,
    "",
  ].join("\n");
}

const previousEnv = new Map<string, string | undefined>();
for (const [key, value] of Object.entries(envPatch)) {
  previousEnv.set(key, process.env[key]);
  process.env[key] = value;
}

await fs.mkdir(workspaceDir, { recursive: true });
await writeJson(configPath, config);

let composeLogs = "";
try {
  sh("docker", ["compose", "-f", composePath, "up", "-d", "--build", "--force-recreate"]);
  await waitForPort("127.0.0.1", Number(temporalHostPort), 120_000);
  await waitForPort("127.0.0.1", Number(neo4jHostPort), 120_000);
  await waitForPort("127.0.0.1", Number(langGraphHostPort), 120_000);

  const tracker = await beginMissionRun({
    objective: "Runtime stack proof mission for Temporal and Graphiti-backed execution",
    runId: `runtime-proof-${Date.now()}`,
    agentId: "main",
    workspaceDir,
    deliver: false,
    replayRequest: {
      missionId: "runtime-stack-proof",
      message: "Runtime stack proof mission for Temporal and Graphiti-backed execution",
    },
  });
  const completed = await tracker.finalizeCompleted({
    replyText: "Runtime stack proof completed.",
  });

  const stored = await loadMissionRecord(completed.id);
  if (!stored?.backbone) {
    throw new Error("Mission backbone was not materialized");
  }

  const memoryConfig = resolveMemoryBackendConfig({
    cfg: config,
    agentId: "main",
    env: process.env,
  }).graphiti;
  const graphResults = await searchGraphitiBackbone({
    agentId: "main",
    query: "runtime stack proof",
    config: memoryConfig,
    env: process.env,
  });
  const langGraphMetadata = await fetchJsonWithRetry<{
    service?: string;
    langgraph_version?: string;
    runtime?: string;
    graph_id?: string;
    nodes?: string[];
  }>(`http://127.0.0.1:${langGraphHostPort}/metadata`, {
    method: "GET",
    headers: { accept: "application/json" },
  }, 30_000, "LangGraph metadata probe");
  const langGraphInvoke = await fetchJsonWithRetry<{
    ok?: boolean;
    result?: { trace?: string[] };
    graph_id?: string;
  }>(`http://127.0.0.1:${langGraphHostPort}/invoke`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      mission_id: stored.id,
      trace: ["proof-start"],
    }),
  }, 30_000, "LangGraph invoke probe");
  if (langGraphInvoke.ok !== true) {
    throw new Error("LangGraph invoke probe returned an invalid payload");
  }

  const proof = {
    generatedAt: new Date().toISOString(),
    compose: {
      file: composePath,
      services: ["temporal", "neo4j", "langgraph"],
    },
    mission: {
      id: stored.id,
      status: stored.status,
      proofPath: stored.backbone.proofPath,
      temporal: {
        configured: stored.backbone.temporal.configured,
        connected: stored.backbone.temporal.connected,
        backend: stored.backbone.temporal.backend,
        address: stored.backbone.temporal.address,
        descriptorPath: stored.backbone.temporal.descriptorPath,
        lastSyncError: stored.backbone.temporal.lastSyncError ?? null,
      },
      langGraph: {
        configured: stored.backbone.langGraph.configured,
        connected: stored.backbone.langGraph.connected,
        backend: stored.backbone.langGraph.backend,
        endpoint: stored.backbone.langGraph.endpoint ?? null,
        descriptorPath: stored.backbone.langGraph.descriptorPath ?? null,
        lastSyncError: stored.backbone.langGraph.lastSyncError ?? null,
      },
      memory: {
        configured: stored.backbone.memory.configured,
        connected: stored.backbone.memory.connected,
        backend: stored.backbone.memory.backend,
        proofPath: stored.backbone.memory.proofPath ?? null,
        delegatedBackend: stored.backbone.memory.delegatedBackend ?? null,
        neo4jUri: stored.backbone.memory.neo4jUri ?? null,
        lastSyncError: stored.backbone.memory.lastSyncError ?? null,
      },
    },
    search: {
      hits: graphResults.length,
      firstCitation: graphResults[0]?.citation ?? null,
    },
    langGraphProbe: {
      service: langGraphMetadata.service ?? null,
      version: langGraphMetadata.langgraph_version ?? null,
      runtime: langGraphMetadata.runtime ?? null,
      graphId: langGraphMetadata.graph_id ?? langGraphInvoke.graph_id ?? null,
      invokedTrace: Array.isArray(langGraphInvoke.result?.trace) ? langGraphInvoke.result.trace : [],
    },
  };

  await writeJson(proofPath, proof);
  await fs.writeFile(
    path.join(outDir, "runtime-stack-proof.md"),
    renderMarkdownProof(proof),
    "utf8",
  );
  console.log(`runtime-stack-proof: wrote ${proofPath}`);
  if (!proof.mission.temporal.connected) {
    throw new Error(
      `Temporal did not connect${proof.mission.temporal.lastSyncError ? `: ${proof.mission.temporal.lastSyncError}` : ""}`,
    );
  }
  if (!proof.mission.memory.connected) {
    throw new Error(
      `Neo4j did not connect${proof.mission.memory.lastSyncError ? `: ${proof.mission.memory.lastSyncError}` : ""}`,
    );
  }
  if (!proof.mission.langGraph.connected) {
    throw new Error(
      `LangGraph did not connect${proof.mission.langGraph.lastSyncError ? `: ${proof.mission.langGraph.lastSyncError}` : ""}`,
    );
  }
} finally {
  try {
    composeLogs = sh("docker", ["compose", "-f", composePath, "ps"]);
  } catch {}
  try {
    sh("docker", ["compose", "-f", composePath, "down", "-v", "--remove-orphans"]);
  } catch {}
  if (composeLogs) {
    await writeJson(path.join(outDir, "runtime-stack-ps.json"), { output: composeLogs });
  }
  for (const [key, value] of previousEnv.entries()) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
