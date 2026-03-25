import type { VikiClowConfig } from "../config/config.js";
import { getMemorySearchManager, type MemoryIndexManager } from "./index.js";
import { unwrapMemoryIndexManagerForTests } from "./test-manager-helpers.js";

export async function createMemoryManagerOrThrow(
  cfg: VikiClowConfig,
  agentId = "main",
): Promise<MemoryIndexManager> {
  const result = await getMemorySearchManager({ cfg, agentId });
  if (!result.manager) {
    throw new Error("manager missing");
  }
  return unwrapMemoryIndexManagerForTests(result.manager);
}
