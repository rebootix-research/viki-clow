import { spawnSync } from "node:child_process";

const mode = process.argv.includes("--check") ? "--check" : "--write";
const files = spawnSync("git", ["ls-files", "docs/**/*.md", "docs/**/*.mdx", "README.md"], {
  encoding: "utf8",
});

if (files.status !== 0) {
  process.stderr.write(files.stderr || "failed to enumerate docs files\n");
  process.exit(files.status ?? 1);
}

const paths = files.stdout
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);

if (paths.length === 0) {
  process.exit(0);
}

const batchSize = 50;
for (let index = 0; index < paths.length; index += batchSize) {
  const batch = paths.slice(index, index + batchSize);
  const result = spawnSync("corepack", ["pnpm", "exec", "oxfmt", mode, ...batch], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if ((result.status ?? 0) !== 0) {
    process.exit(result.status ?? 1);
  }
}
