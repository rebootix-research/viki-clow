import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as compatSdk from "vikiclow/plugin-sdk/compat";
import * as discordSdk from "vikiclow/plugin-sdk/discord";
import * as imessageSdk from "vikiclow/plugin-sdk/imessage";
import * as lineSdk from "vikiclow/plugin-sdk/line";
import * as msteamsSdk from "vikiclow/plugin-sdk/msteams";
import * as signalSdk from "vikiclow/plugin-sdk/signal";
import * as slackSdk from "vikiclow/plugin-sdk/slack";
import * as telegramSdk from "vikiclow/plugin-sdk/telegram";
import * as whatsappSdk from "vikiclow/plugin-sdk/whatsapp";
import { describe, expect, it } from "vitest";

const bundledExtensionSubpathLoaders = [
  { id: "acpx", load: () => import("vikiclow/plugin-sdk/acpx") },
  { id: "bluebubbles", load: () => import("vikiclow/plugin-sdk/bluebubbles") },
  { id: "copilot-proxy", load: () => import("vikiclow/plugin-sdk/copilot-proxy") },
  { id: "device-pair", load: () => import("vikiclow/plugin-sdk/device-pair") },
  { id: "diagnostics-otel", load: () => import("vikiclow/plugin-sdk/diagnostics-otel") },
  { id: "diffs", load: () => import("vikiclow/plugin-sdk/diffs") },
  { id: "feishu", load: () => import("vikiclow/plugin-sdk/feishu") },
  {
    id: "google-gemini-cli-auth",
    load: () => import("vikiclow/plugin-sdk/google-gemini-cli-auth"),
  },
  { id: "googlechat", load: () => import("vikiclow/plugin-sdk/googlechat") },
  { id: "irc", load: () => import("vikiclow/plugin-sdk/irc") },
  { id: "llm-task", load: () => import("vikiclow/plugin-sdk/llm-task") },
  { id: "matrix", load: () => import("vikiclow/plugin-sdk/matrix") },
  { id: "mattermost", load: () => import("vikiclow/plugin-sdk/mattermost") },
  { id: "memory-core", load: () => import("vikiclow/plugin-sdk/memory-core") },
  { id: "memory-lancedb", load: () => import("vikiclow/plugin-sdk/memory-lancedb") },
  {
    id: "minimax-portal-auth",
    load: () => import("vikiclow/plugin-sdk/minimax-portal-auth"),
  },
  { id: "nextcloud-talk", load: () => import("vikiclow/plugin-sdk/nextcloud-talk") },
  { id: "nostr", load: () => import("vikiclow/plugin-sdk/nostr") },
  { id: "phone-control", load: () => import("vikiclow/plugin-sdk/phone-control") },
  { id: "qwen-portal-auth", load: () => import("vikiclow/plugin-sdk/qwen-portal-auth") },
  { id: "synology-chat", load: () => import("vikiclow/plugin-sdk/synology-chat") },
  { id: "talk-voice", load: () => import("vikiclow/plugin-sdk/talk-voice") },
  { id: "test-utils", load: () => import("vikiclow/plugin-sdk/test-utils") },
  { id: "thread-ownership", load: () => import("vikiclow/plugin-sdk/thread-ownership") },
  { id: "tlon", load: () => import("vikiclow/plugin-sdk/tlon") },
  { id: "twitch", load: () => import("vikiclow/plugin-sdk/twitch") },
  { id: "voice-call", load: () => import("vikiclow/plugin-sdk/voice-call") },
  { id: "zalo", load: () => import("vikiclow/plugin-sdk/zalo") },
  { id: "zalouser", load: () => import("vikiclow/plugin-sdk/zalouser") },
] as const;

function hasBuiltPluginSdkSubpath(entry: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), "dist", "plugin-sdk", `${entry}.js`));
}

