import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type NativeVikiBrowserLauncherPaths = {
  rootDir: string;
  distDir: string;
  nodeLauncherPath: string;
  windowsCmdPath: string;
  windowsPs1Path: string;
  unixLauncherPath: string;
};

function escapeForPowerShell(value: string): string {
  return value.replace(/'/g, "''");
}

export function resolveNativeVikiBrowserRoot(rootDir?: string): string {
  let current = rootDir?.trim()
    ? path.resolve(rootDir)
    : path.dirname(fileURLToPath(import.meta.url));
  if (fsSync.existsSync(current) && fsSync.statSync(current).isFile()) {
    current = path.dirname(current);
  }
  for (let depth = 0; depth < 6; depth += 1) {
    if (fsSync.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  current = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    if (fsSync.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function resolveNativeVikiBrowserLauncherPaths(
  rootDir?: string,
): NativeVikiBrowserLauncherPaths {
  const resolvedRoot = resolveNativeVikiBrowserRoot(rootDir);
  const distDir = path.join(resolvedRoot, "dist");
  return {
    rootDir: resolvedRoot,
    distDir,
    nodeLauncherPath: path.join(distDir, "viki-browser-launch.mjs"),
    windowsCmdPath: path.join(distDir, "Viki Browser.cmd"),
    windowsPs1Path: path.join(distDir, "Viki Browser.ps1"),
    unixLauncherPath: path.join(distDir, "Viki Browser"),
  };
}

function buildNodeLauncherContents(): string {
  return `#!/usr/bin/env node
function parseArgs(argv) {
  const parsed = {
    profile: process.env.VIKICLOW_BROWSER_PROFILE?.trim() || "vikiclow",
    urls: [],
    json: false,
    once: false,
    probe: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = String(argv[index] ?? "");
    if (!value) {
      continue;
    }
    if (value === "--json") {
      parsed.json = true;
      continue;
    }
    if (value === "--once") {
      parsed.once = true;
      continue;
    }
    if (value === "--probe") {
      parsed.probe = true;
      continue;
    }
    if (value === "--profile") {
      const next = String(argv[index + 1] ?? "").trim();
      if (!next) {
        throw new Error("--profile requires a value");
      }
      parsed.profile = next;
      index += 1;
      continue;
    }
    if (value.startsWith("--profile=")) {
      const next = value.slice("--profile=".length).trim();
      if (!next) {
        throw new Error("--profile requires a value");
      }
      parsed.profile = next;
      continue;
    }
    parsed.urls.push(value);
  }
  return parsed;
}

async function loadRuntime() {
  try {
    const control = await import("./browser/control-service.js");
    const browserd = await import("./browser/browserd.js");
    return {
      createBrowserControlContext: control.createBrowserControlContext,
      startBrowserControlServiceFromConfig: control.startBrowserControlServiceFromConfig,
      stopBrowserControlService: control.stopBrowserControlService,
      readBrowserdManifest: browserd.readBrowserdManifest,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      "Viki Browser launcher is missing its compiled runtime files. Run \\"pnpm build\\" or reinstall Vikiclow. " +
        \`Details: \${reason}\`,
    );
  }
}

async function main() {
  const runtime = await loadRuntime();
  const args = parseArgs(process.argv.slice(2));
  if (args.probe) {
    const payload = {
      ok: true,
      product: "Viki Browser",
      mode: "probe",
      profile: args.profile,
      imports: ["./browser/control-service.js", "./browser/browserd.js"],
    };
    if (args.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(["Viki Browser probe ready.", \`profile: \${payload.profile}\`, "imports: browser/control-service.js, browser/browserd.js"].join("\\n"));
    }
    return;
  }
  const state = await runtime.startBrowserControlServiceFromConfig();
  if (!state) {
    throw new Error("Viki Browser control service is disabled in config.");
  }
  const ctx = runtime.createBrowserControlContext();
  const profileCtx = ctx.forProfile(args.profile);
  await profileCtx.ensureBrowserAvailable();
  const opened = [];
  for (const url of args.urls) {
    const tab = await profileCtx.openTab(url);
    opened.push({ url: tab.url, targetId: tab.targetId });
  }
  const manifest = await runtime.readBrowserdManifest(process.env);
  const payload = {
    ok: true,
    product: "Viki Browser",
    profile: args.profile,
    controlUrl: \`http://127.0.0.1:\${state.port}/\`,
    manifestPath: manifest?.manifestPath ?? null,
    opened,
    mode: args.once ? "one-shot" : "persistent",
  };
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log([
      "Viki Browser ready.",
      \`profile: \${payload.profile}\`,
      \`control: \${payload.controlUrl}\`,
      \`manifest: \${payload.manifestPath ?? "(pending)"}\`,
      \`opened: \${payload.opened.length}\`,
      args.once ? "mode: one-shot" : "mode: persistent (Ctrl+C to stop the local browser control service)",
    ].join("\\n"));
  }
  if (args.once) {
    await runtime.stopBrowserControlService();
    return;
  }
  const shutdown = async () => {
    await runtime.stopBrowserControlService().catch(() => {});
    process.exit(0);
  };
  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });
  await new Promise(() => {});
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  try {
    const runtime = await loadRuntime();
    await runtime.stopBrowserControlService().catch(() => {});
  } catch {}
  process.exit(1);
});
`;
}

function buildWindowsCmdContents(nodeLauncherPath: string): string {
  const relativeLauncher = path.basename(nodeLauncherPath);
  return `@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%${relativeLauncher}" %*
`;
}

function buildWindowsPs1Contents(nodeLauncherPath: string): string {
  const relativeLauncher = path.basename(nodeLauncherPath);
  return [
    "$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path",
    `$launcher = Join-Path $scriptDir '${escapeForPowerShell(relativeLauncher)}'`,
    "node $launcher @args",
    "",
  ].join("\n");
}

function buildUnixLauncherContents(nodeLauncherPath: string): string {
  const relativeLauncher = path.basename(nodeLauncherPath);
  return `#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
exec node "$SCRIPT_DIR/${relativeLauncher}" "$@"
`;
}

export async function writeNativeVikiBrowserLaunchers(params?: {
  rootDir?: string;
}): Promise<NativeVikiBrowserLauncherPaths> {
  const paths = resolveNativeVikiBrowserLauncherPaths(params?.rootDir);
  await fs.mkdir(paths.distDir, { recursive: true });
  await fs.writeFile(paths.nodeLauncherPath, buildNodeLauncherContents(), "utf8");
  await fs.writeFile(paths.windowsCmdPath, buildWindowsCmdContents(paths.nodeLauncherPath), "utf8");
  await fs.writeFile(paths.windowsPs1Path, buildWindowsPs1Contents(paths.nodeLauncherPath), "utf8");
  await fs.writeFile(
    paths.unixLauncherPath,
    buildUnixLauncherContents(paths.nodeLauncherPath),
    "utf8",
  );
  await fs.chmod(paths.nodeLauncherPath, 0o755);
  await fs.chmod(paths.unixLauncherPath, 0o755);
  return paths;
}
