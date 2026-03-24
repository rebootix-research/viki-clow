import type { VikiClowPluginApi } from "vikiclow/plugin-sdk/synology-chat";
import { emptyPluginConfigSchema } from "vikiclow/plugin-sdk/synology-chat";
import { createSynologyChatPlugin } from "./src/channel.js";
import { setSynologyRuntime } from "./src/runtime.js";

const plugin = {
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for VikiClow",
  configSchema: emptyPluginConfigSchema(),
  register(api: VikiClowPluginApi) {
    setSynologyRuntime(api.runtime);
    api.registerChannel({ plugin: createSynologyChatPlugin() });
  },
};

export default plugin;
