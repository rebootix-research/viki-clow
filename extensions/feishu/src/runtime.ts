import { createPluginRuntimeStore } from "vikiclow/plugin-sdk/compat";
import type { PluginRuntime } from "vikiclow/plugin-sdk/feishu";

const { setRuntime: setFeishuRuntime, getRuntime: getFeishuRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Feishu runtime not initialized");
export { getFeishuRuntime, setFeishuRuntime };
