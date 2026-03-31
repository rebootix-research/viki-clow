import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { runExec } = vi.hoisted(() => ({
  runExec: vi.fn(),
}));

const runtime = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
};

vi.mock("../process/exec.js", () => ({
  runExec,
}));

vi.mock("../runtime.js", () => ({
  defaultRuntime: runtime,
}));

let registerCapabilitiesCli: typeof import("./capabilities-cli.js").registerCapabilitiesCli;
const tempDirs: string[] = [];

async function withTempDirs<T>(
  run: (params: { stateDir: string; workspaceDir: string }) => Promise<T>,
) {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-cli-cap-state-"));
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-cli-cap-workspace-"));
  tempDirs.push(stateDir, workspaceDir);
  const previousStateDir = process.env.VIKICLOW_STATE_DIR;
  const previousManifestCache = process.env.VIKICLOW_DISABLE_PLUGIN_MANIFEST_CACHE;
  process.env.VIKICLOW_STATE_DIR = stateDir;
  process.env.VIKICLOW_DISABLE_PLUGIN_MANIFEST_CACHE = "1";
  try {
    return await run({ stateDir, workspaceDir });
  } finally {
    if (previousStateDir === undefined) {
      delete process.env.VIKICLOW_STATE_DIR;
    } else {
      process.env.VIKICLOW_STATE_DIR = previousStateDir;
    }
    if (previousManifestCache === undefined) {
      delete process.env.VIKICLOW_DISABLE_PLUGIN_MANIFEST_CACHE;
    } else {
      process.env.VIKICLOW_DISABLE_PLUGIN_MANIFEST_CACHE = previousManifestCache;
    }
  }
}

beforeAll(async () => {
  ({ registerCapabilitiesCli } = await import("./capabilities-cli.js"));
});

describe("registerCapabilitiesCli", () => {
  async function runCli(args: string[]) {
    const program = new Command();
    registerCapabilitiesCli(program);
    await program.parseAsync(args, { from: "user" });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs
        .splice(0, tempDirs.length)
        .map((dir) => fs.rm(dir, { recursive: true, force: true })),
    );
  });

  it("discovers the curated capability catalog", async () => {
    await runCli([
      "capabilities",
      "discover",
      "Use Playwright to publish the workflow and create a reusable automation skill",
    ]);

    const output = runtime.log.mock.calls.flat().join("\n");
    expect(output).toContain("Catalog revision:");
    expect(output).toContain("Direct:");
    expect(output).toContain("playwright");
  });

  it("inspects an empty registry without failing", async () => {
    await withTempDirs(async () => {
      await runCli(["capabilities", "inspect"]);
    });

    expect(runtime.log.mock.calls.flat().join("\n")).toContain(
      "No capability records recorded yet.",
    );
  });

  it("fetches capabilities through the CLI and persists the registry", async () => {
    let playwrightVersionChecks = 0;
    runExec.mockImplementation(async (command: string, args: string[]) => {
      if (command === "corepack" && args.join(" ") === "pnpm exec playwright --version") {
        playwrightVersionChecks += 1;
        if (playwrightVersionChecks === 1) {
          throw new Error("playwright missing");
        }
        return { stdout: "Version 1.55.0", stderr: "" };
      }
      if (command === "corepack" && args.join(" ") === "pnpm exec playwright install chromium") {
        return { stdout: "installed", stderr: "" };
      }
      throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
    });

    await withTempDirs(async ({ workspaceDir }) => {
      const objective =
        "Use Playwright to publish the workflow and create a reusable automation skill";
      await runCli([
        "capabilities",
        "fetch",
        "playwright",
        "browser_profiles",
        "generated_skill",
        "--workspace",
        workspaceDir,
        "--objective",
        objective,
      ]);

      const output = runtime.log.mock.calls.flat().join("\n");
      expect(output).toContain("Registry:");
      expect(output).toContain("playwright");
    });
  });

  it("discovers Capability Foundry candidates through the CLI", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      await runCli(["capabilities", "foundry", "discover", "--workspace", workspaceDir]);
    });

    const output = runtime.log.mock.calls.flat().join("\n");
    expect(output).toContain("Registry:");
    expect(output).toContain("plugin:workflow");
    expect(output).toContain("mcp:filesystem");
  });

  it("promotes a local Foundry candidate and exposes it through routes", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      await runCli([
        "capabilities",
        "foundry",
        "promote",
        "skill:viki-skill-factory",
        "--bundle",
        "--workspace",
        workspaceDir,
      ]);
      await runCli([
        "capabilities",
        "foundry",
        "routes",
        "Use the viki skill factory to build a reusable browser automation workflow",
        "--workspace",
        workspaceDir,
      ]);
    });

    const output = runtime.log.mock.calls.flat().join("\n");
    expect(output).toContain("skill:viki-skill-factory");
    expect(output).toContain("score=");
  });

  it("rejects Foundry candidates with a recorded reason through the CLI", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      await runCli([
        "capabilities",
        "foundry",
        "reject",
        "repo:langgraph",
        "--reason",
        "manual review",
        "--workspace",
        workspaceDir,
      ]);
    });

    const output = runtime.log.mock.calls.flat().join("\n");
    expect(output).toContain("repo:langgraph");
    expect(output).toContain("manual review");
  });
});
