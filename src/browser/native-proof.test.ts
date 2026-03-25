import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { withTempHome } from "../config/test-helpers.js";
import { writeBrowserdManifestForState } from "./browserd.js";
import { writeNativeVikiBrowserLaunchers } from "./native-launcher.js";
import { writeNativeVikiBrowserProof } from "./native-proof.js";
import type { BrowserServerState } from "./server-context.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0, tempRoots.length)
      .map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

async function seedLauncherRuntime(rootDir: string) {
  await writeNativeVikiBrowserLaunchers({ rootDir });
  const browserDir = path.join(rootDir, "dist", "browser");
  await fs.mkdir(browserDir, { recursive: true });
  await fs.writeFile(
    path.join(browserDir, "control-service.js"),
    [
      "export function createBrowserControlContext() { return {}; }",
      "export async function startBrowserControlServiceFromConfig() { return null; }",
      "export async function stopBrowserControlService() {}",
      "",
    ].join("\n"),
    "utf8",
  );
  await fs.writeFile(
    path.join(browserDir, "browserd.js"),
    ["export async function readBrowserdManifest() { return null; }", ""].join("\n"),
    "utf8",
  );
}

function buildState(
  rootDir: string,
  exePath: string,
  userDataDir: string | null,
): BrowserServerState {
  return {
    server: null,
    port: 18791,
    resolved: {
      enabled: true,
      defaultProfile: "vikiclow",
      profiles: {
        vikiclow: {
          name: "vikiclow",
          color: "#11847E",
          driver: "vikiclow",
          cdpPort: 18800,
          cdpUrl: "http://127.0.0.1:18800",
          cdpIsLoopback: true,
          cdpProtocol: "http",
          cdpHost: "127.0.0.1",
          attachOnly: false,
        },
      },
    },
    profiles: new Map([
      [
        "vikiclow",
        {
          profile: {
            name: "vikiclow",
            color: "#11847E",
            driver: "vikiclow",
            cdpPort: 18800,
            cdpUrl: "http://127.0.0.1:18800",
            cdpIsLoopback: true,
            cdpProtocol: "http",
            cdpHost: "127.0.0.1",
            attachOnly: false,
          },
          running: {
            pid: 4242,
            exe: {
              kind: "chrome",
              path: exePath,
            },
            userDataDir,
            cdpPort: 18800,
            startedAt: Date.now(),
            proc: null as never,
          },
          lastTargetId: null,
          reconcile: null,
        },
      ],
    ]),
  } as unknown as BrowserServerState;
}

describe("native Viki Browser proof", () => {
  it("passes when manifest, session vault, evidence, launcher runtime, and executable are ready", async () => {
    await withTempHome(async () => {
      const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-browser-proof-"));
      tempRoots.push(rootDir);
      await fs.writeFile(path.join(rootDir, "package.json"), '{"name":"vikiclow"}\n', "utf8");
      await seedLauncherRuntime(rootDir);
      const exePath = path.join(rootDir, "dist", "Viki Browser.exe");
      const userDataDir = path.join(rootDir, "user-data");
      const evidenceDir = path.join(os.homedir(), ".vikiclow", "browser", "vikiclow", "evidence");
      await fs.mkdir(path.dirname(exePath), { recursive: true });
      await fs.writeFile(exePath, "echo", "utf8");
      await fs.mkdir(userDataDir, { recursive: true });
      await fs.mkdir(evidenceDir, { recursive: true });

      await writeBrowserdManifestForState({
        state: buildState(rootDir, exePath, userDataDir),
        reason: "runtime-start",
        profileStatuses: [
          {
            name: "vikiclow",
            cdpPort: 18800,
            cdpUrl: "http://127.0.0.1:18800",
            color: "#11847E",
            running: true,
            tabCount: 2,
            isDefault: true,
            isRemote: false,
          },
        ],
      });

      const { proof, jsonPath } = await writeNativeVikiBrowserProof({
        rootDir,
        env: {
          ...process.env,
          VIKICLOW_VIKI_BROWSER_EXECUTABLE: exePath,
        },
      });

      expect(proof.passed).toBe(true);
      expect(proof.launcherSmoke.passed).toBe(true);
      expect(proof.sessionVaultReady).toBe(true);
      expect(proof.evidenceReady).toBe(true);
      await expect(fs.readFile(jsonPath, "utf8")).resolves.toContain('"product": "Viki Browser"');
    });
  });

  it("fails when the manifest is synthetic test data", async () => {
    await withTempHome(async () => {
      const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-browser-proof-synth-"));
      tempRoots.push(rootDir);
      await fs.writeFile(path.join(rootDir, "package.json"), '{"name":"vikiclow"}\n', "utf8");
      await seedLauncherRuntime(rootDir);
      const exePath = path.join(rootDir, "dist", "Viki Browser.exe");
      await fs.mkdir(path.dirname(exePath), { recursive: true });
      await fs.writeFile(exePath, "echo", "utf8");

      await writeBrowserdManifestForState({
        state: buildState(rootDir, exePath, path.join(rootDir, "user-data")),
        reason: "native-proof-test",
        profileStatuses: [
          {
            name: "vikiclow",
            cdpPort: 18800,
            cdpUrl: "http://127.0.0.1:18800",
            color: "#11847E",
            running: true,
            tabCount: 2,
            isDefault: true,
            isRemote: false,
          },
        ],
      });

      const { proof } = await writeNativeVikiBrowserProof({
        rootDir,
        env: {
          ...process.env,
          VIKICLOW_VIKI_BROWSER_EXECUTABLE: exePath,
        },
      });

      expect(proof.passed).toBe(false);
      expect(proof.notes).toContain("browserd manifest was generated by a test fixture");
    });
  });

  it("repairs the manifest by materializing a missing session vault directory", async () => {
    await withTempHome(async () => {
      const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-browser-proof-nosession-"));
      tempRoots.push(rootDir);
      await fs.writeFile(path.join(rootDir, "package.json"), '{"name":"vikiclow"}\n', "utf8");
      await seedLauncherRuntime(rootDir);
      const exePath = path.join(rootDir, "dist", "Viki Browser.exe");
      const evidenceDir = path.join(os.homedir(), ".vikiclow", "browser", "vikiclow", "evidence");
      await fs.mkdir(path.dirname(exePath), { recursive: true });
      await fs.writeFile(exePath, "echo", "utf8");
      await fs.mkdir(evidenceDir, { recursive: true });

      const manifest = await writeBrowserdManifestForState({
        state: buildState(rootDir, exePath, null),
        reason: "runtime-start",
        profileStatuses: [
          {
            name: "vikiclow",
            cdpPort: 18800,
            cdpUrl: "http://127.0.0.1:18800",
            color: "#11847E",
            running: true,
            tabCount: 2,
            isDefault: true,
            isRemote: false,
          },
        ],
      });
      const profile = manifest.profiles[0];
      if (!profile) {
        throw new Error("Expected browserd manifest profile");
      }
      await fs.rm(profile.sessionVaultDir, { recursive: true, force: true });

      const { proof } = await writeNativeVikiBrowserProof({
        rootDir,
        env: {
          ...process.env,
          VIKICLOW_VIKI_BROWSER_EXECUTABLE: exePath,
        },
      });

      expect(proof.passed).toBe(true);
      expect(proof.sessionVaultReady).toBe(true);
      await expect(fs.stat(profile.sessionVaultDir)).resolves.toBeDefined();
    });
  });
});
