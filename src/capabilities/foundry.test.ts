import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runExec } = vi.hoisted(() => ({
  runExec: vi.fn(),
}));

vi.mock("../process/exec.js", () => ({
  runExec,
}));

let discoverCapabilitySources: typeof import("./foundry.js").discoverCapabilitySources;
let discoverCapabilityFoundry: typeof import("./foundry.js").discoverCapabilityFoundry;
let ingestCapabilityFoundryCandidates: typeof import("./foundry.js").ingestCapabilityFoundryCandidates;
let fetchCapabilityRecords: typeof import("./foundry.js").fetchCapabilityRecords;
let inspectCapabilityFoundryRegistry: typeof import("./foundry.js").inspectCapabilityFoundryRegistry;
let inspectCapabilityRegistry: typeof import("./foundry.js").inspectCapabilityRegistry;
let sandboxTestCapabilityFoundryCandidates: typeof import("./foundry.js").sandboxTestCapabilityFoundryCandidates;
let promoteCapabilityFoundryCandidates: typeof import("./foundry.js").promoteCapabilityFoundryCandidates;
let buildCapabilityFoundryRoutes: typeof import("./foundry.js").buildCapabilityFoundryRoutes;
let recordCapabilityFoundryRouteUsage: typeof import("./foundry.js").recordCapabilityFoundryRouteUsage;
let refreshCapabilityFoundry: typeof import("./foundry.js").refreshCapabilityFoundry;
let loadCapabilityRegistry: typeof import("./store.js").loadCapabilityRegistry;
let loadCapabilityFoundryRegistry: typeof import("./store.js").loadCapabilityFoundryRegistry;

const tempDirs: string[] = [];

async function withTempDirs<T>(
  run: (params: { stateDir: string; workspaceDir: string }) => Promise<T>,
) {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-state-"));
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-workspace-"));
  tempDirs.push(stateDir, workspaceDir);
  const previous = process.env.VIKICLOW_STATE_DIR;
  process.env.VIKICLOW_STATE_DIR = stateDir;
  try {
    return await run({ stateDir, workspaceDir });
  } finally {
    if (previous === undefined) {
      delete process.env.VIKICLOW_STATE_DIR;
    } else {
      process.env.VIKICLOW_STATE_DIR = previous;
    }
  }
}

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

beforeEach(async () => {
  vi.resetModules();
  ({ discoverCapabilitySources, fetchCapabilityRecords, inspectCapabilityRegistry } = await import(
    "./foundry.js"
  ));
  ({
    discoverCapabilityFoundry,
    ingestCapabilityFoundryCandidates,
    inspectCapabilityFoundryRegistry,
    sandboxTestCapabilityFoundryCandidates,
    promoteCapabilityFoundryCandidates,
    buildCapabilityFoundryRoutes,
    recordCapabilityFoundryRouteUsage,
    refreshCapabilityFoundry,
  } = await import("./foundry.js"));
  ({ loadCapabilityRegistry } = await import("./store.js"));
  ({ loadCapabilityFoundryRegistry } = await import("./store.js"));
});

