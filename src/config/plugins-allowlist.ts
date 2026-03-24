import type { VikiClowConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: VikiClowConfig, pluginId: string): VikiClowConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}
