import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { resolveStateDir } from "../config/paths.js";
import { readBrowserdManifest } from "./browserd.js";
import { resolveNativeVikiBrowserLauncherPaths, resolveNativeVikiBrowserRoot } from "./native-launcher.js";

const execFileAsync = promisify(execFile);

export type NativeVikiBrowserCandidate = {
  label: string;
  source: "env" | "packaged";
  executablePath: string;
  exists: boolean;
};

export type NativeVikiBrowserProof = {
  version: 1;
  generatedAt: string;
  product: "Viki Browser";
  manifestPresent: boolean;
  manifestPath?: string;
  configuredExecutable?: string;
  configuredExecutableExists: boolean;
  candidates: NativeVikiBrowserCandidate[];
  sessionVaultReady: boolean;
  evidenceReady: boolean;
  launcherSmoke: {
    attempted: boolean;
    passed: boolean;
    command?: string;
    error?: string;
  };
  passed: boolean;
  notes: string[];
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveProofRoot(rootDir?: string): string {
  if (rootDir?.trim()) {
    return resolveNativeVikiBrowserRoot(rootDir);
  }
  let current = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(current, "package.json");
    if (fsSync.existsSync(candidate)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return resolveNativeVikiBrowserRoot();
}

function buildCandidates(rootDir: string, env: NodeJS.ProcessEnv): NativeVikiBrowserCandidate[] {
  const configured = env.VIKICLOW_VIKI_BROWSER_EXECUTABLE?.trim();
  const launchers = resolveNativeVikiBrowserLauncherPaths(rootDir);
  const packaged = [
    path.join(rootDir, "dist", "Viki Browser.exe"),
    path.join(rootDir, "dist", "Viki Browser.app", "Contents", "MacOS", "Viki Browser"),
    launchers.windowsCmdPath,
    launchers.windowsPs1Path,
    launchers.unixLauncherPath,
    launchers.nodeLauncherPath,
  ];
  const seen = new Set<string>();
  const candidates: NativeVikiBrowserCandidate[] = [];
  if (configured) {
    seen.add(configured);
    candidates.push({
      label: "Configured Viki Browser executable",
      source: "env",
      executablePath: configured,
      exists: false,
    });
  }
  for (const executablePath of packaged) {
    if (seen.has(executablePath)) {
      continue;
    }
    seen.add(executablePath);
    candidates.push({
      label: "Packaged Viki Browser candidate",
      source: "packaged",
      executablePath,
      exists: false,
    });
  }
  return candidates;
}

async function probeLauncherSmoke(params: {
  rootDir: string;
  env: NodeJS.ProcessEnv;
}): Promise<NativeVikiBrowserProof["launcherSmoke"]> {
  const launchers = resolveNativeVikiBrowserLauncherPaths(params.rootDir);
  const launcherPath = launchers.nodeLauncherPath;
  const command = `${process.execPath} ${launcherPath} --probe --json`;
  if (!(await exists(launcherPath))) {
    return {
      attempted: false,
      passed: false,
      command,
      error: "launcher file not found",
    };
  }
  try {
    const { stdout } = await execFileAsync(process.execPath, [launcherPath, "--probe", "--json"], {
      cwd: params.rootDir,
      env: params.env,
      timeout: 15_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
    const parsed = JSON.parse(String(stdout || "{}")) as { ok?: boolean; product?: string };
    return {
      attempted: true,
      passed: parsed.ok === true && parsed.product === "Viki Browser",
      command,
      error:
        parsed.ok === true && parsed.product === "Viki Browser"
          ? undefined
          : "launcher probe returned an invalid payload",
    };
  } catch (error) {
    return {
      attempted: true,
      passed: false,
      command,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function collectNativeVikiBrowserProof(params?: {
  rootDir?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<NativeVikiBrowserProof> {
  const env = params?.env ?? process.env;
  const rootDir = resolveProofRoot(params?.rootDir);
  const candidates = buildCandidates(rootDir, env);
  for (const candidate of candidates) {
    candidate.exists = await exists(candidate.executablePath);
  }
  const manifest = await readBrowserdManifest(env);
  if (manifest) {
    await Promise.all(
      manifest.profiles.flatMap((profile) => {
        const dirs = [profile.sessionVaultDir, profile.evidenceDir].filter((dir) => dir.length > 0);
        return dirs.map(async (dir) => {
          await fs.mkdir(dir, { recursive: true });
        });
      }),
    );
  }
  const launchers = resolveNativeVikiBrowserLauncherPaths(rootDir);
  const launcherDependencyPaths = [
    path.join(rootDir, "dist", "browser", "control-service.js"),
    path.join(rootDir, "dist", "browser", "browserd.js"),
  ];
  const launcherDependenciesReady = (
    await Promise.all(launcherDependencyPaths.map(async (filePath) => await exists(filePath)))
  ).every(Boolean);
  const configuredExecutable = env.VIKICLOW_VIKI_BROWSER_EXECUTABLE?.trim();
  const configuredCandidate = configuredExecutable
    ? candidates.find((candidate) => candidate.executablePath === configuredExecutable)
    : undefined;
  const profiles = manifest?.profiles ?? [];
  const manifestFresh =
    typeof manifest?.generatedAt === "string" &&
    Number.isFinite(Date.parse(manifest.generatedAt)) &&
    Date.now() - Date.parse(manifest.generatedAt) <= 1000 * 60 * 60 * 12;
  const manifestLooksSynthetic = manifest?.reason === "native-proof-test";
  const sessionVaultReady = (
    await Promise.all(
      profiles.map(async (profile) => {
        if (profile.sessionVaultDir.length === 0) {
          return false;
        }
        if (profile.userDataDir !== null) {
          return true;
        }
        return await exists(profile.sessionVaultDir);
      }),
    )
  ).some(Boolean);
  const evidenceReady = (
    await Promise.all(
      profiles.map(async (profile) => {
        if (profile.evidenceDir.length === 0) {
          return false;
        }
        return await exists(profile.evidenceDir);
      }),
    )
  ).some(Boolean);
  const launcherSmoke = await probeLauncherSmoke({ rootDir, env });
  const runnableCandidate = candidates.some((candidate) => {
    if (!candidate.exists) {
      return false;
    }
    const isLauncherCandidate =
      candidate.executablePath === launchers.nodeLauncherPath ||
      candidate.executablePath === launchers.windowsCmdPath ||
      candidate.executablePath === launchers.windowsPs1Path ||
      candidate.executablePath === launchers.unixLauncherPath;
    return isLauncherCandidate ? launcherDependenciesReady : true;
  });
  const notes: string[] = [];
  if (!manifest) {
    notes.push("browserd manifest not found yet");
  }
  if (!candidates.some((candidate) => candidate.exists)) {
    notes.push("No native Viki Browser executable candidate was found");
  }
  if (!launcherDependenciesReady) {
    notes.push("Native launcher dependencies are missing from dist/browser");
  }
  if (manifest && !manifestFresh) {
    notes.push("browserd manifest is stale");
  }
  if (manifestLooksSynthetic) {
    notes.push("browserd manifest was generated by a test fixture");
  }
  if (!sessionVaultReady) {
    notes.push("browserd manifest does not include a ready session vault");
  }
  if (!evidenceReady) {
    notes.push("browserd manifest does not include an evidence directory");
  }
  if (!launcherSmoke.passed) {
    notes.push(
      launcherSmoke.error ? `launcher smoke failed: ${launcherSmoke.error}` : "launcher smoke failed",
    );
  }
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    product: "Viki Browser",
    manifestPresent: Boolean(manifest),
    manifestPath: manifest?.manifestPath,
    configuredExecutable,
    configuredExecutableExists: Boolean(configuredCandidate?.exists),
    candidates,
    sessionVaultReady,
    evidenceReady,
    launcherSmoke,
    passed:
      Boolean(manifest) &&
      manifestFresh &&
      !manifestLooksSynthetic &&
      sessionVaultReady &&
      evidenceReady &&
      launcherSmoke.passed &&
      runnableCandidate,
    notes,
  };
}

export async function writeNativeVikiBrowserProof(params?: {
  rootDir?: string;
  env?: NodeJS.ProcessEnv;
  outDir?: string;
}): Promise<{ proof: NativeVikiBrowserProof; jsonPath: string }> {
  const env = params?.env ?? process.env;
  const outDir = params?.outDir ?? path.join(resolveStateDir(env), "browserd");
  const proof = await collectNativeVikiBrowserProof({
    rootDir: params?.rootDir,
    env,
  });
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "native-proof.json");
  await fs.writeFile(jsonPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  return { proof, jsonPath };
}