describe("capability foundry", () => {
  it("classifies the curated catalog for an objective", () => {
    const discovery = discoverCapabilitySources({
      objective: "Use Playwright to publish the workflow and create a reusable automation skill",
    });

    expect(discovery.inferred).toEqual(
      expect.arrayContaining(["playwright", "generated_skill"]),
    );
    expect(discovery.direct.some((record) => record.id === "playwright")).toBe(true);
    expect(discovery.direct.some((record) => record.id === "browser_profiles")).toBe(true);
  });

  it("fetches selected capability sources and persists the registry", async () => {
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
      const objective = "Use Playwright to publish the workflow and create a reusable automation skill";
      const fetched = await fetchCapabilityRecords({
        ids: ["playwright", "browser_profiles", "generated_skill"],
        objective,
        workspaceDir,
        autoInstall: true,
      });

      expect(fetched.records.some((record) => record.id === "playwright")).toBe(true);
      expect(fetched.records.some((record) => record.id === "browser_profiles")).toBe(true);
      expect(fetched.records.some((record) => record.id === "generated_skill")).toBe(true);

      const registry = await loadCapabilityRegistry();
      expect(registry.catalogRevision).toBeTruthy();
      expect(registry.objective).toBe(objective);
      expect(registry.records.some((record) => record.id === "browser_profiles")).toBe(true);
      expect(
        await fs
          .readFile(path.join(workspaceDir, ".vikiclow", "browser", "README.txt"), "utf8")
          .then((contents) => contents.includes("Viki Browser mission profiles")),
      ).toBe(true);

      const inspection = await inspectCapabilityRegistry({ ids: ["generated_skill"] });
      expect(inspection.records[0]?.spec.id).toBe("generated_skill");
    });
  });

  it("discovers curated Foundry sources across skills, plugins, MCP servers, repos, and assets", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const { registry, registryPath } = await discoverCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });

      const registryStat = await fs.stat(registryPath);
      expect(registryStat.isFile()).toBe(true);
      expect(registry.supportedSources).toEqual(
        expect.arrayContaining(["repo-skills", "repo-plugins", "npm-mcp", "github-repo"]),
      );
      expect(registry.candidates.some((candidate) => candidate.type === "skill")).toBe(true);
      expect(registry.candidates.some((candidate) => candidate.type === "plugin")).toBe(true);
      expect(registry.candidates.some((candidate) => candidate.type === "mcp_server")).toBe(true);
      expect(registry.candidates.some((candidate) => candidate.type === "repo_integration")).toBe(true);
      expect(registry.candidates.some((candidate) => candidate.type === "asset_dependency")).toBe(true);
      expect(registry.candidates.every((candidate) => candidate.state === "discovered")).toBe(true);
    });
  });

  it("ingests fetched Foundry candidates and persists provenance", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const discovered = await discoverCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      const localSkill = discovered.registry.candidates.find(
        (candidate) => candidate.type === "skill" && candidate.source.kind === "local_repo",
      );
      const localPlugin = discovered.registry.candidates.find(
        (candidate) => candidate.type === "plugin" && candidate.source.kind === "local_repo",
      );
      const npmCandidate = discovered.registry.candidates.find(
        (candidate) => candidate.source.kind === "npm_registry",
      );
      const githubCandidate = discovered.registry.candidates.find(
        (candidate) => candidate.source.kind === "github_repo",
      );
      const assetCandidate = discovered.registry.candidates.find(
        (candidate) => candidate.type === "asset_dependency",
      );

      expect(localSkill).toBeTruthy();
      expect(localPlugin).toBeTruthy();
      expect(npmCandidate).toBeTruthy();
      expect(githubCandidate).toBeTruthy();
      expect(assetCandidate).toBeTruthy();

      runExec.mockImplementation(async (command: string, args: string[]) => {
        const joined = args.join(" ");
        if (command === "npm" && joined.startsWith("view ")) {
          return { stdout: JSON.stringify({ version: "1.2.3", license: "MIT" }), stderr: "" };
        }
        if (command === "npm" && joined.startsWith("pack ")) {
          const destination = args[args.indexOf("--pack-destination") + 1];
          await fs.mkdir(destination, { recursive: true });
          const tarball = "candidate.tgz";
          await fs.writeFile(path.join(destination, tarball), "tarball", "utf8");
          return { stdout: `${tarball}\n`, stderr: "" };
        }
        if (command === "git" && args[0] === "clone") {
          const repoDir = args[args.length - 1];
          await fs.mkdir(repoDir, { recursive: true });
          await fs.writeFile(path.join(repoDir, "README.md"), "# repo integration\n", "utf8");
          await fs.writeFile(path.join(repoDir, "package.json"), "{\"name\":\"repo\"}\n", "utf8");
          return { stdout: "cloned", stderr: "" };
        }
        if (command === "git" && joined === `-C ${args[1]} rev-parse HEAD`) {
          return { stdout: "abc123", stderr: "" };
        }
        throw new Error(`unexpected command: ${command} ${joined}`);
      });

      const ingested = await ingestCapabilityFoundryCandidates({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        ids: [localSkill!.id, localPlugin!.id, npmCandidate!.id, githubCandidate!.id, assetCandidate!.id],
      });

      const states = new Map(ingested.candidates.map((candidate) => [candidate.id, candidate.state]));
      expect(states.get(localSkill!.id)).toBe("fetched");
      expect(states.get(localPlugin!.id)).toBe("fetched");
      expect(states.get(npmCandidate!.id)).toBe("fetched");
      expect(states.get(githubCandidate!.id)).toBe("fetched");
      expect(states.get(assetCandidate!.id)).toBe("fetched");

      const registry = await loadCapabilityFoundryRegistry(process.env);
      expect(registry.candidates.some((candidate) => candidate.id === npmCandidate!.id)).toBe(true);
      expect(
        registry.candidates.find((candidate) => candidate.id === npmCandidate!.id)?.provenance
          .fetchedFrom,
      ).toContain("candidate.tgz");
      expect(
        registry.candidates.find((candidate) => candidate.id === githubCandidate!.id)?.provenance
          .fetchedFrom,
      ).toContain(path.join("repo"));
    });
  });

  it("inspects, tests, promotes, routes, and records usage for viable Foundry candidates", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const discovered = await discoverCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      const localSkill = discovered.registry.candidates.find(
        (candidate) => candidate.type === "skill" && candidate.source.kind === "local_repo",
      );
      const localPlugin = discovered.registry.candidates.find(
        (candidate) => candidate.type === "plugin" && candidate.source.kind === "local_repo",
      );
      expect(localSkill).toBeTruthy();
      expect(localPlugin).toBeTruthy();

      runExec.mockImplementation(async (command: string, args: string[]) => {
        const joined = args.join(" ");
        if (command === "npm" && joined.startsWith("view ")) {
          return { stdout: JSON.stringify({ version: "1.2.3", license: "MIT" }), stderr: "" };
        }
        if (command === "npm" && joined.startsWith("pack ")) {
          const destination = args[args.indexOf("--pack-destination") + 1];
          await fs.mkdir(destination, { recursive: true });
          const tarball = "candidate.tgz";
          await fs.writeFile(path.join(destination, tarball), "tarball", "utf8");
          return { stdout: `${tarball}\n`, stderr: "" };
        }
        if (command === "git" && args[0] === "clone") {
          const repoDir = args[args.length - 1];
          await fs.mkdir(repoDir, { recursive: true });
          await fs.writeFile(path.join(repoDir, "README.md"), "# repo integration\n", "utf8");
          await fs.writeFile(path.join(repoDir, "package.json"), "{\"name\":\"repo\"}\n", "utf8");
          return { stdout: "cloned", stderr: "" };
        }
        if (command === "git" && joined === `-C ${args[1]} rev-parse HEAD`) {
          return { stdout: "abc123", stderr: "" };
        }
        if (command === "corepack" && joined === "pnpm exec playwright --version") {
          throw new Error("playwright missing");
        }
        if (command === "corepack" && joined === "pnpm exec playwright install chromium") {
          return { stdout: "installed", stderr: "" };
        }
        throw new Error(`unexpected command: ${command} ${joined}`);
      });

      const ids = [localSkill!.id, localPlugin!.id];
      const ingested = await ingestCapabilityFoundryCandidates({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        ids,
      });
      const inspected = await inspectCapabilityFoundryRegistry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        ids,
      });
      const tested = await sandboxTestCapabilityFoundryCandidates({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        ids,
      });
      const promoted = await promoteCapabilityFoundryCandidates({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        ids,
        bundle: true,
      });
      const routes = await buildCapabilityFoundryRoutes({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        objective: "publish the browser workflow and create a reusable automation skill",
      });
      await recordCapabilityFoundryRouteUsage({
        env: process.env,
        objective: "publish the browser workflow and create a reusable automation skill",
        routes: routes.routes,
        outcome: "success",
        missionId: "mission-123",
        note: "foundry-test",
      });
      const refreshed = await refreshCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        includeRemote: false,
      });

      const inspectedStates = new Map(inspected.candidates.map((candidate) => [candidate.id, candidate]));
      expect(inspectedStates.get(localSkill!.id)?.state).toBe("inspected");
      expect(inspectedStates.get(localSkill!.id)?.test.status).toBe("pending");
      expect(inspectedStates.get(localPlugin!.id)?.state).toBe("inspected");

      const testedStates = new Map(tested.candidates.map((candidate) => [candidate.id, candidate]));
      expect(testedStates.get(localSkill!.id)?.test.status).toBe("passed");
      expect(testedStates.get(localPlugin!.id)?.test.status).toBe("passed");

      const promotedStates = new Map(promoted.candidates.map((candidate) => [candidate.id, candidate]));
      expect(promotedStates.get(localSkill!.id)?.state).toBe("bundled");
      expect(promotedStates.get(localPlugin!.id)?.state).toBe("bundled");
      const proofStat = await fs.stat(promotedStates.get(localSkill!.id)!.test.proofPath!);
      expect(proofStat.isFile()).toBe(true);

      expect(routes.registry.candidates.some((candidate) => candidate.state === "bundled")).toBe(
        true,
      );

      const registry = await loadCapabilityFoundryRegistry(process.env);
      expect(registry.usage.some((entry) => entry.missionId === "mission-123")).toBe(true);
      expect(registry.candidates.some((candidate) => candidate.state === "bundled")).toBe(true);
      expect(refreshed.bundled.length).toBeGreaterThan(0);
    });
  });
});
