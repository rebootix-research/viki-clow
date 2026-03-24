// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to symbols used under extensions/diffs.

export type { VikiClowConfig } from "../config/config.js";
export { resolvePreferredVikiClowTmpDir } from "../infra/tmp-vikiclow-dir.js";
export type {
  AnyAgentTool,
  VikiClowPluginApi,
  VikiClowPluginConfigSchema,
  PluginLogger,
} from "../plugins/types.js";
