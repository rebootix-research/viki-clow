import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const skippedDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".artifacts",
]);

const textExtensions = new Set([
  ".c",
  ".cc",
  ".container",
  ".cfg",
  ".conf",
  ".cpp",
  ".cs",
  ".css",
  ".csv",
  ".env",
  ".example",
  ".go",
  ".gitignore",
  ".gitattributes",
  ".gradle",
  ".html",
  ".in",
  ".ini",
  ".java",
  ".js",
  ".json",
  ".jsonc",
  ".jsonl",
  ".jsx",
  ".kts",
  ".kt",
  ".map",
  ".md",
  ".mdx",
  ".mjs",
  ".mod",
  ".npmrc",
  ".plist",
  ".properties",
  ".ps1",
  ".py",
  ".rb",
  ".rs",
  ".rules",
  ".scss",
  ".service",
  ".sh",
  ".sql",
  ".svg",
  ".swift",
  ".sum",
  ".timer",
  ".test",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xcconfig",
  ".xml",
  ".yaml",
  ".yml",
  ".zsh",
  ".baseline",
]);

const textBasenames = new Set([
  ".dockerignore",
  ".env.example",
  ".gitignore",
  ".mailmap",
  ".swiftformat",
  ".swiftlint",
  "dockerfile",
  "license",
  "makefile",
]);

const LEGACY_OPENCLAW = `Open${"Claw"}`;
const LEGACY_OPEN_CLAW = `Open ${"Claw"}`;
const LEGACY_OPENCLOW = `Open${"Clow"}`;
const LEGACY_OPEN_CLOW = `Open ${"Clow"}`;
const LEGACY_CLAWHUB = `Claw${"Hub"}`;

const contentReplacements = [
  [new RegExp(LEGACY_OPEN_CLAW, "g"), "VikiClow"],
  [new RegExp(LEGACY_OPENCLAW, "g"), "VikiClow"],
  [new RegExp(LEGACY_OPEN_CLAW.toLowerCase(), "g"), "vikiclow"],
  [new RegExp(LEGACY_OPENCLAW.toLowerCase(), "g"), "vikiclow"],
  [new RegExp(LEGACY_OPEN_CLOW, "g"), "VikiClow"],
  [new RegExp(LEGACY_OPEN_CLOW.toLowerCase(), "g"), "vikiclow"],
  [new RegExp(LEGACY_CLAWHUB, "g"), "Viki Skills"],
  [new RegExp(LEGACY_CLAWHUB.toLowerCase(), "g"), "vikiclow skills"],
];

const renameReplacements = [
  [LEGACY_OPENCLAW, "VikiClow"],
  [LEGACY_OPENCLAW.toUpperCase(), "VIKICLOW"],
  [LEGACY_OPENCLAW.toLowerCase(), "vikiclow"],
  [LEGACY_OPENCLOW, "VikiClow"],
  [LEGACY_OPENCLOW.toLowerCase(), "vikiclow"],
];

function isTextFile(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (textExtensions.has(ext)) return true;
  return textBasenames.has(base.toLowerCase());
}

async function walk(dir, files = [], dirs = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skippedDirs.has(entry.name)) continue;
      dirs.push(fullPath);
      await walk(fullPath, files, dirs);
      continue;
    }
    files.push(fullPath);
  }
  return { files, dirs };
}

function applyContentReplacements(input) {
  let output = input;
  for (const [pattern, replacement] of contentReplacements) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

function applyRenameReplacements(input) {
  let output = input;
  for (const [from, to] of renameReplacements) {
    output = output.split(from).join(to);
  }
  return output;
}

async function rewriteTextFiles(files) {
  let changed = 0;
  for (const file of files) {
    if (!isTextFile(file)) continue;
    const original = await fs.readFile(file, "utf8");
    const next = applyContentReplacements(original);
    if (next !== original) {
      await fs.writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  return changed;
}

async function renamePaths(paths) {
  let renamed = 0;
  const ordered = [...paths].sort((a, b) => b.length - a.length);
  for (const oldPath of ordered) {
    const parent = path.dirname(oldPath);
    const currentName = path.basename(oldPath);
    const nextName = applyRenameReplacements(currentName);
    if (nextName === currentName) continue;
    const nextPath = path.join(parent, nextName);
    try {
      await fs.access(oldPath);
    } catch {
      continue;
    }
    await fs.rename(oldPath, nextPath);
    renamed += 1;
  }
  return renamed;
}

const { files, dirs } = await walk(repoRoot);
const rewrittenFiles = await rewriteTextFiles(files);
const renamedPaths = await renamePaths([...files, ...dirs]);

console.log(
  JSON.stringify(
    {
      repoRoot,
      rewrittenFiles,
      renamedPaths,
    },
    null,
    2,
  ),
);
