// Narrow plugin-sdk surface for the bundled workflow runtime plugin.
// Keep this list additive and scoped to symbols used under the workflow runtime extension.

export {
  applyWindowsSpawnProgramPolicy,
  materializeWindowsSpawnProgram,
  resolveWindowsSpawnProgramCandidate,
} from "./windows-spawn.js";
export type {
  AnyAgentTool,
  VikiClowPluginApi,
  VikiClowPluginToolContext,
  VikiClowPluginToolFactory,
} from "../plugins/types.js";
