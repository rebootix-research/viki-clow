import { execFile, execSync } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  resolveNativeVikiBrowserLauncherPaths,
  resolveNativeVikiBrowserRoot,
  writeNativeVikiBrowserLaunchers,
} from "./native-launcher.js";

const execFileAsync = promisify(execFile);
const NODE_SEA_SENTINEL = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";

export type NativeVikiBrowserExecutablePackageResult = {
  rootDir: string;
  distDir: string;
  executablePath: string;
  launcherPath: string;
  bootstrapPath: string;
  seaConfigPath: string;
  seaBlobPath: string;
  runtimeDependencyPaths: string[];
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureExecutable(filePath: string, reason: string): Promise<void> {
  if (!(await exists(filePath))) {
    throw new Error(reason);
  }
}

export function resolveNativeVikiBrowserPackagePaths(rootDir: string) {
  const launchers = resolveNativeVikiBrowserLauncherPaths(rootDir);
  const seaDir = path.join(launchers.distDir, "browser-native");
  return {
    ...launchers,
    executablePath: path.join(launchers.distDir, "Viki Browser.exe"),
    bootstrapPath: path.join(seaDir, "sea-bootstrap.cjs"),
    seaConfigPath: path.join(seaDir, "sea-config.json"),
    seaBlobPath: path.join(seaDir, "sea-prep.blob"),
    runtimeDependencyPaths: [
      path.join(launchers.distDir, "browser", "control-service.js"),
      path.join(launchers.distDir, "browser", "browserd.js"),
    ],
  };
}

export function buildNativeVikiBrowserSeaBootstrap(launcherPath: string): string {
  const normalizedLauncher = launcherPath.replace(/\\/g, "\\\\");
  return [
    "const path = require('node:path');",
    "const { pathToFileURL } = require('node:url');",
    "",
    "(async () => {",
    "  const exeDir = path.dirname(process.execPath);",
    `  const launcherPath = path.join(exeDir, '${path.basename(normalizedLauncher)}');`,
    "  await import(pathToFileURL(launcherPath).href);",
    "})().catch((error) => {",
    "  console.error(error instanceof Error ? error.message : String(error));",
    "  process.exit(1);",
    "});",
    "",
  ].join("\n");
}

function resolvePostjectBinary(rootDir: string): string {
  const candidate = path.join(
    rootDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "postject.cmd" : "postject",
  );
  if (!fsSync.existsSync(candidate)) {
    throw new Error(
      `postject is not installed at ${candidate}. Run "corepack pnpm install" before packaging Viki Browser.`,
    );
  }
  return candidate;
}

function relativeCmdPath(rootDir: string, targetPath: string): string {
  const relative = path.relative(rootDir, targetPath);
  if (!relative || path.isAbsolute(relative)) {
    return targetPath;
  }
  return relative;
}

export async function packageNativeVikiBrowserExecutable(params?: {
  rootDir?: string;
}): Promise<NativeVikiBrowserExecutablePackageResult> {
  if (process.platform !== "win32") {
    throw new Error(
      "Native Viki Browser executable packaging is currently implemented for Windows only.",
    );
  }

  const rootDir = resolveNativeVikiBrowserRoot(params?.rootDir);
  await writeNativeVikiBrowserLaunchers({ rootDir });

  const paths = resolveNativeVikiBrowserPackagePaths(rootDir);
  await fs.mkdir(path.dirname(paths.bootstrapPath), { recursive: true });

  for (const dependencyPath of paths.runtimeDependencyPaths) {
    await ensureExecutable(
      dependencyPath,
      `Native Viki Browser runtime dependency missing: ${dependencyPath}. Run "pnpm build" first.`,
    );
  }

  await fs.writeFile(
    paths.bootstrapPath,
    buildNativeVikiBrowserSeaBootstrap(paths.nodeLauncherPath),
    "utf8",
  );
  await fs.writeFile(
    paths.seaConfigPath,
    `${JSON.stringify(
      {
        main: paths.bootstrapPath,
        output: paths.seaBlobPath,
        disableExperimentalSEAWarning: true,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await execFileAsync(process.execPath, ["--experimental-sea-config", paths.seaConfigPath], {
    cwd: rootDir,
    windowsHide: true,
    timeout: 120_000,
    maxBuffer: 1024 * 1024 * 20,
  });

  await fs.copyFile(process.execPath, paths.executablePath);

  const postjectBinary = resolvePostjectBinary(rootDir);
  const postjectCommand = [
    `"${relativeCmdPath(rootDir, postjectBinary)}"`,
    `"${relativeCmdPath(rootDir, paths.executablePath)}"`,
    "NODE_SEA_BLOB",
    `"${relativeCmdPath(rootDir, paths.seaBlobPath)}"`,
    "--sentinel-fuse",
    NODE_SEA_SENTINEL,
    "--overwrite",
  ].join(" ");
  execSync(postjectCommand, {
    cwd: rootDir,
    shell: process.env.ComSpec?.trim() || "C:\\Windows\\System32\\cmd.exe",
    windowsHide: true,
    timeout: 120_000,
    maxBuffer: 1024 * 1024 * 20,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const { stdout } = await execFileAsync(paths.executablePath, ["--probe", "--json"], {
    cwd: paths.distDir,
    windowsHide: true,
    timeout: 20_000,
    maxBuffer: 1024 * 1024 * 10,
  });
  const probe = JSON.parse(String(stdout || "{}")) as { ok?: boolean; product?: string };
  if (probe.ok !== true || probe.product !== "Viki Browser") {
    throw new Error("Packaged Viki Browser executable failed its probe run.");
  }

  return {
    rootDir,
    distDir: paths.distDir,
    executablePath: paths.executablePath,
    launcherPath: paths.nodeLauncherPath,
    bootstrapPath: paths.bootstrapPath,
    seaConfigPath: paths.seaConfigPath,
    seaBlobPath: paths.seaBlobPath,
    runtimeDependencyPaths: paths.runtimeDependencyPaths,
  };
}
