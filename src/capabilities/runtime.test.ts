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

let ensureBaseCapabilityPack: typeof import("./runtime.js").ensureBaseCapabilityPack;
let ensureCapabilitiesForObjective: typeof import("./runtime.js").ensureCapabilitiesForObjective;
let loadCapabilityManifest: typeof import("./store.js").loadCapabilityManifest;

const tempDirs: string[] = [];

async function withTempDirs<T>(
  run: (params: { stateDir: string; workspaceDir: string }) => Promise<T>,
) {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-cap-state-"));
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-cap-workspace-"));
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
  ({ ensureBaseCapabilityPack, ensureCapabilitiesForObjective } = await import("./runtime.js"));
  ({ loadCapabilityManifest } = await import("./store.js"));
});

describe("capability runtime", () => {
  it("provisions browser profiles and a generated skill for matching objectives", async () => {
    runExec.mockImplementation(async (command: string, args: string[]) => {
      if (command === "corepack" && args.join(" ") === "pnpm exec playwright --version") {
        return { stdout: "Version 1.55.0", stderr: "" };
      }
      throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
    });

    await withTempDirs(async ({ workspaceDir }) => {
      const plan = await ensureCapabilitiesForObjective({
        objective: "Use Playwright to publish the workflow and create a reusable automation skill",
        workspaceDir,
        autoInstall: true,
      });

      expect(plan.inferred).toEqual(
        expect.arrayContaining(["playwright", "browser_profiles", "generated_skill"]),
      );
      expect(plan.provisioned.some((record) => record.id === "browser_profiles")).toBe(true);
      expect(plan.provisioned.some((record) => record.id === "generated_skill")).toBe(true);
      expect(plan.generatedSkillPath).toContain("SKILL.md");
      expect(plan.foundry?.registryPath).toContain(
        path.join("capabilities", "foundry", "registry.json"),
      );
      expect(plan.foundry?.bundled).toBeGreaterThan(0);
      expect(plan.foundry?.routes.length).toBeGreaterThan(0);
      expect(plan.routing?.find((route) => route.id === "browser_profiles")).toBeTruthy();
      expect(
        plan.routing?.find((route) => route.id === "browser_profiles")?.matchedHints,
      ).toContain("playwright");
      expect(plan.routing?.find((route) => route.id === "playwright")?.usageCount).toBe(1);

      const manifest = await loadCapabilityManifest();
      expect(manifest.records.some((record) => record.id === "browser_profiles")).toBe(true);
      expect(manifest.records.find((record) => record.id === "browser_profiles")?.usageCount).toBe(
        1,
      );
      expect(
        manifest.records.find((record) => record.id === "browser_profiles")?.route,
      ).toBeTruthy();
      expect(
        await fs
          .readFile(path.join(workspaceDir, ".vikiclow", "browser", "README.txt"), "utf8")
          .then((contents) => contents.includes("Viki Browser mission profiles")),
      ).toBe(true);

      const secondPlan = await ensureCapabilitiesForObjective({
        objective: "Publish the browser workflow and create a reusable automation skill",
        workspaceDir,
        autoInstall: true,
      });
      expect(secondPlan.routing?.find((route) => route.id === "browser_profiles")?.usageCount).toBe(
        2,
      );
      expect(secondPlan.foundry?.routes.length).toBeGreaterThan(0);
    });
  });

  it("marks browser profiles as derived when playwright is the only browser hint", async () => {
    runExec.mockImplementation(async (command: string, args: string[]) => {
      if (command === "corepack" && args.join(" ") === "pnpm exec playwright --version") {
        return { stdout: "Version 1.55.0", stderr: "" };
      }
      throw new Error(`unexpected command: ${command} ${args.join(" ")}`);
    });

    await withTempDirs(async ({ workspaceDir }) => {
      const plan = await ensureCapabilitiesForObjective({
        objective: "Use Playwright to validate the release smoke test",
        workspaceDir,
        autoInstall: true,
      });

      const browserProfilesRoute = plan.routing?.find((route) => route.id === "browser_profiles");
      expect(browserProfilesRoute?.source).toBe("derived");
      expect(browserProfilesRoute?.derivedFrom).toEqual(["playwright"]);
      expect(browserProfilesRoute?.matchedHints).toEqual(["playwright"]);

      const manifest = await loadCapabilityManifest();
      const manifestRoute = manifest.records.find((record) => record.id === "browser_profiles");
      expect(manifestRoute?.route?.source).toBe("derived");
      expect(manifestRoute?.usageCount).toBe(1);
    });
  });

  it("bootstraps the base capability pack and records missing tools without crashing", async () => {
    let playwrightVersionChecks = 0;
    runExec.mockImplementation(async (command: string, args: string[]) => {
      if (command === "git" || command === "node" || command === "python") {
        return { stdout: `${command} ok`, stderr: "" };
      }
      if (command === "ffmpeg") {
        throw new Error("ffmpeg missing");
      }
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
      const plan = await ensureBaseCapabilityPack({ workspaceDir, autoInstall: true });
      expect(plan.ready.some((record) => record.id === "git")).toBe(true);
      expect(plan.missing.some((record) => record.id === "ffmpeg")).toBe(true);
      expect(plan.provisioned.some((record) => record.id === "playwright")).toBe(true);
      expect(plan.foundry?.bundled).toBeGreaterThan(0);
    });
  });
});
