import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildNativeVikiBrowserSeaBootstrap,
  resolveNativeVikiBrowserPackagePaths,
} from "./native-packager.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots
      .splice(0, tempRoots.length)
      .map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("native Viki Browser packager", () => {
  it("resolves the packaged Windows executable path under dist", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-browser-packager-"));
    tempRoots.push(rootDir);
    await fs.writeFile(path.join(rootDir, "package.json"), '{"name":"vikiclow"}\n', "utf8");

    const paths = resolveNativeVikiBrowserPackagePaths(rootDir);

    expect(paths.executablePath).toBe(path.join(rootDir, "dist", "Viki Browser.exe"));
    expect(paths.seaBlobPath).toContain(path.join("dist", "browser-native"));
  });

  it("builds a SEA bootstrap that loads the packaged Viki Browser launcher", () => {
    const bootstrap = buildNativeVikiBrowserSeaBootstrap("C:\\repo\\dist\\viki-browser-launch.mjs");

    expect(bootstrap).toContain("process.execPath");
    expect(bootstrap).toContain("viki-browser-launch.mjs");
    expect(bootstrap).toContain("pathToFileURL");
  });
});
