import fs from "node:fs/promises";
import type { Command } from "commander";
import {
  createManualEvolutionCandidate,
  ingestGitHubWebhookCandidate,
  promoteEvolutionCandidate,
  recordEvolutionExperiment,
  rollbackEvolutionCandidate,
  summarizeEvolutionState,
} from "../evolution/index.js";
import { defaultRuntime } from "../runtime.js";
import { runCommandWithRuntime } from "./cli-utils.js";

export function registerEvolutionCli(program: Command) {
  const evolution = program
    .command("evolution")
    .description("Manage self-evolution candidate intake, experiments, and promotions");

  evolution
    .command("list")
    .description("List candidates, experiments, and promotions")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const summary = await summarizeEvolutionState();
        if (opts.json) {
          defaultRuntime.log(JSON.stringify(summary, null, 2));
          return;
        }
        defaultRuntime.log(`Candidates: ${summary.candidates.length}`);
        defaultRuntime.log(`Experiments: ${summary.experiments.length}`);
        defaultRuntime.log(`Promotions: ${summary.promotions.length}`);
      });
    });

  evolution
    .command("candidate <name>")
    .description("Create a manual evolution candidate")
    .requiredOption("--kind <repo|package|model>", "Candidate kind")
    .option("--source-url <url>", "Source URL")
    .option("--notes <text>", "Notes")
    .option("--tag <value...>", "Tags")
    .option("--json", "Output JSON", false)
    .action(async (name, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const candidate = await createManualEvolutionCandidate({
          name: String(name),
          kind: String(opts.kind) as "repo" | "package" | "model",
          sourceUrl: opts.sourceUrl ? String(opts.sourceUrl) : undefined,
          notes: opts.notes ? String(opts.notes) : undefined,
          tags: Array.isArray(opts.tag) ? opts.tag.map(String) : undefined,
        });
        defaultRuntime.log(opts.json ? JSON.stringify(candidate, null, 2) : candidate.id);
      });
    });

  evolution
    .command("ingest-github")
    .description("Validate and ingest a GitHub release webhook payload")
    .requiredOption("--event <name>", "GitHub event name")
    .requiredOption("--payload <path>", "Path to raw payload JSON")
    .requiredOption("--secret <value>", "GitHub webhook secret")
    .requiredOption("--signature <sha256=...>", "GitHub X-Hub-Signature-256 header value")
    .option("--delivery <id>", "GitHub delivery id")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const payload = await fs.readFile(String(opts.payload), "utf8");
        const candidate = await ingestGitHubWebhookCandidate({
          envelope: {
            event: String(opts.event),
            payload,
            signature256: String(opts.signature),
            deliveryId: opts.delivery ? String(opts.delivery) : undefined,
          },
          secret: String(opts.secret),
        });
        defaultRuntime.log(opts.json ? JSON.stringify(candidate, null, 2) : candidate.id);
      });
    });

  evolution
    .command("experiment <candidateId>")
    .description("Record a benchmark or replay experiment for a candidate")
    .requiredOption("--objective <text>", "Experiment objective")
    .requiredOption("--summary <text>", "Summary")
    .requiredOption("--score <number>", "Overall score")
    .option("--solve-rate <number>", "Solve rate")
    .option("--latency-ms <number>", "Latency in ms")
    .option("--json", "Output JSON", false)
    .action(async (candidateId, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const experiment = await recordEvolutionExperiment({
          candidateId: String(candidateId),
          objective: String(opts.objective),
          summary: String(opts.summary),
          score: Number(opts.score),
          solveRate: opts.solveRate != null ? Number(opts.solveRate) : undefined,
          latencyMs: opts.latencyMs != null ? Number(opts.latencyMs) : undefined,
        });
        defaultRuntime.log(opts.json ? JSON.stringify(experiment, null, 2) : experiment.id);
      });
    });

  evolution
    .command("promote <candidateId>")
    .description("Promote a candidate after a strong experiment result")
    .requiredOption("--rationale <text>", "Promotion rationale")
    .option("--experiment <id>", "Experiment id")
    .option("--json", "Output JSON", false)
    .action(async (candidateId, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const promotion = await promoteEvolutionCandidate({
          candidateId: String(candidateId),
          experimentId: opts.experiment ? String(opts.experiment) : undefined,
          rationale: String(opts.rationale),
        });
        defaultRuntime.log(opts.json ? JSON.stringify(promotion, null, 2) : promotion.id);
      });
    });

  evolution
    .command("rollback <candidateId>")
    .description("Rollback a promoted candidate")
    .requiredOption("--rationale <text>", "Rollback rationale")
    .option("--json", "Output JSON", false)
    .action(async (candidateId, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const rollback = await rollbackEvolutionCandidate({
          candidateId: String(candidateId),
          rationale: String(opts.rationale),
        });
        defaultRuntime.log(opts.json ? JSON.stringify(rollback, null, 2) : rollback.id);
      });
    });
}
