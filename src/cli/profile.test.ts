import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "vikiclow",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "vikiclow", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "vikiclow", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "vikiclow", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "vikiclow", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "vikiclow", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "vikiclow", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "vikiclow", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "vikiclow", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".vikiclow-dev");
    expect(env.VIKICLOW_PROFILE).toBe("dev");
    expect(env.VIKICLOW_STATE_DIR).toBe(expectedStateDir);
    expect(env.VIKICLOW_CONFIG_PATH).toBe(path.join(expectedStateDir, "vikiclow.json"));
    expect(env.VIKICLOW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      VIKICLOW_STATE_DIR: "/custom",
      VIKICLOW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.VIKICLOW_STATE_DIR).toBe("/custom");
    expect(env.VIKICLOW_GATEWAY_PORT).toBe("19099");
    expect(env.VIKICLOW_CONFIG_PATH).toBe(path.join("/custom", "vikiclow.json"));
  });

  it("uses VIKICLOW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      VIKICLOW_HOME: "/srv/vikiclow-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/vikiclow-home");
    expect(env.VIKICLOW_STATE_DIR).toBe(path.join(resolvedHome, ".vikiclow-work"));
    expect(env.VIKICLOW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".vikiclow-work", "vikiclow.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "vikiclow doctor --fix",
      env: {},
      expected: "vikiclow doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "vikiclow doctor --fix",
      env: { VIKICLOW_PROFILE: "default" },
      expected: "vikiclow doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "vikiclow doctor --fix",
      env: { VIKICLOW_PROFILE: "Default" },
      expected: "vikiclow doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "vikiclow doctor --fix",
      env: { VIKICLOW_PROFILE: "bad profile" },
      expected: "vikiclow doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "vikiclow --profile work doctor --fix",
      env: { VIKICLOW_PROFILE: "work" },
      expected: "vikiclow --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "vikiclow --dev doctor",
      env: { VIKICLOW_PROFILE: "dev" },
      expected: "vikiclow --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("vikiclow doctor --fix", { VIKICLOW_PROFILE: "work" })).toBe(
      "vikiclow --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("vikiclow doctor --fix", { VIKICLOW_PROFILE: "  jbvikiclow  " })).toBe(
      "vikiclow --profile jbvikiclow doctor --fix",
    );
  });

  it("handles command with no args after vikiclow", () => {
    expect(formatCliCommand("vikiclow", { VIKICLOW_PROFILE: "test" })).toBe(
      "vikiclow --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm vikiclow doctor", { VIKICLOW_PROFILE: "work" })).toBe(
      "pnpm vikiclow --profile work doctor",
    );
  });
});
