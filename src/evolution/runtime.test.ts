import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createManualEvolutionCandidate,
  ingestGitHubWebhookCandidate,
  promoteEvolutionCandidate,
  recordEvolutionExperiment,
  rollbackEvolutionCandidate,
  summarizeEvolutionState,
} from "./runtime.js";

const tempDirs: string[] = [];

async function withTempState<T>(run: (stateDir: string) => Promise<T>) {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-evolution-"));
  tempDirs.push(stateDir);
  const previous = process.env.VIKICLOW_STATE_DIR;
  process.env.VIKICLOW_STATE_DIR = stateDir;
  try {
    return await run(stateDir);
  } finally {
    if (previous === undefined) {
      delete process.env.VIKICLOW_STATE_DIR;
    } else {
      process.env.VIKICLOW_STATE_DIR = previous;
    }
  }
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("evolution runtime", () => {
  it("records manual candidates, experiments, promotions, and rollbacks", async () => {
    await withTempState(async () => {
      const candidate = await createManualEvolutionCandidate({
        name: "Playwright 1.55",
        kind: "package",
        sourceUrl: "https://playwright.dev",
        notes: "Candidate browser runtime update",
      });
      const experiment = await recordEvolutionExperiment({
        candidateId: candidate.id,
        objective: "Replay browser publish mission",
        summary: "Solve rate improved",
        score: 0.91,
        solveRate: 0.88,
        latencyMs: 1200,
      });
      const promotion = await promoteEvolutionCandidate({
        candidateId: candidate.id,
        experimentId: experiment.id,
        rationale: "Beat the current browser replay baseline",
      });
      const rollback = await rollbackEvolutionCandidate({
        candidateId: candidate.id,
        rationale: "Regression found in later replay",
      });

      const summary = await summarizeEvolutionState();
      expect(summary.candidates[0]?.status).toBe("rolled_back");
      expect(summary.experiments[0]?.id).toBe(experiment.id);
      expect(summary.promotions.map((entry) => entry.id)).toEqual([rollback.id, promotion.id]);
    });
  });

  it("ingests a signed GitHub release webhook into a persisted candidate", async () => {
    await withTempState(async () => {
      const payload = JSON.stringify({
        release: {
          name: "vikiclow nightly",
          tag_name: "nightly",
          html_url: "https://github.com/vikiclow/vikiclow/releases/tag/nightly",
        },
        repository: {
          full_name: "vikiclow/vikiclow",
          html_url: "https://github.com/vikiclow/vikiclow",
        },
      });
      const secret = "nightly-secret";
      const signature = await import("node:crypto").then(({ createHmac }) =>
        `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`,
      );
      const candidate = await ingestGitHubWebhookCandidate({
        envelope: {
          event: "release",
          payload,
          signature256: signature,
          deliveryId: "delivery-nightly",
        },
        secret,
      });
      const summary = await summarizeEvolutionState();
      expect(candidate.id).toBe("delivery-nightly");
      expect(summary.candidates[0]?.name).toBe("vikiclow nightly");
    });
  });
});
