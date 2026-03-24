import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          VIKICLOW_STATE_DIR: "/tmp/vikiclow-state",
          VIKICLOW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "vikiclow-gateway",
        windowsTaskName: "VikiClow Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/vikiclow-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/vikiclow-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "vikiclow-gateway",
        windowsTaskName: "VikiClow Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u vikiclow-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "vikiclow-gateway",
        windowsTaskName: "VikiClow Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "VikiClow Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "vikiclow gateway install",
        startCommand: "vikiclow gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.vikiclow.gateway.plist",
        systemdServiceName: "vikiclow-gateway",
        windowsTaskName: "VikiClow Gateway",
      }),
    ).toEqual([
      "vikiclow gateway install",
      "vikiclow gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.vikiclow.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "vikiclow gateway install",
        startCommand: "vikiclow gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.vikiclow.gateway.plist",
        systemdServiceName: "vikiclow-gateway",
        windowsTaskName: "VikiClow Gateway",
      }),
    ).toEqual([
      "vikiclow gateway install",
      "vikiclow gateway",
      "systemctl --user start vikiclow-gateway.service",
    ]);
  });
});
