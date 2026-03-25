import type { VikiClowConfig } from "../config/config.js";
import { getMemorySearchManager, type MemoryIndexManager } from "./index.js";
import type { MemorySearchManager } from "./types.js";

export function unwrapMemoryIndexManagerForTests(
  manager: MemorySearchManager | null,
): MemoryIndexManager {
  let current = manager as Record<string, unknown> | null;
  const seen = new Set<Record<string, unknown>>();
  while (current && !seen.has(current)) {
    seen.add(current);
    if (
      "sync" in current &&
      typeof current.sync === "function" &&
      ("db" in current ||
        "resetIndex" in current ||
        "runSync" in current ||
        "openDatabase" in current ||
        "scheduleWatchSync" in current)
    ) {
      return current as unknown as MemoryIndexManager;
    }
    const delegate = current.delegate;
    if (delegate && typeof delegate === "object") {
      current = delegate as Record<string, unknown>;
      continue;
    }
    const primary = (current.deps as { primary?: unknown } | undefined)?.primary;
    if (primary && typeof primary === "object") {
      current = primary as Record<string, unknown>;
      continue;
    }
    break;
  }
  if (!manager) {
    throw new Error("manager missing");
  }
  return manager as unknown as MemoryIndexManager;
}

export async function getRequiredMemoryIndexManager(params: {
  cfg: VikiClowConfig;
  agentId?: string;
}): Promise<MemoryIndexManager> {
  const result = await getMemorySearchManager({
    cfg: params.cfg,
    agentId: params.agentId ?? "main",
  });
  if (!result.manager) {
    throw new Error("manager missing");
  }
  const manager = unwrapMemoryIndexManagerForTests(result.manager);
  if (!("sync" in manager) || typeof manager.sync !== "function") {
    throw new Error("manager does not support sync");
  }
  return manager;
}