describe("plugin-sdk subpath exports", () => {
  it("exports compat helpers", () => {
    expect(typeof compatSdk.emptyPluginConfigSchema).toBe("function");
    expect(typeof compatSdk.resolveControlCommandGate).toBe("function");
  });

  it("exports Discord helpers", () => {
    expect(typeof discordSdk.resolveDiscordAccount).toBe("function");
    expect(typeof discordSdk.inspectDiscordAccount).toBe("function");
    expect(typeof discordSdk.discordOnboardingAdapter).toBe("object");
  });

  it("exports Slack helpers", () => {
    expect(typeof slackSdk.resolveSlackAccount).toBe("function");
    expect(typeof slackSdk.inspectSlackAccount).toBe("function");
    expect(typeof slackSdk.handleSlackMessageAction).toBe("function");
  });

  it("exports Telegram helpers", () => {
    expect(typeof telegramSdk.resolveTelegramAccount).toBe("function");
    expect(typeof telegramSdk.inspectTelegramAccount).toBe("function");
    expect(typeof telegramSdk.telegramOnboardingAdapter).toBe("object");
  });

  it("exports Signal helpers", () => {
    expect(typeof signalSdk.resolveSignalAccount).toBe("function");
    expect(typeof signalSdk.signalOnboardingAdapter).toBe("object");
  });

  it("exports iMessage helpers", () => {
    expect(typeof imessageSdk.resolveIMessageAccount).toBe("function");
    expect(typeof imessageSdk.imessageOnboardingAdapter).toBe("object");
  });

  it("exports WhatsApp helpers", () => {
    expect(typeof whatsappSdk.resolveWhatsAppAccount).toBe("function");
    expect(typeof whatsappSdk.whatsappOnboardingAdapter).toBe("object");
  });

  it("exports LINE helpers", () => {
    expect(typeof lineSdk.processLineMessage).toBe("function");
    expect(typeof lineSdk.createInfoCard).toBe("function");
  });

  it("exports Microsoft Teams helpers", () => {
    expect(typeof msteamsSdk.resolveControlCommandGate).toBe("function");
    expect(typeof msteamsSdk.loadOutboundMediaFromUrl).toBe("function");
  });

  it("exports acpx helpers", async () => {
    const acpxSdk = await import("vikiclow/plugin-sdk/acpx");
    expect(typeof acpxSdk.listKnownProviderAuthEnvVarNames).toBe("function");
    expect(typeof acpxSdk.omitEnvKeysCaseInsensitive).toBe("function");
  });

  it("resolves bundled extension subpaths", async () => {
    for (const { id, load } of bundledExtensionSubpathLoaders) {
      const mod = await load();
      expect(typeof mod).toBe("object");
      expect(mod, `subpath ${id} should resolve`).toBeTruthy();
    }
  });

  it.skipIf(!hasBuiltPluginSdkSubpath("workflow"))(
    "publishes the workflow alias subpath for Node consumers",
    () => {
      const result = spawnSync(
        process.execPath,
        [
        "-e",
        "import('vikiclow/plugin-sdk/workflow').then(()=>process.exit(0)).catch((err)=>{console.error(err);process.exit(1);})",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    expect(result.status, result.stderr || result.stdout).toBe(0);
    },
  );

  it.skipIf(!hasBuiltPluginSdkSubpath("prose"))(
    "publishes the prose alias subpath for Node consumers",
    () => {
      const result = spawnSync(
        process.execPath,
        [
        "-e",
        "import('vikiclow/plugin-sdk/prose').then(()=>process.exit(0)).catch((err)=>{console.error(err);process.exit(1);})",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    expect(result.status, result.stderr || result.stdout).toBe(0);
    },
  );

  it("keeps the newly added bundled plugin-sdk contracts available", async () => {
    const bluebubbles = await import("vikiclow/plugin-sdk/bluebubbles");
    expect(typeof bluebubbles.parseFiniteNumber).toBe("function");

    const mattermost = await import("vikiclow/plugin-sdk/mattermost");
    expect(typeof mattermost.parseStrictPositiveInteger).toBe("function");

    const nextcloudTalk = await import("vikiclow/plugin-sdk/nextcloud-talk");
    expect(typeof nextcloudTalk.waitForAbortSignal).toBe("function");

    const twitch = await import("vikiclow/plugin-sdk/twitch");
    expect(typeof twitch.DEFAULT_ACCOUNT_ID).toBe("string");
    expect(typeof twitch.normalizeAccountId).toBe("function");
  });
});
