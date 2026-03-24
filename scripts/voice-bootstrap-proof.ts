#!/usr/bin/env -S node --import tsx

import { resolve } from "node:path";
import { writeVoiceBootstrapProof } from "../src/voice/bootstrap-proof.js";

const rootDir = resolve(process.cwd());
const { proof, jsonPath, mdPath } = await writeVoiceBootstrapProof(rootDir);

console.log(`voice-proof: wrote ${jsonPath}`);
console.log(`voice-proof: wrote ${mdPath}`);

if (!proof.passed) {
  console.error("voice-proof: validation failed");
  process.exit(1);
}
