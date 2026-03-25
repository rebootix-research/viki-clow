#!/usr/bin/env -S node --import tsx

import path from "node:path";
import { writeExecutionSurfaceProof } from "../src/execution/surface-proof.ts";

const rootDir = path.resolve(".");
const outDir = path.join(rootDir, ".artifacts", "execution-surface");

const { proof, jsonPath, markdownPath } = await writeExecutionSurfaceProof({
  rootDir,
  outDir,
});

console.log(`execution-surface-proof: wrote ${jsonPath}`);
console.log(`execution-surface-proof: wrote ${markdownPath}`);

if (!proof.passed) {
  const details =
    proof.notes.length > 0 ? proof.notes.join("; ") : "execution surface proof failed";
  throw new Error(details);
}
