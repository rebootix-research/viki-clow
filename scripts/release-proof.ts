#!/usr/bin/env -S node --import tsx

import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

type PackFile = { path: string };
type PackResult = { files?: PackFile[] };

function sh(command: string): string {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 40,
  })
    .trim()
    .replace(/\r\n/g, "\n");
}

function shOrFallback(command: string, fallback: string): string {
  try {
    return sh(command);
  } catch {
    return fallback;
  }
}

function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeText(path: string, contents: string) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, contents);
}

const outDir = resolve(".artifacts/release-proof");

const packageJson = readJson<{
  name: string;
  version: string;
  description?: string;
  repository?: { url?: string };
}>(resolve("package.json"));

const buildInfoPath = resolve("dist/build-info.json");
const buildInfo = existsSync(buildInfoPath) ? readJson<Record<string, unknown>>(buildInfoPath) : null;
const packRaw = sh("npm pack --dry-run --json --ignore-scripts");
const packResults = JSON.parse(packRaw) as PackResult[];
const packFiles = (packResults[0]?.files ?? []).map((file) => file.path).sort();
const packDestination = mkdtempSync(join(tmpdir(), "vikiclow-pack-"));
const actualPackRaw = sh(`npm pack --json --ignore-scripts --pack-destination "${packDestination.replace(/\\/g, "/")}"`);
const actualPackResults = JSON.parse(actualPackRaw) as Array<{ filename?: string; files?: PackFile[] }>;
const tarballName = actualPackResults[0]?.filename ?? "";
const tarballSourcePath = tarballName ? resolve(packDestination, tarballName) : "";

const requiredFiles = [
  "dist/index.js",
  "dist/entry.js",
  "dist/plugin-sdk/index.js",
  "dist/plugin-sdk/root-alias.cjs",
  "dist/build-info.json",
  "dist/browser/control-service.js",
  "dist/browser/browserd.js",
  "dist/viki-browser-launch.mjs",
  "dist/Viki Browser.cmd",
  "dist/Viki Browser.ps1",
  "dist/Viki Browser",
];

const missingFiles = requiredFiles.filter((path) => !packFiles.includes(path));
const forbiddenFiles = packFiles.filter((path) => path.startsWith("dist/VikiClow.app/"));
const browserLauncherSmoke = (() => {
  try {
    const stdout = sh(`"${process.execPath}" "${resolve("dist/viki-browser-launch.mjs")}" --probe --json`);
    const parsed = JSON.parse(stdout) as { ok?: boolean; product?: string };
    return {
      passed: parsed.ok === true && parsed.product === "Viki Browser",
      output: parsed,
    };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
})();
const gitAvailable = isGitRepo();
const gitSha = gitAvailable ? shOrFallback("git rev-parse HEAD", "unknown") : "unknown";
const gitBranch = gitAvailable ? shOrFallback("git rev-parse --abbrev-ref HEAD", "unknown") : "unknown";
const gitStatus = gitAvailable ? shOrFallback("git status --short", "") : "n/a";
mkdirSync(outDir, { recursive: true });

const proof = {
  generatedAt: new Date().toISOString(),
  package: {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? "",
    repository: packageJson.repository?.url ?? "",
  },
  git: {
    available: gitAvailable,
    sha: gitSha,
    branch: gitBranch,
    clean: gitAvailable ? gitStatus.length === 0 : null,
  },
  buildInfo,
  pack: {
    fileCount: packFiles.length,
    requiredFiles,
    missingFiles,
    forbiddenFiles,
    tarballName,
    sampleFiles: packFiles.slice(0, 40),
  },
  checks: {
    releasePackLooksHealthy: missingFiles.length === 0 && forbiddenFiles.length === 0,
    buildInfoPresent: buildInfo !== null,
    browserLauncherSmoke: browserLauncherSmoke.passed,
  },
  browserLauncherSmoke,
};

const jsonPath = resolve(outDir, "release-proof.json");
const mdPath = resolve(outDir, "release-proof.md");

writeText(jsonPath, `${JSON.stringify(proof, null, 2)}\n`);
writeText(
  mdPath,
  [
    "# VikiClow Release Proof",
    "",
    `- Package: \`${proof.package.name}@${proof.package.version}\``,
    `- Git available: \`${proof.git.available}\``,
    `- Git SHA: \`${proof.git.sha}\``,
    `- Branch: \`${proof.git.branch}\``,
    `- Working tree clean: \`${proof.git.clean}\``,
    `- Build info present: \`${proof.checks.buildInfoPresent}\``,
    `- Pack file count: \`${proof.pack.fileCount}\``,
    `- Tarball: \`${proof.pack.tarballName || "(none)"}\``,
    `- Required files missing: \`${proof.pack.missingFiles.length}\``,
    `- Forbidden files found: \`${proof.pack.forbiddenFiles.length}\``,
    `- Browser launcher smoke: \`${proof.checks.browserLauncherSmoke}\``,
    "",
    "## Artifact Paths",
    "",
    `- \`${jsonPath}\``,
    `- \`${mdPath}\``,
    ...(tarballName ? [`- \`${resolve(outDir, tarballName)}\``] : []),
    "",
    "## Sample Pack Files",
    "",
    ...proof.pack.sampleFiles.map((file) => `- \`${file}\``),
    "",
  ].join("\n"),
);

if (tarballSourcePath && existsSync(tarballSourcePath)) {
  copyFileSync(tarballSourcePath, resolve(outDir, tarballName));
}

rmSync(packDestination, { recursive: true, force: true });

console.log(`release-proof: wrote ${jsonPath}`);
console.log(`release-proof: wrote ${mdPath}`);

if (
  !proof.checks.releasePackLooksHealthy ||
  !proof.checks.buildInfoPresent ||
  !proof.checks.browserLauncherSmoke
) {
  console.error("release-proof: validation failed");
  process.exit(1);
}
