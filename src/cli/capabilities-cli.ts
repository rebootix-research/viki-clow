import type { Command } from "commander";
import { loadConfig } from "../config/config.js";
import { resolveDefaultAgentId, resolveAgentWorkspaceDir } from "../agents/agent-scope.js";
import { defaultRuntime } from "../runtime.js";
import {
  bundleSupportedCapabilities,
  ensureBaseCapabilityPack,
  ensureCapabilitiesForObjective,
  loadCapabilityManifest,
} from "../capabilities/index.js";
import { runCommandWithRuntime } from "./cli-utils.js";

function formatPlan(plan: Awaited<ReturnType<typeof ensureCapabilitiesForObjective>>): string[] {
  const lines = [`Objective: ${plan.objective}`];
  if (plan.inferred.length > 0) {
    lines.push(`Inferred: ${plan.inferred.join(", ")}`);
  }
  const sections: Array<[string, typeof plan.ready]> = [
    ["Ready", plan.ready],
    ["Provisioned", plan.provisioned],
    ["Missing", plan.missing],
    ["Failed", plan.failed],
  ];
  for (const [label, records] of sections) {
    if (records.length === 0) {
      continue;
    }
    lines.push(`${label}:`);
    for (const record of records) {
      lines.push(`- ${record.label}${record.details ? ` :: ${record.details}` : ""}`);
    }
  }
  if (plan.generatedSkillPath) {
    lines.push(`Generated skill: ${plan.generatedSkillPath}`);
  }
  return lines;
}

function resolveWorkspaceForDefaultAgent(): string {
  const cfg = loadConfig();
  const agentId = resolveDefaultAgentId(cfg);
  return resolveAgentWorkspaceDir(cfg, agentId);
}

export function registerCapabilitiesCli(program: Command) {
  const capabilities = program
    .command("capabilities")
    .description("Inspect and provision runtime capabilities for Vikiclow missions");

  capabilities
    .command("list")
    .description("List the persisted capability manifest")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const manifest = await loadCapabilityManifest();
        if (Boolean(opts.json)) {
          defaultRuntime.log(JSON.stringify(manifest, null, 2));
          return;
        }
        if (manifest.records.length === 0) {
          defaultRuntime.log("No capabilities recorded yet.");
          return;
        }
        for (const record of manifest.records) {
          defaultRuntime.log(
            `${record.label}: ${record.status}${record.details ? ` :: ${record.details}` : ""}`,
          );
        }
      });
    });

  capabilities
    .command("bundle")
    .description("Prebundle shipped skills, plugins, voice/runtime surfaces, and capability inventory")
    .option("--workspace <path>", "Workspace directory")
    .option("--no-auto-install", "Do not auto-install bundled skill dependencies")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const config = loadConfig();
        const result = await bundleSupportedCapabilities({
          config,
          workspaceDir: opts.workspace ? String(opts.workspace) : resolveWorkspaceForDefaultAgent(),
          autoInstall: opts.autoInstall !== false,
        });
        if (Boolean(opts.json)) {
          defaultRuntime.log(JSON.stringify(result.inventory, null, 2));
          return;
        }
        defaultRuntime.log(`Inventory: ${result.inventory.manifestPath}`);
        defaultRuntime.log(`Voice ready: ${result.inventory.voice.ready}`);
        defaultRuntime.log(`Enabled plugins: ${result.inventory.summary.enabledPlugins}`);
        defaultRuntime.log(`Installed skills: ${result.inventory.summary.installedSkills}`);
      });
    });

  capabilities
    .command("bootstrap")
    .description("Provision the base capability pack for the local workspace")
    .option("--workspace <path>", "Workspace directory")
    .option("--no-auto-install", "Do not auto-install runtime adapters")
    .option("--json", "Output JSON", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const plan = await ensureBaseCapabilityPack({
          workspaceDir: opts.workspace ? String(opts.workspace) : resolveWorkspaceForDefaultAgent(),
          autoInstall: opts.autoInstall !== false,
        });
        if (Boolean(opts.json)) {
          defaultRuntime.log(JSON.stringify(plan, null, 2));
          return;
        }
        for (const line of formatPlan(plan)) {
          defaultRuntime.log(line);
        }
      });
    });

  capabilities
    .command("plan <objective...>")
    .description("Infer and provision capabilities for a mission objective")
    .option("--workspace <path>", "Workspace directory")
    .option("--no-auto-install", "Do not auto-install runtime adapters")
    .option("--json", "Output JSON", false)
    .action(async (objectiveParts, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const objective = Array.isArray(objectiveParts)
          ? objectiveParts.join(" ").trim()
          : String(objectiveParts);
        const plan = await ensureCapabilitiesForObjective({
          objective,
          workspaceDir: opts.workspace ? String(opts.workspace) : resolveWorkspaceForDefaultAgent(),
          autoInstall: opts.autoInstall !== false,
        });
        if (Boolean(opts.json)) {
          defaultRuntime.log(JSON.stringify(plan, null, 2));
          return;
        }
        for (const line of formatPlan(plan)) {
          defaultRuntime.log(line);
        }
      });
    });
}
