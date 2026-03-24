import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import { CONFIG_DIR } from "../utils.js";
import type { BrowserServerState, ProfileStatus } from "./server-context.js";
import { resolveProfile } from "./config.js";

export type BrowserdProfileManifest = {
  name: string;
  running: boolean;
  pid: number | null;
  cdpPort: number;
  cdpUrl: string;
  color: string;
  driver: string;
  isRemote: boolean;
  tabCount: number;
  userDataDir: string | null;
  sessionVaultDir: string;
  evidenceDir: string;
};

export type BrowserdManifest = {
  version: 1;
  service: "browserd";
  product: "Viki Browser";
  reason: string;
  generatedAt: string;
  manifestPath: string;
  controlPort: number;
  controlUrl: string;
  defaultProfile: string;
  enabled: boolean;
  profiles: BrowserdProfileManifest[];
};

export function resolveBrowserdPaths(env: NodeJS.ProcessEnv = process.env): {
  baseDir: string;
  manifestPath: string;
} {
  const baseDir = path.join(resolveStateDir(env), "browserd");
  return {
    baseDir,
    manifestPath: path.join(baseDir, "manifest.json"),
  };
}

function resolveProfileAuxDirs(profileName: string) {
  const profileDir = path.join(CONFIG_DIR, "browser", profileName);
  return {
    sessionVaultDir: path.join(profileDir, "user-data"),
    evidenceDir: path.join(profileDir, "evidence"),
  };
}

export function buildBrowserdManifest(params: {
  state: BrowserServerState;
  reason: string;
  profileStatuses?: ProfileStatus[];
  env?: NodeJS.ProcessEnv;
}): BrowserdManifest {
  const paths = resolveBrowserdPaths(params.env);
  const statuses = new Map((params.profileStatuses ?? []).map((status) => [status.name, status]));
  const profiles = Object.keys(params.state.resolved.profiles)
    .sort()
    .map<BrowserdProfileManifest>((name) => {
      const runtime = params.state.profiles.get(name);
      const profile = resolveProfile(params.state.resolved, name) ?? runtime?.profile;
      if (!profile) {
        return {
          name,
          running: Boolean(runtime?.running) || Boolean(statuses.get(name)?.running),
          pid: runtime?.running?.pid ?? null,
          cdpPort: statuses.get(name)?.cdpPort ?? 0,
          cdpUrl: statuses.get(name)?.cdpUrl ?? "",
          color: statuses.get(name)?.color ?? "#11847E",
          driver: "vikiclow",
          isRemote: Boolean(statuses.get(name)?.isRemote),
          tabCount: statuses.get(name)?.tabCount ?? 0,
          userDataDir: runtime?.running?.userDataDir ?? null,
          sessionVaultDir: resolveProfileAuxDirs(name).sessionVaultDir,
          evidenceDir: resolveProfileAuxDirs(name).evidenceDir,
        };
      }
      const status = statuses.get(name);
      const aux = resolveProfileAuxDirs(name);
      return {
        name,
        running: Boolean(runtime?.running) || Boolean(status?.running),
        pid: runtime?.running?.pid ?? null,
        cdpPort: profile.cdpPort,
        cdpUrl: profile.cdpUrl,
        color: profile.color,
        driver: profile.driver,
        isRemote: !profile.cdpIsLoopback,
        tabCount: status?.tabCount ?? 0,
        userDataDir: runtime?.running?.userDataDir ?? null,
        sessionVaultDir: aux.sessionVaultDir,
        evidenceDir: aux.evidenceDir,
      };
    });
  return {
    version: 1,
    service: "browserd",
    product: "Viki Browser",
    reason: params.reason,
    generatedAt: new Date().toISOString(),
    manifestPath: paths.manifestPath,
    controlPort: params.state.port,
    controlUrl: `http://127.0.0.1:${params.state.port}/`,
    defaultProfile: params.state.resolved.defaultProfile,
    enabled: params.state.resolved.enabled,
    profiles,
  };
}

export async function writeBrowserdManifestForState(params: {
  state: BrowserServerState;
  reason: string;
  profileStatuses?: ProfileStatus[];
  env?: NodeJS.ProcessEnv;
}): Promise<BrowserdManifest> {
  const manifest = buildBrowserdManifest(params);
  const paths = resolveBrowserdPaths(params.env);
  await fs.mkdir(paths.baseDir, { recursive: true });
  await Promise.all(
    manifest.profiles.map(async (profile) => {
      await fs.mkdir(profile.sessionVaultDir, { recursive: true });
      await fs.mkdir(profile.evidenceDir, { recursive: true });
    }),
  );
  await fs.writeFile(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

export async function readBrowserdManifest(
  env: NodeJS.ProcessEnv = process.env,
): Promise<BrowserdManifest | null> {
  const paths = resolveBrowserdPaths(env);
  try {
    const raw = await fs.readFile(paths.manifestPath, "utf8");
    return JSON.parse(raw) as BrowserdManifest;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
