import type { VikiClowConfig } from "../config/config.js";
import { loadVikiClowPlugins } from "../plugins/loader.js";
import { resolveUserPath } from "../utils.js";

export function ensureRuntimePluginsLoaded(params: {
  config?: VikiClowConfig;
  workspaceDir?: string | null;
}): void {
  const workspaceDir =
    typeof params.workspaceDir === "string" && params.workspaceDir.trim()
      ? resolveUserPath(params.workspaceDir)
      : undefined;

  loadVikiClowPlugins({
    config: params.config,
    workspaceDir,
  });
}
