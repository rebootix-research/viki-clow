import { createPluginRuntimeStore } from "vikiclow/plugin-sdk/compat";
import type { PluginRuntime } from "vikiclow/plugin-sdk/googlechat";

const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Google Chat runtime not initialized");
export { getGoogleChatRuntime, setGoogleChatRuntime };
