import type { VikiClowConfig } from "../config/config.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type { ResolvedQmdConfig } from "./backend-config.js";
import { resolveMemoryBackendConfig } from "./backend-config.js";
import { GraphitiBackboneManager } from "./graphiti-backbone.js";
import { recordMemoryPersistenceProof } from "./persistence-proof.js";
import type {
  MemoryEmbeddingProbeResult,
  MemorySearchManager,
  MemorySyncProgressUpdate,
} from "./types.js";

const log = createSubsystemLogger("memory");
const QMD_MANAGER_CACHE = new Map<string, MemorySearchManager>();
const PRIMARY_MANAGER_CACHE = new Map<string, MemorySearchManager>();
const PRIMARY_MANAGER_PENDING = new Map<string, Promise<MemorySearchManagerResult>>();
let managerRuntimePromise: Promise<typeof import("./manager-runtime.js")> | null = null;

function loadManagerRuntime() {
  managerRuntimePromise ??= import("./manager-runtime.js");
  return managerRuntimePromise;
}

export type MemorySearchManagerResult = {
  manager: MemorySearchManager | null;
  error?: string;
};

export async function getMemorySearchManager(params: {
  cfg: VikiClowConfig;
  agentId: string;
  purpose?: "default" | "status";
}): Promise<MemorySearchManagerResult> {
  const resolved = resolveMemoryBackendConfig(params);
  const statusOnly = params.purpose === "status";
  if (resolved.backend === "graphiti" && resolved.graphiti) {
    const cacheKey = statusOnly ? undefined : buildPrimaryCacheKey(params, resolved);
    if (cacheKey) {
      const cached = PRIMARY_MANAGER_CACHE.get(cacheKey);
      if (cached) {
        return { manager: cached };
      }
      const pending = PRIMARY_MANAGER_PENDING.get(cacheKey);
      if (pending) {
        return await pending;
      }
      const createPromise = createPrimaryManager(async () => {
        const { MemoryIndexManager } = await loadManagerRuntime();
        const delegate = await MemoryIndexManager.get(params);
        const manager = new GraphitiBackboneManager({
          agentId: params.agentId,
          config: resolved.graphiti!,
          env: process.env,
          delegate,
        });
        const proofWrapper = new PersistenceProofMemoryManager(
          manager,
          { agentId: params.agentId },
          () => {
            PRIMARY_MANAGER_CACHE.delete(cacheKey);
          },
        );
        await proofWrapper.bootstrap();
        PRIMARY_MANAGER_CACHE.set(cacheKey, proofWrapper);
        return { manager: proofWrapper };
      });
      PRIMARY_MANAGER_PENDING.set(cacheKey, createPromise);
      try {
        return await createPromise;
      } finally {
        if (PRIMARY_MANAGER_PENDING.get(cacheKey) === createPromise) {
          PRIMARY_MANAGER_PENDING.delete(cacheKey);
        }
      }
    }
    try {
      const { MemoryIndexManager } = await loadManagerRuntime();
      const delegate = await MemoryIndexManager.get(params);
      const manager = new GraphitiBackboneManager({
        agentId: params.agentId,
        config: resolved.graphiti,
        env: process.env,
        delegate,
      });
      const proofWrapper = new PersistenceProofMemoryManager(manager, { agentId: params.agentId });
      await proofWrapper.bootstrap();
      return { manager: proofWrapper };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { manager: null, error: message };
    }
  }
  if (resolved.backend === "qmd" && resolved.qmd) {
    let cacheKey: string | undefined;
    if (!statusOnly) {
      cacheKey = buildQmdCacheKey(params.agentId, resolved.qmd);
      const cached = QMD_MANAGER_CACHE.get(cacheKey);
      if (cached) {
        return { manager: cached };
      }
    }
    try {
      const { QmdMemoryManager } = await import("./qmd-manager.js");
      const primary = await QmdMemoryManager.create({
        cfg: params.cfg,
        agentId: params.agentId,
        resolved,
        mode: statusOnly ? "status" : "full",
      });
      if (primary) {
        if (statusOnly) {
          const proofWrapper = new PersistenceProofMemoryManager(primary, {
            agentId: params.agentId,
          });
          await proofWrapper.bootstrap();
          return { manager: proofWrapper };
        }
        const wrapper = new FallbackMemoryManager(
          {
            primary,
            fallbackFactory: async () => {
              const { MemoryIndexManager } = await loadManagerRuntime();
              return await MemoryIndexManager.get(params);
            },
          },
          () => {
            if (cacheKey) {
              QMD_MANAGER_CACHE.delete(cacheKey);
            }
          },
        );
        const proofWrapper = new PersistenceProofMemoryManager(wrapper, {
          agentId: params.agentId,
        });
        await proofWrapper.bootstrap();
        if (cacheKey) {
          QMD_MANAGER_CACHE.set(cacheKey, proofWrapper);
        }
        return { manager: proofWrapper };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn(`qmd memory unavailable; falling back to builtin: ${message}`);
    }
  }

  const cacheKey = statusOnly ? undefined : buildPrimaryCacheKey(params, resolved);
  if (cacheKey) {
    const cached = PRIMARY_MANAGER_CACHE.get(cacheKey);
    if (cached) {
      return { manager: cached };
    }
    const pending = PRIMARY_MANAGER_PENDING.get(cacheKey);
    if (pending) {
      return await pending;
    }
    const createPromise = createPrimaryManager(async () => {
      const { MemoryIndexManager } = await loadManagerRuntime();
      const manager = await MemoryIndexManager.get(params);
      if (!manager) {
        return { manager };
      }
      const proofWrapper = new PersistenceProofMemoryManager(
        manager,
        { agentId: params.agentId },
        () => {
          PRIMARY_MANAGER_CACHE.delete(cacheKey);
        },
      );
      await proofWrapper.bootstrap();
      PRIMARY_MANAGER_CACHE.set(cacheKey, proofWrapper);
      return { manager: proofWrapper };
    });
    PRIMARY_MANAGER_PENDING.set(cacheKey, createPromise);
    try {
      return await createPromise;
    } finally {
      if (PRIMARY_MANAGER_PENDING.get(cacheKey) === createPromise) {
        PRIMARY_MANAGER_PENDING.delete(cacheKey);
      }
    }
  }

  try {
    const { MemoryIndexManager } = await loadManagerRuntime();
    const manager = await MemoryIndexManager.get(params);
    if (!manager) {
      return { manager };
    }
    const proofWrapper = new PersistenceProofMemoryManager(manager, {
      agentId: params.agentId,
    });
    await proofWrapper.bootstrap();
    return { manager: proofWrapper };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { manager: null, error: message };
  }
}

export async function closeAllMemorySearchManagers(): Promise<void> {
  const pendingPrimary = Array.from(PRIMARY_MANAGER_PENDING.values());
  PRIMARY_MANAGER_PENDING.clear();
  if (pendingPrimary.length > 0) {
    await Promise.allSettled(pendingPrimary);
  }
  const managers = [...QMD_MANAGER_CACHE.values(), ...PRIMARY_MANAGER_CACHE.values()];
  QMD_MANAGER_CACHE.clear();
  PRIMARY_MANAGER_CACHE.clear();
  for (const manager of managers) {
    try {
      await manager.close?.();
    } catch (err) {
      log.warn(`failed to close qmd memory manager: ${String(err)}`);
    }
  }
  if (managerRuntimePromise !== null) {
    const { closeAllMemoryIndexManagers } = await loadManagerRuntime();
    await closeAllMemoryIndexManagers();
  }
}

class FallbackMemoryManager implements MemorySearchManager {
  private fallback: MemorySearchManager | null = null;
  private primaryFailed = false;
  private lastError?: string;
  private cacheEvicted = false;

  constructor(
    private readonly deps: {
      primary: MemorySearchManager;
      fallbackFactory: () => Promise<MemorySearchManager | null>;
    },
    private readonly onClose?: () => void,
  ) {}

  async search(
    query: string,
    opts?: { maxResults?: number; minScore?: number; sessionKey?: string },
  ) {
    if (!this.primaryFailed) {
      try {
        return await this.deps.primary.search(query, opts);
      } catch (err) {
        this.primaryFailed = true;
        this.lastError = err instanceof Error ? err.message : String(err);
        log.warn(`qmd memory failed; switching to builtin index: ${this.lastError}`);
        await this.deps.primary.close?.().catch(() => {});
        // Evict the failed wrapper so the next request can retry QMD with a fresh manager.
        this.evictCacheEntry();
      }
    }
    const fallback = await this.ensureFallback();
    if (fallback) {
      return await fallback.search(query, opts);
    }
    throw new Error(this.lastError ?? "memory search unavailable");
  }

  async readFile(params: { relPath: string; from?: number; lines?: number }) {
    if (!this.primaryFailed) {
      return await this.deps.primary.readFile(params);
    }
    const fallback = await this.ensureFallback();
    if (fallback) {
      return await fallback.readFile(params);
    }
    throw new Error(this.lastError ?? "memory read unavailable");
  }

  status() {
    if (!this.primaryFailed) {
      return this.deps.primary.status();
    }
    const fallbackStatus = this.fallback?.status();
    const fallbackInfo = { from: "qmd", reason: this.lastError ?? "unknown" };
    if (fallbackStatus) {
      const custom = fallbackStatus.custom ?? {};
      return {
        ...fallbackStatus,
        fallback: fallbackInfo,
        custom: {
          ...custom,
          fallback: { disabled: true, reason: this.lastError ?? "unknown" },
        },
      };
    }
    const primaryStatus = this.deps.primary.status();
    const custom = primaryStatus.custom ?? {};
    return {
      ...primaryStatus,
      fallback: fallbackInfo,
      custom: {
        ...custom,
        fallback: { disabled: true, reason: this.lastError ?? "unknown" },
      },
    };
  }

  async sync(params?: {
    reason?: string;
    force?: boolean;
    progress?: (update: MemorySyncProgressUpdate) => void;
  }) {
    if (!this.primaryFailed) {
      await this.deps.primary.sync?.(params);
      return;
    }
    const fallback = await this.ensureFallback();
    await fallback?.sync?.(params);
  }

  async probeEmbeddingAvailability(): Promise<MemoryEmbeddingProbeResult> {
    if (!this.primaryFailed) {
      return await this.deps.primary.probeEmbeddingAvailability();
    }
    const fallback = await this.ensureFallback();
    if (fallback) {
      return await fallback.probeEmbeddingAvailability();
    }
    return { ok: false, error: this.lastError ?? "memory embeddings unavailable" };
  }

  async probeVectorAvailability() {
    if (!this.primaryFailed) {
      return await this.deps.primary.probeVectorAvailability();
    }
    const fallback = await this.ensureFallback();
    return (await fallback?.probeVectorAvailability()) ?? false;
  }

  async close() {
    await this.deps.primary.close?.();
    await this.fallback?.close?.();
    this.evictCacheEntry();
  }

  private async ensureFallback(): Promise<MemorySearchManager | null> {
    if (this.fallback) {
      return this.fallback;
    }
    let fallback: MemorySearchManager | null;
    try {
      fallback = await this.deps.fallbackFactory();
      if (!fallback) {
        log.warn("memory fallback requested but builtin index is unavailable");
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn(`memory fallback unavailable: ${message}`);
      return null;
    }
    this.fallback = fallback;
    return this.fallback;
  }

  private evictCacheEntry(): void {
    if (this.cacheEvicted) {
      return;
    }
    this.cacheEvicted = true;
    this.onClose?.();
  }
}

class PersistenceProofMemoryManager implements MemorySearchManager {
  private bootstrapPromise: Promise<void> | null = null;
  private cacheEvicted = false;

  constructor(
    private readonly delegate: MemorySearchManager,
    private readonly params: { agentId: string },
    private readonly onClose?: () => void,
  ) {}

  get openAi() {
    return (this.delegate as { openAi?: unknown }).openAi;
  }

  get gemini() {
    return (this.delegate as { gemini?: unknown }).gemini;
  }

  get voyage() {
    return (this.delegate as { voyage?: unknown }).voyage;
  }

  get mistral() {
    return (this.delegate as { mistral?: unknown }).mistral;
  }

  get ollama() {
    return (this.delegate as { ollama?: unknown }).ollama;
  }

  async bootstrap(): Promise<void> {
    if (this.bootstrapPromise) {
      await this.bootstrapPromise;
      return;
    }
    this.bootstrapPromise = (async () => {
      try {
        const status = this.delegate.status();
        await recordMemoryPersistenceProof({
          agentId: this.params.agentId,
          status,
          result: "ready",
        });
      } catch (err) {
        log.warn(`memory persistence proof bootstrap failed: ${String(err)}`);
      }
    })();
    await this.bootstrapPromise;
  }

  async search(
    query: string,
    opts?: { maxResults?: number; minScore?: number; sessionKey?: string },
  ) {
    return await this.delegate.search(query, opts);
  }

  async readFile(params: { relPath: string; from?: number; lines?: number }) {
    return await this.delegate.readFile(params);
  }

  status() {
    return this.delegate.status();
  }

  async sync(params?: {
    reason?: string;
    force?: boolean;
    progress?: (update: MemorySyncProgressUpdate) => void;
  }) {
    try {
      await this.delegate.sync?.(params);
      const status = this.delegate.status();
      await recordMemoryPersistenceProof({
        agentId: this.params.agentId,
        status,
        result: "completed",
        syncReason: params?.reason,
      });
    } catch (err) {
      try {
        const status = this.delegate.status();
        await recordMemoryPersistenceProof({
          agentId: this.params.agentId,
          status,
          result: "failed",
          syncReason: params?.reason,
          reason: err instanceof Error ? err.message : String(err),
        });
      } catch (proofErr) {
        log.warn(`memory persistence proof write failed: ${String(proofErr)}`);
      }
      throw err;
    }
  }

  async probeEmbeddingAvailability(): Promise<MemoryEmbeddingProbeResult> {
    return await this.delegate.probeEmbeddingAvailability();
  }

  async probeVectorAvailability() {
    return await this.delegate.probeVectorAvailability();
  }

  async activateFallbackProvider(reason: string): Promise<boolean> {
    const candidate = this.delegate as {
      activateFallbackProvider?: (reason: string) => Promise<boolean>;
    };
    if (typeof candidate.activateFallbackProvider !== "function") {
      return false;
    }
    return await candidate.activateFallbackProvider(reason);
  }

  async close() {
    await this.delegate.close?.();
    if (!this.cacheEvicted) {
      this.cacheEvicted = true;
      this.onClose?.();
    }
  }
}

function buildPrimaryCacheKey(
  params: { cfg: VikiClowConfig; agentId: string; purpose?: "default" | "status" },
  resolved: ReturnType<typeof resolveMemoryBackendConfig>,
): string {
  return JSON.stringify({
    agentId: params.agentId,
    purpose: params.purpose ?? "default",
    memory: params.cfg.memory ?? null,
    agents: params.cfg.agents ?? null,
    backend: resolved.backend,
    citations: resolved.citations,
    qmd: resolved.qmd ?? null,
    graphiti: resolved.graphiti ?? null,
  });
}

async function createPrimaryManager(
  factory: () => Promise<MemorySearchManagerResult>,
): Promise<MemorySearchManagerResult> {
  return await factory();
}

function buildQmdCacheKey(agentId: string, config: ResolvedQmdConfig): string {
  // ResolvedQmdConfig is assembled in a stable field order in resolveMemoryBackendConfig.
  // Fast stringify avoids deep key-sorting overhead on this hot path.
  return `${agentId}:${JSON.stringify(config)}`;
}
