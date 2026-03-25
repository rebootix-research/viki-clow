import type {
  AnyAgentTool,
  VikiClowPluginApi,
  VikiClowPluginToolFactory,
} from "vikiclow/plugin-sdk/workflow";
import { createWorkflowTool } from "./src/workflow-tool.js";

export default function register(api: VikiClowPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return [createWorkflowTool(api)] as AnyAgentTool[];
    }) as VikiClowPluginToolFactory,
    { optional: true },
  );
}
