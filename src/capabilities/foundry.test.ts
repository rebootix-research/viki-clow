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

let buildCapabilityFoundryRoutes: typeof import("./foundry.js").buildCapabilityFoundryRoutes;
let discoverCapabilityFoundry: typeof import("./foundry.js").discoverCapabilityFoundry;
let ingestCapabilityFoundryCandidates: typeof import("./foundry.js").ingestCapabilityFoundryCandidates;
let inspectCapabilityFoundryRegistry: typeof import("./foundry.js").inspectCapabilityFoundryRegistry;
let loadCapabilityFoundryRegistry: typeof import("./store.js").loadCapabilityFoundryRegistry;
let promoteCapabilityFoundryCandidates: typeof import("./foundry.js").promoteCapabilityFoundryCandidates;
let recordCapabilityFoundryRouteUsage: typeof import("./foundry.js").recordCapabilityFoundryRouteUsage;
let refreshCapabilityFoundry: typeof import("./foundry.js").refreshCapabilityFoundry;
let rejectCapabilityFoundryCandidates: typeof import("./foundry.js").rejectCapabilityFoundryCandidates;
let sandboxTestCapabilityFoundryCandidates: typeof import("./foundry.js").sandboxTestCapabilityFoundryCandidates;

const tempDirs: string[] = [];

