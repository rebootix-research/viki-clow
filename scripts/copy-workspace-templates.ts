#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const srcDir = path.join(projectRoot, "docs", "reference", "templates");
const distDir = path.join(projectRoot, "dist", "docs", "reference", "templates");
const verbose = process.env.VIKICLOW_BUILD_VERBOSE === "1";

function copyWorkspaceTemplates() {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`[copy-workspace-templates] Source directory not found: ${srcDir}`);
  }

  fs.mkdirSync(distDir, { recursive: true });
  fs.cpSync(srcDir, distDir, {
    recursive: true,
    force: true,
  });

  if (verbose) {
    const files = fs.readdirSync(distDir).sort();
    console.log(`[copy-workspace-templates] Copied workspace templates: ${files.join(", ")}`);
  } else {
    console.log("[copy-workspace-templates] Copied workspace templates.");
  }
}

copyWorkspaceTemplates();
