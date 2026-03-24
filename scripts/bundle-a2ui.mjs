import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hashFile = path.join(repoRoot, "src", "canvas-host", "a2ui", ".bundle.hash");
const outputFile = path.join(repoRoot, "src", "canvas-host", "a2ui", "a2ui.bundle.js");
const a2uiRendererDir = path.join(repoRoot, "vendor", "a2ui", "renderers", "lit");
const a2uiAppDir = path.join(repoRoot, "apps", "shared", "VikiClowKit", "Tools", "CanvasA2UI");
const inputPaths = [
  path.join(repoRoot, "package.json"),
  path.join(repoRoot, "pnpm-lock.yaml"),
  a2uiRendererDir,
  a2uiAppDir,
];

function fail(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status ?? 1}.`);
  }
}

function runPnpm(args, label) {
  const npmExecPath = process.env.npm_execpath?.trim();
  if (npmExecPath && /pnpm(?:\.cjs)?$/i.test(npmExecPath)) {
    run(process.execPath, [npmExecPath, ...args], label);
    return;
  }
  run("pnpm", args, label);
}

async function walk(entryPath, files) {
  const stats = await fs.stat(entryPath);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry), files);
    }
    return;
  }
  files.push(entryPath);
}

function normalize(filePath) {
  return filePath.split(path.sep).join("/");
}

async function computeHash() {
  const files = [];
  for (const inputPath of inputPaths) {
    await walk(inputPath, files);
  }
  files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

  const hash = createHash("sha256");
  for (const filePath of files) {
    const rel = normalize(path.relative(repoRoot, filePath));
    hash.update(rel);
    hash.update("\0");
    hash.update(await fs.readFile(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function main() {
  try {
    const sourcesPresent = existsSync(a2uiRendererDir) && existsSync(a2uiAppDir);
    if (!sourcesPresent) {
      if (existsSync(outputFile)) {
        console.log("A2UI sources missing; keeping prebuilt bundle.");
        return;
      }
      fail(`A2UI sources missing and no prebuilt bundle found at: ${outputFile}`);
    }

    const currentHash = await computeHash();
    if (existsSync(hashFile) && existsSync(outputFile)) {
      const previousHash = (await fs.readFile(hashFile, "utf8")).trim();
      if (previousHash === currentHash) {
        console.log("A2UI bundle up to date; skipping.");
        return;
      }
    }

    runPnpm(["-s", "exec", "tsc", "-p", path.join(a2uiRendererDir, "tsconfig.json")], "A2UI TypeScript build");
    runPnpm(
      ["-s", "exec", "rolldown", "-c", path.join(a2uiAppDir, "rolldown.config.mjs")],
      "A2UI rolldown bundle",
    );

    await fs.writeFile(hashFile, `${currentHash}\n`, "utf8");
  } catch (error) {
    console.error("A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle");
    console.error("If this persists, verify pnpm deps and try again.");
    throw error;
  }
}

await main();
