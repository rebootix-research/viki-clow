import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveNativeVikiBrowserRoot,
  writeNativeVikiBrowserLaunchers,
} from "./native-launcher.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0, tempRoots.length)
      .map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("native Viki Browser launchers", () => {
  it("writes packaged launcher files into dist", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-browser-launcher-"));
    tempRoots.push(rootDir);
    await fs.writeFile(path.join(rootDir, "package.json"), '{"name":"vikiclow"}\n', "utf8");

    const paths = await writeNativeVikiBrowserLaunchers({ rootDir });

    await expect(fs.readFile(paths.nodeLauncherPath, "utf8")).resolves.toContain(
      'product: "Viki Browser"',
    );
    await expect(fs.readFile(paths.nodeLauncherPath, "utf8")).resolves.toContain(
      "startBrowserControlServiceFromConfig",
    );
    await expect(fs.readFile(paths.nodeLauncherPath, "utf8")).resolves.toContain(
      '"./browser/control-service.js"',
    );
    await expect(fs.readFile(paths.nodeLauncherPath, "utf8")).resolves.toContain(
      '"./browser/browserd.js"',
    );
    await expect(fs.readFile(paths.nodeLauncherPath, "utf8")).resolves.toContain("--probe");
    await expect(fs.readFile(paths.windowsCmdPath, "utf8")).resolves.toContain(
      "viki-browser-launch.mjs",
    );
    await expect(fs.readFile(paths.windowsPs1Path, "utf8")).resolves.toContain(
      "viki-browser-launch.mjs",
    );
    await expect(fs.readFile(paths.unixLauncherPath, "utf8")).resolves.toContain("exec node");
  });

  it("falls back to the package root when a random working directory is passed", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-browser-root-"));
    tempRoots.push(rootDir);
    const nestedDir = path.join(rootDir, "tmp", "deep", "cwd");
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(rootDir, "package.json"), '{"name":"vikiclow"}\n', "utf8");

    expect(resolveNativeVikiBrowserRoot(nestedDir)).toBe(rootDir);
  });
});
