import { createPluginRuntimeStore } from "vikiclow/plugin-sdk/compat";
import type { PluginRuntime } from "vikiclow/plugin-sdk/nostr";

const { setRuntime: setNostrRuntime, getRuntime: getNostrRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Nostr runtime not initialized");
export { getNostrRuntime, setNostrRuntime };