async function withTempDirs<T>(
  run: (params: { stateDir: string; workspaceDir: string }) => Promise<T>,
) {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-state-"));
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-workspace-"));
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

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

beforeEach(async () => {
  vi.resetModules();
  ({
    buildCapabilityFoundryRoutes,
    discoverCapabilityFoundry,
    ingestCapabilityFoundryCandidates,
    inspectCapabilityFoundryRegistry,
    promoteCapabilityFoundryCandidates,
    recordCapabilityFoundryRouteUsage,
    refreshCapabilityFoundry,
    rejectCapabilityFoundryCandidates,
    sandboxTestCapabilityFoundryCandidates,
  } = await import("./foundry.js"));
  ({ loadCapabilityFoundryRegistry } = await import("./store.js"));
});

describe("Capability Foundry", () => {
  it("discovers curated local, registry, repo, and asset candidates into the persisted registry", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const result = await discoverCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });

      expect(result.registry.supportedSources).toEqual(
        expect.arrayContaining([
          "bundled_skill:skill",
          "bundled_plugin:plugin",
          "curated_mcp:mcp_server",
          "curated_repo:repo_integration",
          "curated_asset:asset_dependency",
        ]),
      );
      expect(result.registry.candidates.some((candidate) => candidate.type === "skill")).toBe(true);
      expect(
        result.registry.candidates.some((candidate) => candidate.id === "plugin:workflow"),
      ).toBe(true);
      expect(
        result.registry.candidates.some((candidate) => candidate.id === "mcp:filesystem"),
      ).toBe(true);
      expect(
        result.registry.candidates.some((candidate) => candidate.id === "repo:langgraph"),
      ).toBe(true);
      expect(
        result.registry.candidates.some((candidate) => candidate.id === "asset:sherpa-onnx"),
      ).toBe(true);
      expect(
        result.registry.candidates.some(
          (candidate) =>
            candidate.sourceCatalogId === "vikiclow.foundry.approved" &&
            Boolean(candidate.lifecycleReceipt?.discoveredAt),
        ),
      ).toBe(true);

      const persisted = await loadCapabilityFoundryRegistry();
      expect(persisted.candidates.length).toBe(result.registry.candidates.length);
    });
  });

  it("ingests, tests, promotes, routes, and records usage for local capability candidates", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const discovered = await discoverCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      const skillCandidate = discovered.registry.candidates.find(
        (candidate) => candidate.type === "skill" && candidate.compatibility !== "incompatible",
      );
      expect(skillCandidate).toBeTruthy();

      const ingested = await ingestCapabilityFoundryCandidates({
        ids: [skillCandidate!.id],
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(ingested.candidates[0]?.state).toBe("fetched");
      expect(ingested.candidates[0]?.sandbox?.path).toBeTruthy();

      const tested = await sandboxTestCapabilityFoundryCandidates({
        ids: [skillCandidate!.id],
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(tested.candidates[0]?.state).toBe("tested");
      expect(tested.candidates[0]?.test.status).toBe("passed");
      expect(tested.candidates[0]?.test.proofPath).toBeTruthy();

      const promoted = await promoteCapabilityFoundryCandidates({
        ids: [skillCandidate!.id],
        bundle: true,
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(promoted.candidates[0]?.state).toBe("bundled");

      const routeObjective = [
        skillCandidate!.name,
        ...skillCandidate!.classification.objectiveHints.slice(0, 3),
      ]
        .filter(Boolean)
        .join(" ");
      const routes = await buildCapabilityFoundryRoutes({
        objective: routeObjective,
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(routes.routes.some((route) => route.candidateId === skillCandidate!.id)).toBe(true);
      expect(
        routes.routes.find((route) => route.candidateId === skillCandidate!.id)?.scoreReceipt,
      ).toMatchObject({
        evaluator: "vikiclow-foundry.route",
      });

      await recordCapabilityFoundryRouteUsage({
        objective: routeObjective,
        routes: routes.routes.filter((route) => route.candidateId === skillCandidate!.id),
        outcome: "success",
        missionId: "mission-foundry-success",
        note: "local-skill-route",
      });

      const persisted = await loadCapabilityFoundryRegistry();
      const updated = persisted.candidates.find((candidate) => candidate.id === skillCandidate!.id);
      expect(updated?.usage.success).toBeGreaterThan(0);
      expect(updated?.usage.lastOutcome).toBe("success");
      expect(persisted.usage.some((entry) => entry.missionId === "mission-foundry-success")).toBe(
        true,
      );
    });
  });

  it("ingests and promotes curated npm and github candidates through the sandbox pipeline", async () => {
    runExec.mockImplementation(async (command: string, args: string[]) => {
      if (command === "npm" && args[0] === "view") {
        return {
          stdout: JSON.stringify({ version: "1.2.3", license: "MIT" }),
          stderr: "",
        };
      }
      if (command === "npm" && args[0] === "pack") {
        const outDir = args.at(-1);
        if (!outDir) {
          throw new Error("missing pack destination");
        }
        const tarball = "server-filesystem-1.2.3.tgz";
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(path.join(outDir, tarball), "tarball", "utf8");
        return { stdout: `${tarball}\n`, stderr: "" };
      }
      if (command === "git" && args[0] === "clone") {
        const repoDir = args.at(-1);
        if (!repoDir) {
          throw new Error("missing repo clone dir");
        }
        await fs.mkdir(repoDir, { recursive: true });
        await fs.writeFile(path.join(repoDir, "README.md"), "# LangGraph\n", "utf8");
        return { stdout: "cloned\n", stderr: "" };
      }
      if (command === "git" && args[0] === "-C" && args[2] === "rev-parse") {
        return { stdout: "deadbeefcafebabe\n", stderr: "" };
      }
      throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
    });

    await withTempDirs(async ({ workspaceDir }) => {
      const ids = ["mcp:filesystem", "repo:langgraph"];

      const ingested = await ingestCapabilityFoundryCandidates({
        ids,
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(ingested.candidates).toHaveLength(2);
      expect(ingested.candidates.every((candidate) => candidate.state === "fetched")).toBe(true);

      const inspected = await inspectCapabilityFoundryRegistry({
        ids,
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(inspected.candidates.every((candidate) => candidate.state === "inspected")).toBe(true);

      const tested = await sandboxTestCapabilityFoundryCandidates({
        ids,
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(tested.candidates.every((candidate) => candidate.test.status === "passed")).toBe(true);

      const promoted = await promoteCapabilityFoundryCandidates({
        ids,
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });
      expect(promoted.candidates.every((candidate) => candidate.state === "promoted")).toBe(true);
      expect(
        promoted.candidates.find((candidate) => candidate.id === "mcp:filesystem")?.provenance
          .version,
      ).toBe("1.2.3");
      expect(
        promoted.candidates.find((candidate) => candidate.id === "repo:langgraph")?.provenance
          .sourceRef,
      ).toBe("deadbeefcafebabe");
    });
  });

  it("records rejection reasons and preserves them in the registry", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const rejected = await rejectCapabilityFoundryCandidates({
        ids: ["repo:temporal-sdk-typescript"],
        reason: "manual provenance review pending",
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
      });

      const rejectedCandidate = rejected.candidates.find(
        (candidate) => candidate.id === "repo:temporal-sdk-typescript",
      );
      expect(rejectedCandidate?.state).toBe("rejected");
      expect(rejectedCandidate?.rejectionReason).toBe("manual provenance review pending");

      const persisted = await loadCapabilityFoundryRegistry();
      const candidate = persisted.candidates.find(
        (entry) => entry.id === "repo:temporal-sdk-typescript",
      );
      expect(candidate?.scope).toBe("rejected");
      expect(candidate?.rejectionReason).toBe("manual provenance review pending");
    });
  });

  it("refreshes bundled candidates into the persisted registry for bootstrap and bundle flows", async () => {
    await withTempDirs(async ({ workspaceDir }) => {
      const result = await refreshCapabilityFoundry({
        workspaceDir,
        rootDir: process.cwd(),
        env: process.env,
        includeRemote: false,
      });

      expect(result.discovered).toBeGreaterThan(0);
      expect(result.registryPath).toContain(path.join("capabilities", "foundry", "registry.json"));
      expect(result.bundled.length).toBeGreaterThan(0);
      expect(
        result.registry.candidates.some(
          (candidate) => candidate.state === "bundled" && candidate.registration?.autoBundled,
        ),
      ).toBe(true);
    });
  });
});
