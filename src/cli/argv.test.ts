import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getCommandPositionalsWithRootOptions,
  getCommandPathWithRootOptions,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  isRootHelpInvocation,
  isRootVersionInvocation,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "help flag",
      argv: ["node", "vikiclow", "--help"],
      expected: true,
    },
    {
      name: "version flag",
      argv: ["node", "vikiclow", "-V"],
      expected: true,
    },
    {
      name: "normal command",
      argv: ["node", "vikiclow", "status"],
      expected: false,
    },
    {
      name: "root -v alias",
      argv: ["node", "vikiclow", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "vikiclow", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with log-level",
      argv: ["node", "vikiclow", "--log-level", "debug", "-v"],
      expected: true,
    },
    {
      name: "subcommand -v should not be treated as version",
      argv: ["node", "vikiclow", "acp", "-v"],
      expected: false,
    },
    {
      name: "root -v alias with equals profile",
      argv: ["node", "vikiclow", "--profile=work", "-v"],
      expected: true,
    },
    {
      name: "subcommand path after global root flags should not be treated as version",
      argv: ["node", "vikiclow", "--dev", "skills", "list", "-v"],
      expected: false,
    },
  ])("detects help/version flags: $name", ({ argv, expected }) => {
    expect(hasHelpOrVersion(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --version",
      argv: ["node", "vikiclow", "--version"],
      expected: true,
    },
    {
      name: "root -V",
      argv: ["node", "vikiclow", "-V"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "vikiclow", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "subcommand version flag",
      argv: ["node", "vikiclow", "status", "--version"],
      expected: false,
    },
    {
      name: "unknown root flag with version",
      argv: ["node", "vikiclow", "--unknown", "--version"],
      expected: false,
    },
  ])("detects root-only version invocations: $name", ({ argv, expected }) => {
    expect(isRootVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --help",
      argv: ["node", "vikiclow", "--help"],
      expected: true,
    },
    {
      name: "root -h",
      argv: ["node", "vikiclow", "-h"],
      expected: true,
    },
    {
      name: "root --help with profile",
      argv: ["node", "vikiclow", "--profile", "work", "--help"],
      expected: true,
    },
    {
      name: "subcommand --help",
      argv: ["node", "vikiclow", "status", "--help"],
      expected: false,
    },
    {
      name: "help before subcommand token",
      argv: ["node", "vikiclow", "--help", "status"],
      expected: false,
    },
    {
      name: "help after -- terminator",
      argv: ["node", "vikiclow", "nodes", "run", "--", "git", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag before help",
      argv: ["node", "vikiclow", "--unknown", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag after help",
      argv: ["node", "vikiclow", "--help", "--unknown"],
      expected: false,
    },
  ])("detects root-only help invocations: $name", ({ argv, expected }) => {
    expect(isRootHelpInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "vikiclow", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "vikiclow", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "vikiclow", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPath(argv, 2)).toEqual(expected);
  });

  it("extracts command path while skipping known root option values", () => {
    expect(
      getCommandPathWithRootOptions(
        ["node", "vikiclow", "--profile", "work", "--no-color", "config", "validate"],
        2,
      ),
    ).toEqual(["config", "validate"]);
  });

  it("extracts routed config get positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "vikiclow", "config", "get", "--log-level", "debug", "update.channel", "--json"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("extracts routed config unset positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "vikiclow", "config", "unset", "--profile", "work", "update.channel"],
        {
          commandPath: ["config", "unset"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("returns null when routed command sees unknown options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "vikiclow", "config", "get", "--mystery", "value", "update.channel"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toBeNull();
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "vikiclow", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "vikiclow"],
      expected: null,
    },
    {
      name: "skips known root option values",
      argv: ["node", "vikiclow", "--log-level", "debug", "status"],
      expected: "status",
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "vikiclow", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "vikiclow", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "vikiclow", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "vikiclow", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "vikiclow", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "vikiclow", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "vikiclow", "--", "--timeout=99"],
      expected: undefined,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "vikiclow", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "vikiclow", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "vikiclow", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "vikiclow", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "vikiclow", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "vikiclow", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "vikiclow", "status", "--timeout", "nope"],
      expected: undefined,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("builds parse argv from raw args", () => {
    const cases = [
      {
        rawArgs: ["node", "vikiclow", "status"],
        expected: ["node", "vikiclow", "status"],
      },
      {
        rawArgs: ["node-22", "vikiclow", "status"],
        expected: ["node-22", "vikiclow", "status"],
      },
      {
        rawArgs: ["node-22.2.0.exe", "vikiclow", "status"],
        expected: ["node-22.2.0.exe", "vikiclow", "status"],
      },
      {
        rawArgs: ["node-22.2", "vikiclow", "status"],
        expected: ["node-22.2", "vikiclow", "status"],
      },
      {
        rawArgs: ["node-22.2.exe", "vikiclow", "status"],
        expected: ["node-22.2.exe", "vikiclow", "status"],
      },
      {
        rawArgs: ["/usr/bin/node-22.2.0", "vikiclow", "status"],
        expected: ["/usr/bin/node-22.2.0", "vikiclow", "status"],
      },
      {
        rawArgs: ["node24", "vikiclow", "status"],
        expected: ["node24", "vikiclow", "status"],
      },
      {
        rawArgs: ["/usr/bin/node24", "vikiclow", "status"],
        expected: ["/usr/bin/node24", "vikiclow", "status"],
      },
      {
        rawArgs: ["node24.exe", "vikiclow", "status"],
        expected: ["node24.exe", "vikiclow", "status"],
      },
      {
        rawArgs: ["nodejs", "vikiclow", "status"],
        expected: ["nodejs", "vikiclow", "status"],
      },
      {
        rawArgs: ["node-dev", "vikiclow", "status"],
        expected: ["node", "vikiclow", "node-dev", "vikiclow", "status"],
      },
      {
        rawArgs: ["vikiclow", "status"],
        expected: ["node", "vikiclow", "status"],
      },
      {
        rawArgs: ["bun", "src/entry.ts", "status"],
        expected: ["bun", "src/entry.ts", "status"],
      },
    ] as const;

    for (const testCase of cases) {
      const parsed = buildParseArgv({
        programName: "vikiclow",
        rawArgs: [...testCase.rawArgs],
      });
      expect(parsed).toEqual([...testCase.expected]);
    }
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "vikiclow",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "vikiclow", "status"]);
  });

  it("decides when to migrate state", () => {
    const nonMutatingArgv = [
      ["node", "vikiclow", "status"],
      ["node", "vikiclow", "health"],
      ["node", "vikiclow", "sessions"],
      ["node", "vikiclow", "config", "get", "update"],
      ["node", "vikiclow", "config", "unset", "update"],
      ["node", "vikiclow", "models", "list"],
      ["node", "vikiclow", "models", "status"],
      ["node", "vikiclow", "memory", "status"],
      ["node", "vikiclow", "agent", "--message", "hi"],
    ] as const;
    const mutatingArgv = [
      ["node", "vikiclow", "agents", "list"],
      ["node", "vikiclow", "message", "send"],
    ] as const;

    for (const argv of nonMutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(false);
    }
    for (const argv of mutatingArgv) {
      expect(shouldMigrateState([...argv])).toBe(true);
    }
  });

  it.each([
    { path: ["status"], expected: false },
    { path: ["config", "get"], expected: false },
    { path: ["models", "status"], expected: false },
    { path: ["agents", "list"], expected: true },
  ])("reuses command path for migrate state decisions: $path", ({ path, expected }) => {
    expect(shouldMigrateStateFromPath(path)).toBe(expected);
  });
});
