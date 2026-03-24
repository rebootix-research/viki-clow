#!/usr/bin/env -S node --import tsx

import fs from "node:fs/promises";
import path from "node:path";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../src/agents/agent-scope.js";
import { writeNativeVikiBrowserProof } from "../src/browser/native-proof.js";
import { bundleSupportedCapabilities } from "../src/capabilities/bundle.js";
import { loadConfig } from "../src/config/config.js";
import { readLatestGraphitiBackboneProof } from "../src/memory/graphiti-backbone.js";
import { beginMissionRun } from "../src/missions/runtime.js";
import { writeVoiceBootstrapProof } from "../src/voice/bootstrap-proof.js";

const rootDir = path.resolve(process.cwd());
const cfg = loadConfig();
const agentId = resolveDefaultAgentId(cfg);
const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
const artifactDir = path.join(rootDir, ".artifacts", "capability-bundle");
await fs.mkdir(artifactDir, { recursive: true });

const bundle = await bundleSupportedCapabilities({
  workspaceDir,
  config: cfg,
  autoInstall: true,
  rootDir,
  artifactDir,
});
const voiceProof = await writeVoiceBootstrapProof(rootDir, path.join(artifactDir, "voice-proof"));
const browserProof = await writeNativeVikiBrowserProof({
  rootDir,
  outDir: path.join(artifactDir, "browser-proof"),
});
const tracker = await beginMissionRun({
  objective: "Capability bundle proof refresh",
  runId: "capability-bundle-proof",
  agentId,
  sessionKey: "capability-bundle-proof",
  workspaceDir,
  deliver: false,
  replayRequest: {
    message: "Refresh capability bundle proof",
    args: { mode: "proof" },
  },
});
await tracker.recordCapabilityPlan(bundle.inventory.capabilityPlan);
const mission = await tracker.finalizeCompleted({
  replyText: "Capability bundle proof completed.",
});
const graphitiProof = await readLatestGraphitiBackboneProof({ agentId });
const summary = {
  generatedAt: new Date().toISOString(),
  bundleInventory: bundle.inventory.manifestPath,
  voiceProof: voiceProof.jsonPath,
  browserProof: browserProof.jsonPath,
  missionId: mission.id,
  missionBackboneProof: mission.backbone?.proofPath,
  graphitiProof: graphitiProof?.paths.proofPath,
};
const jsonPath = path.join(artifactDir, "capability-bundle-proof.json");
const mdPath = path.join(artifactDir, "capability-bundle-proof.md");
await fs.writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
await fs.writeFile(
  mdPath,
  [
    "# VikiClow Capability Bundle Proof",
    "",
    `- Bundle inventory: \`${summary.bundleInventory}\``,
    `- Voice proof: \`${summary.voiceProof}\``,
    `- Browser proof: \`${summary.browserProof}\``,
    `- Mission id: \`${summary.missionId}\``,
    `- Mission backbone proof: \`${summary.missionBackboneProof ?? "n/a"}\``,
    `- Graphiti proof: \`${summary.graphitiProof ?? "n/a"}\``,
    "",
  ].join("\n"),
  "utf8",
);

console.log(`capability-bundle-proof: wrote ${jsonPath}`);
console.log(`capability-bundle-proof: wrote ${mdPath}`);
