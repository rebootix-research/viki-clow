import fs from "node:fs/promises";
import path from "node:path";
import { runExec } from "../process/exec.js";
import { CAPABILITY_SPECS, inferCapabilityIdsForObjective } from "./catalog.js";
import { upsertCapabilityRecords } from "./store.js";
import type { CapabilityId, CapabilityPlan, CapabilityRecord } from "./types.js";

const BASE_CAPABILITY_PACK: CapabilityId[] = [
  "git",
  "node",
  "python",
  "ffmpeg",
  "playwright",
  "browser_profiles",
];

type EnsureCapabilityParams = {
  workspaceDir?: string;
  objective: string;
  autoInstall: boolean;
};

async function checkCommand(
  command: string,
  args: string[] = ["--version"],
): Promise<{ ok: boolean; details?: string }> {
  try {
    const { stdout, stderr } = await runExec(command, args, { timeoutMs: 20_000 });
    const firstLine = `${stdout}\n${stderr}`
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find(Boolean);
    return { ok: true, details: firstLine };
  } catch (error) {
    return {
      ok: false,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

function makeRecord(
  id: CapabilityId,
  status: CapabilityRecord["status"],
  details?: string,
): CapabilityRecord {
  const spec = CAPABILITY_SPECS[id];
  return {
    id,
    label: spec.label,
    kind: spec.kind,
    status,
    checkedAt: new Date().toISOString(),
    details,
  };
}

async function ensureCoreCommandCapability(
  id: Extract<CapabilityId, "git" | "node" | "python" | "ffmpeg">,
  command: string,
): Promise<CapabilityRecord> {
  const result = await checkCommand(command);
  return makeRecord(id, result.ok ? "ready" : "missing", result.details);
}

async function ensurePlaywrightCapability(autoInstall: boolean): Promise<CapabilityRecord> {
  const existing = await checkCommand("corepack", ["pnpm", "exec", "playwright", "--version"]);
  if (existing.ok) {
    return makeRecord("playwright", "ready", existing.details);
  }
  if (!autoInstall) {
    return makeRecord(
      "playwright",
      "missing",
      existing.details ?? CAPABILITY_SPECS.playwright.installLabel,
    );
  }
  try {
    await runExec("corepack", ["pnpm", "exec", "playwright", "install", "chromium"], {
      timeoutMs: 300_000,
    });
  } catch (error) {
    return makeRecord(
      "playwright",
      "failed",
      error instanceof Error ? error.message : String(error),
    );
  }
  const recheck = await checkCommand("corepack", ["pnpm", "exec", "playwright", "--version"]);
  return makeRecord(
    "playwright",
    recheck.ok ? "provisioned" : "failed",
    recheck.details ?? CAPABILITY_SPECS.playwright.installLabel,
  );
}

async function ensureBrowserProfilesCapability(
  workspaceDir: string | undefined,
): Promise<CapabilityRecord> {
  if (!workspaceDir?.trim()) {
    return makeRecord("browser_profiles", "failed", "workspace directory required");
  }
  const baseDir = path.join(workspaceDir, ".vikiclow", "browser");
  const profileDir = path.join(baseDir, "profiles", "mission-default");
  const evidenceDir = path.join(baseDir, "evidence");
  const traceDir = path.join(baseDir, "traces");
  await fs.mkdir(profileDir, { recursive: true });
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.mkdir(traceDir, { recursive: true });
  const markerPath = path.join(baseDir, "README.txt");
  await fs.writeFile(
    markerPath,
    [
      "Viki Browser mission profiles",
      "",
      `profile=${profileDir}`,
      `evidence=${evidenceDir}`,
      `traces=${traceDir}`,
      "",
      "Created by capability bootstrap for durable browser missions.",
      "",
    ].join("\n"),
    "utf8",
  );
  return makeRecord(
    "browser_profiles",
    "provisioned",
    [profileDir, evidenceDir, traceDir].join(" | "),
  );
}

function slugifyObjective(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureGeneratedSkillCapability(
  workspaceDir: string | undefined,
  objective: string,
): Promise<CapabilityRecord> {
  if (!workspaceDir?.trim()) {
    return makeRecord("generated_skill", "failed", "workspace directory required");
  }
  const slug = slugifyObjective(objective) || "generated-skill";
  const skillDir = path.join(workspaceDir, "skills", `generated-${slug}`);
  const skillPath = path.join(skillDir, "SKILL.md");
  await fs.mkdir(skillDir, { recursive: true });
  const contents = [
    `# Generated Mission Skill`,
    "",
    "## Purpose",
    `Provide reusable execution guidance for this mission objective: ${objective.trim()}`,
    "",
    "## Workflow",
    "- Restate the concrete deliverable in one sentence.",
    "- Prefer real execution over planning-only replies.",
    "- Capture evidence paths, commands, and artifacts as the work proceeds.",
    "- If a capability is missing, provision it or route to the nearest working fallback.",
    "- Finish with a terminal result, not a partial handoff.",
    "",
    "## Output",
    "- Completed deliverable or exact blocker",
    "- Commands run",
    "- Artifact paths",
    "",
  ].join("\n");
  await fs.writeFile(skillPath, contents, "utf8");
  return makeRecord("generated_skill", "provisioned", skillPath);
}

async function ensureCapability(
  id: CapabilityId,
  params: EnsureCapabilityParams,
): Promise<CapabilityRecord> {
  switch (id) {
    case "git":
      return await ensureCoreCommandCapability("git", "git");
    case "node":
      return await ensureCoreCommandCapability("node", "node");
    case "python":
      return await ensureCoreCommandCapability("python", "python");
    case "ffmpeg":
      return await ensureCoreCommandCapability("ffmpeg", "ffmpeg");
    case "playwright":
      return await ensurePlaywrightCapability(params.autoInstall);
    case "browser_profiles":
      return await ensureBrowserProfilesCapability(params.workspaceDir);
    case "generated_skill":
      return await ensureGeneratedSkillCapability(params.workspaceDir, params.objective);
    default: {
      const exhaustive: never = id;
      throw new Error(`Unsupported capability: ${String(exhaustive)}`);
    }
  }
}

function sortRecords(records: CapabilityRecord[]): CapabilityRecord[] {
  return records.toSorted((left, right) => left.label.localeCompare(right.label));
}

function buildPlan(
  objective: string,
  inferred: CapabilityId[],
  records: CapabilityRecord[],
): CapabilityPlan {
  const ready = sortRecords(records.filter((record) => record.status === "ready"));
  const provisioned = sortRecords(records.filter((record) => record.status === "provisioned"));
  const missing = sortRecords(records.filter((record) => record.status === "missing"));
  const failed = sortRecords(records.filter((record) => record.status === "failed"));
  const generatedSkillRecord = records.find((record) => record.id === "generated_skill");
  return {
    objective,
    inferred,
    ready,
    provisioned,
    missing,
    failed,
    generatedSkillPath:
      generatedSkillRecord?.details && generatedSkillRecord.status !== "missing"
        ? generatedSkillRecord.details
        : undefined,
  };
}

export async function ensureCapabilitiesForObjective(params: {
  objective: string;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  autoInstall?: boolean;
}): Promise<CapabilityPlan> {
  const objective = params.objective.trim();
  const inferred = inferCapabilityIdsForObjective(objective);
  if (inferred.includes("playwright")) {
    inferred.push("browser_profiles");
  }
  if (/\bskill\b|\bworkflow\b|\bautomation\b|\badapter\b/i.test(objective)) {
    inferred.push("generated_skill");
  }
  const unique = Array.from(new Set(inferred));
  const records = await Promise.all(
    unique.map((id) =>
      ensureCapability(id, {
        workspaceDir: params.workspaceDir,
        objective,
        autoInstall: params.autoInstall !== false,
      }),
    ),
  );
  await upsertCapabilityRecords(records, params.env);
  return buildPlan(objective, unique, records);
}

export async function ensureBaseCapabilityPack(params: {
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  autoInstall?: boolean;
}): Promise<CapabilityPlan> {
  const objective = "Base capability bootstrap for browser, repo, voice, and automation execution";
  const records = await Promise.all(
    BASE_CAPABILITY_PACK.map((id) =>
      ensureCapability(id, {
        workspaceDir: params.workspaceDir,
        objective,
        autoInstall: params.autoInstall !== false,
      }),
    ),
  );
  await upsertCapabilityRecords(records, params.env);
  return buildPlan(objective, [...BASE_CAPABILITY_PACK], records);
}
