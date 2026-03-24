import { createPluginRuntimeStore } from "vikiclow/plugin-sdk/compat";
import type { PluginRuntime } from "vikiclow/plugin-sdk/discord";

const { setRuntime: setDiscordRuntime, getRuntime: getDiscordRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Discord runtime not initialized");
export { getDiscordRuntime, setDiscordRuntime };
