import type { Command } from "commander";
import { agentCommand } from "../commands/agent.js";
import { buildMissionBackbone } from "../missions/backbone.js";
import { buildMissionExecutionPrompt, labelMissionDomain } from "../missions/orchestration.js";
import { summarizeMissionForList, summarizeMissionPlan } from "../missions/runtime.js";
import { loadMissionRecord, listMissionRecords } from "../missions/store.js";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";
import { runCommandWithRuntime } from "./cli-utils.js";
import { formatHelpExamples } from "./help-format.js";

function printMissionRecord(record: NonNullable<Awaited<ReturnType<typeof loadMissionRecord>>>, json: boolean) {
  if (json) {
    defaultRuntime.log(JSON.stringify(record, null, 2));
    return;
  }
  defaultRuntime.log(`${record.id}`);
  defaultRuntime.log(`Status: ${record.status}`);
  defaultRuntime.log(`Objective: ${record.objective}`);
  defaultRuntime.log(`Current state: ${record.currentState}`);
  defaultRuntime.log(`Run: ${record.runId}`);
  if (record.workspaceDir) {
    defaultRuntime.log(`Workspace: ${record.workspaceDir}`);
  }
  if (record.checkpoint) {
    defaultRuntime.log(`Checkpoint: ${record.checkpoint.summary}`);
  }
  if (record.proof) {
    defaultRuntime.log("Proof:");
    defaultRuntime.log(`- Topology: ${record.proof.topology}`);
    defaultRuntime.log(`- Swarms: ${record.proof.swarmCount}`);
    defaultRuntime.log(`- Last evidence: ${record.proof.lastEvidenceSummary ?? "n/a"}`);
    defaultRuntime.log(`- Terminal state: ${record.proof.terminalState ?? "running"}`);
  }
  const backbone = record.backbone ?? buildMissionBackbone(record);
  defaultRuntime.log("Backbone:");
  defaultRuntime.log(
    `- Temporal: ${backbone.temporal.workflowId} @ ${backbone.temporal.queue} (${backbone.temporal.status}; ${backbone.temporal.backend}; connected=${backbone.temporal.connected})`,
  );
  defaultRuntime.log(
    `- LangGraph: ${backbone.langGraph.graphId} -> ${backbone.langGraph.currentNodeId} (${backbone.langGraph.backend}; connected=${backbone.langGraph.connected})`,
  );
  defaultRuntime.log(`- Verifier: ${backbone.langGraph.verifierNodeId}`);
  defaultRuntime.log(`- Recovery: ${backbone.langGraph.recoveryNodeId}`);
  defaultRuntime.log(
    `- Browser: ${backbone.browser.product} (${backbone.browser.backend}; nativeReady=${backbone.browser.nativeReady}; manifest=${backbone.browser.manifestPresent})`,
  );
  defaultRuntime.log(
    `- Memory: graphiti (${backbone.memory.backend}; configured=${backbone.memory.configured}; connected=${backbone.memory.connected})`,
  );
  if (backbone.proofPath) {
    defaultRuntime.log(`- Proof: ${backbone.proofPath}`);
  }
  if (backbone.temporal.descriptorPath) {
    defaultRuntime.log(`- Temporal descriptor: ${backbone.temporal.descriptorPath}`);
  }
  if (backbone.langGraph.descriptorPath) {
    defaultRuntime.log(`- LangGraph descriptor: ${backbone.langGraph.descriptorPath}`);
  }
  if (backbone.langGraph.checkpointPath) {
    defaultRuntime.log(`- LangGraph checkpoint: ${backbone.langGraph.checkpointPath}`);
  }
  if (backbone.browser.nativeProofPath) {
    defaultRuntime.log(`- Browser proof: ${backbone.browser.nativeProofPath}`);
  }
  if (backbone.memory.proofPath) {
    defaultRuntime.log(`- Memory proof: ${backbone.memory.proofPath}`);
  }
  if (record.plan.swarms.length > 0) {
    defaultRuntime.log("Swarms:");
    for (const line of summarizeMissionPlan(record)) {
      defaultRuntime.log(`- ${line}`);
    }
  }
  if (record.subtasks.length > 0) {
    defaultRuntime.log("Subtasks:");
    for (const subtask of record.subtasks) {
      defaultRuntime.log(`- ${labelMissionDomain(subtask.domain)}: ${subtask.status}`);
    }
  }
  if (record.approvals.length > 0) {
    defaultRuntime.log("Approvals:");
    for (const approval of record.approvals.slice(-5)) {
      defaultRuntime.log(
        `- ${approval.status} ${approval.slug ?? approval.id}${approval.command ? ` :: ${approval.command}` : ""}`,
      );
    }
  }
  if (record.terminalMessage) {
    defaultRuntime.log(`Terminal: ${record.terminalMessage}`);
  }
}

export function registerMissionCli(program: Command) {
  const mission = program
    .command("mission")
    .description("Inspect, resume, and audit durable mission runs")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/mission", "docs.vikiclow.ai/cli/mission")}\n`,
    );

  mission
    .command("list")
    .description("List recent persisted missions")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const records = await listMissionRecords();
        if (Boolean(opts.json)) {
          defaultRuntime.log(JSON.stringify(records, null, 2));
          return;
        }
        if (records.length === 0) {
          defaultRuntime.log("No missions found.");
          return;
        }
        for (const record of records) {
          defaultRuntime.log(summarizeMissionForList(record));
        }
      });
    });

  mission
    .command("show <missionId>")
    .description("Show the full mission record")
    .option("--json", "Output JSON", false)
    .action(async (missionId, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const record = await loadMissionRecord(String(missionId));
        if (!record) {
          throw new Error(`Mission not found: ${missionId}`);
        }
        printMissionRecord(record, Boolean(opts.json));
      });
    });

  mission
    .command("prompt <missionId>")
    .description("Render the mission execution prompt injected into the runtime")
    .action(async (missionId) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const record = await loadMissionRecord(String(missionId));
        if (!record) {
          throw new Error(`Mission not found: ${missionId}`);
        }
        defaultRuntime.log(buildMissionExecutionPrompt(record));
      });
    });

  mission
    .command("backbone <missionId>")
    .description("Show the persisted Temporal/LangGraph backbone materialization")
    .option("--json", "Output JSON", false)
    .action(async (missionId, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const record = await loadMissionRecord(String(missionId));
        if (!record) {
          throw new Error(`Mission not found: ${missionId}`);
        }
        const backbone = record.backbone ?? buildMissionBackbone(record);
        if (Boolean(opts.json)) {
          defaultRuntime.log(JSON.stringify(backbone, null, 2));
          return;
        }
        defaultRuntime.log(JSON.stringify(backbone, null, 2));
      });
    });

  mission
    .command("resume <missionId>")
    .description("Resume a persisted mission with its saved request")
    .addHelpText(
      "after",
      () =>
        `\n${theme.heading("Examples:")}\n${formatHelpExamples([
          ["vikiclow mission list", "Inspect recent mission records."],
          ["vikiclow mission show mission-123", "Display the mission status, swarms, and approvals."],
          ["vikiclow mission resume mission-123", "Replay the saved request and append a new attempt."],
        ])}`,
    )
    .action(async (missionId) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const record = await loadMissionRecord(String(missionId));
        if (!record) {
          throw new Error(`Mission not found: ${missionId}`);
        }
        if (!record.resume.enabled || !record.resume.request) {
          throw new Error(`Mission ${missionId} cannot be resumed.`);
        }
        await agentCommand(record.resume.request, defaultRuntime);
      });
    });
}
