import type { Command } from "commander";
import { resolveDefaultAgentId, resolveAgentWorkspaceDir } from "../agents/agent-scope.js";
import {
  bundleSupportedCapabilities,
  discoverCapabilitySources,
  fetchCapabilityRecords,
  inspectCapabilityRegistry,
  ensureBaseCapabilityPack,
  ensureCapabilitiesForObjective,
  loadCapabilityManifest,
} from "../capabilities/index.js";
import { loadConfig } from "../config/config.js";
import { defaultRuntime } from "../runtime.js";
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

function formatDiscovery(discovery: Awaited<ReturnType<typeof discoverCapabilitySources>>): string[] {
  const lines = [`Objective: ${discovery.objective}`];
  lines.push(`Catalog revision: ${discovery.catalogRevision}`);
  lines.push(`Inferred: ${discovery.inferred.join(", ") || "none"}`);
  const sections: Array<[string, typeof discovery.discovered]> = [
    ["Direct", discovery.direct],
    ["Related", discovery.related],
    ["Available", discovery.available],
  ];
  for (const [label, records] of sections) {
    if (records.length === 0) {
      continue;
    }
    lines.push(`${label}:`);
    for (const record of records) {
      const reason = record.matchReasons.length > 0 ? ` :: ${record.matchReasons.join(", ")}` : "";
      lines.push(`- ${record.label} (${record.relevance})${reason}`);
    }
  }
  return lines;
}

type RegistryRecordLine = {
  label: string;
  status: string;
  details?: string;
  source?: { kind?: string };
  objective?: string;
};

function formatRegistryRecords(records: RegistryRecordLine[]): string[] {
  if (records.length === 0) {
    return ["No capability records recorded yet."];
  }
  const lines: string[] = [];
  for (const record of records) {
    const source = record.source?.kind ? ` [${record.source.kind}]` : "";
    const objective = record.objective ? ` :: objective=${record.objective}` : "";
    const details = record.details ? ` :: ${record.details}` : "";
    lines.push(`${record.label}${source}: ${record.status}${objective}${details}`);
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
        if (opts.json) {
          defaultRuntime.log(JSON.stringify(manifest, null, 2));
          return;
        }
        if (manifest.records.length === 0) {
          defaultRuntime.log("No capabilities recorded yet.");
          return;
        }
        defaultRuntime.log(`Catalog revision: ${manifest.catalogRevision}`);
        for (const line of formatRegistryRecords(manifest.records)) {
          defaultRuntime.log(line);
        }
      });
    });

  capabilities
    .command("discover <objective...>")
    .description("Classify the curated capability catalog against a mission objective")
    .option("--json", "Output JSON", false)
    .action(async (objectiveParts, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const objective = Array.isArray(objectiveParts)
          ? objectiveParts.join(" ").trim()
          : String(objectiveParts);
        const discovery = discoverCapabilitySources({ objective });
        if (opts.json) {
          defaultRuntime.log(JSON.stringify(discovery, null, 2));
          return;
        }
        for (const line of formatDiscovery(discovery)) {
          defaultRuntime.log(line);
        }
      });
    });

  capabilities
    .command("fetch [capability...]")
    .description("Inspect and persist selected capability sources")
    .option("--workspace <path>", "Workspace directory")
    .option("--objective <text>", "Objective used to annotate generated capabilities")
    .option("--no-auto-install", "Do not auto-install runtime adapters")
    .option("--json", "Output JSON", false)
    .action(async (capabilityIds, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const ids = Array.isArray(capabilityIds)
          ? capabilityIds.map((id) => String(id).trim()).filter(Boolean)
          : [String(capabilityIds).trim()].filter(Boolean);
        if (ids.length === 0 && !String(opts.objective ?? "").trim()) {
          throw new Error("Provide at least one capability id or an --objective.");
        }
        const objective = String(opts.objective ?? "").trim();
        const selectedIds =
          ids.length > 0
            ? (ids as Parameters<typeof fetchCapabilityRecords>[0]["ids"])
            : discoverCapabilitySources({ objective }).inferred;
        const fetched = await fetchCapabilityRecords({
          ids: selectedIds,
          objective,
          workspaceDir: opts.workspace ? String(opts.workspace) : resolveWorkspaceForDefaultAgent(),
          autoInstall: opts.autoInstall !== false,
          env: process.env,
        });
        if (opts.json) {
          defaultRuntime.log(JSON.stringify(fetched, null, 2));
          return;
        }
        defaultRuntime.log(`Registry: ${fetched.registryPath}`);
        for (const record of fetched.records) {
          defaultRuntime.log(
            `${record.label} (${record.id}): ${record.status}${record.details ? ` :: ${record.details}` : ""}`,
          );
        }
      });
    });

  capabilities
    .command("inspect [capability...]")
    .description("Inspect the persisted capability registry")
    .option("--json", "Output JSON", false)
    .action(async (capabilityIds, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const ids = Array.isArray(capabilityIds)
          ? capabilityIds.map((id) => String(id).trim()).filter(Boolean)
          : [String(capabilityIds).trim()].filter(Boolean);
        const inspection = await inspectCapabilityRegistry({
          ids: ids.length > 0 ? (ids as Parameters<typeof inspectCapabilityRegistry>[0]["ids"]) : undefined,
        });
        if (opts.json) {
          defaultRuntime.log(JSON.stringify(inspection, null, 2));
          return;
        }
        defaultRuntime.log(`Catalog revision: ${inspection.registry.catalogRevision}`);
        defaultRuntime.log(`Generated at: ${inspection.registry.generatedAt}`);
        for (const line of formatRegistryRecords(inspection.records)) {
          defaultRuntime.log(line);
        }
      });
    });

  capabilities
    .command("bundle")
    .description(
      "Prebundle shipped skills, plugins, voice/runtime surfaces, and capability inventory",
    )
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
        if (opts.json) {
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
        if (opts.json) {
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
        if (opts.json) {
          defaultRuntime.log(JSON.stringify(plan, null, 2));
          return;
        }
        for (const line of formatPlan(plan)) {
          defaultRuntime.log(line);
        }
      });
    });
}
