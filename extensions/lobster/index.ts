import type {
  AnyAgentTool,
  VikiClowPluginApi,
  VikiClowPluginToolFactory,
} from "vikiclow/plugin-sdk/lobster";
import { createLobsterTool, createWorkflowTool } from "./src/lobster-tool.js";

export default function register(api: VikiClowPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return [createWorkflowTool(api), createLobsterTool(api)] as AnyAgentTool[];
    }) as VikiClowPluginToolFactory,
    { optional: true },
  );
}
