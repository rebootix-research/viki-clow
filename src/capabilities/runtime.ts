import fs from "node:fs/promises";
import path from "node:path";
import { runExec } from "../process/exec.js";
import { CAPABILITY_SPECS, buildCapabilityRouting, inferCapabilityIdsForObjective } from "./catalog.js";
import { buildCapabilityFoundryRoutes, refreshCapabilityFoundry } from "./foundry.js";
import { loadCapabilityManifest, upsertCapabilityRecords } from "./store.js";
import type {
  CapabilityId,
  CapabilityPlan,
  CapabilityRecord,
  CapabilityRouteMetadata,
  CapabilityRouteSource,
} from "./types.js";

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
  env?: NodeJS.ProcessEnv;
};

type CapabilityPlanRoute = NonNullable<CapabilityPlan["routing"]>[number];
type CapabilityFoundryPlan = NonNullable<CapabilityPlan["foundry"]>;

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

function buildRouteMetadata(
  params: {
    id: CapabilityId;
    inferred: Set<CapabilityId>;
    objectiveRoutes: Map<CapabilityId, string[]>;
  },
  source: CapabilityRouteSource,
): CapabilityRouteMetadata {
  if (source === "bootstrap") {
    return {
      source,
      matchedHints: [],
    };
  }
  const directMatch = params.objectiveRoutes.get(params.id) ?? [];
  if (directMatch.length > 0) {
    return {
      source,
      matchedHints: directMatch,
    };
  }
  if (params.id === "browser_profiles" && params.inferred.has("playwright")) {
    return {
      source: "derived",
      matchedHints: ["playwright"],
      derivedFrom: ["playwright" as CapabilityId],
    };
  }
  return {
    source,
    matchedHints: [],
  };
}

function attachUsageMetadata(
  record: CapabilityRecord,
  existing: CapabilityRecord | undefined,
  route: CapabilityRouteMetadata,
  objective: string,
  inspectedBy: "bootstrap" | "plan",
): CapabilityRecord {
  return {
    ...record,
    objective,
    matchedHints: route.matchedHints,
    inspectedBy,
    route,
    usageCount: (existing?.usageCount ?? 0) + 1,
  };
}

async function annotateCapabilityRecords(params: {
  objective: string;
  inferred: CapabilityId[];
  records: CapabilityRecord[];
  source: CapabilityRouteSource;
  env?: NodeJS.ProcessEnv;
}): Promise<CapabilityRecord[]> {
  const manifest = await loadCapabilityManifest(params.env);
  const existingById = new Map(manifest.records.map((record) => [record.id, record] as const));
  const objectiveRoutes = new Map(
    buildCapabilityRouting(params.objective).map((entry) => [entry.id, entry.matchedHints] as const),
  );
  const inferred = new Set(params.inferred);
  return params.records.map((record) =>
    attachUsageMetadata(
      record,
      existingById.get(record.id),
      buildRouteMetadata(
        {
          id: record.id,
          inferred,
          objectiveRoutes,
        },
        params.source,
      ),
      params.objective,
      params.source === "bootstrap" ? "bootstrap" : "plan",
    ),
  );
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

async function resolveFoundryPlan(params: {
  objective: string;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<CapabilityFoundryPlan> {
  const workspaceDir = params.workspaceDir?.trim() || process.cwd();
  const refreshed = await refreshCapabilityFoundry({
    workspaceDir,
    rootDir: process.cwd(),
    env: params.env,
    includeRemote: false,
  });
  const routes = await buildCapabilityFoundryRoutes({
    objective: params.objective,
    workspaceDir,
    rootDir: process.cwd(),
    env: params.env,
    limit: 8,
  });
  return {
    registryPath: refreshed.registryPath,
    discovered: refreshed.discovered,
    promoted: refreshed.promoted.length,
    bundled: refreshed.bundled.length,
    rejected: refreshed.rejected,
    routes: routes.routes,
  };
}

function buildPlan(
  objective: string,
  inferred: CapabilityId[],
  records: CapabilityRecord[],
  foundry?: CapabilityFoundryPlan,
): CapabilityPlan {
  const ready = sortRecords(records.filter((record) => record.status === "ready"));
  const provisioned = sortRecords(records.filter((record) => record.status === "provisioned"));
  const missing = sortRecords(records.filter((record) => record.status === "missing"));
  const failed = sortRecords(records.filter((record) => record.status === "failed"));
  const generatedSkillRecord = records.find((record) => record.id === "generated_skill");
  const routing: CapabilityPlanRoute[] = [];
  for (const record of records) {
    if (!record.route) {
      continue;
    }
    routing.push({
      id: record.id,
      matchedHints: record.route.matchedHints,
      source: record.route.source,
      usageCount: record.usageCount ?? 0,
      ...(record.route.derivedFrom ? { derivedFrom: record.route.derivedFrom } : {}),
    } as CapabilityPlanRoute);
  }
  return {
    objective,
    inferred,
    ready,
    provisioned,
    missing,
    failed,
    routing,
    foundry,
    generatedSkillPath:
      generatedSkillRecord?.details && generatedSkillRecord.status !== "missing"
        ? generatedSkillRecord.details
        : undefined,
  };
}

export function formatCapabilityPlanLines(plan: CapabilityPlan): string[] {
  const lines = [`Objective: ${plan.objective}`];
  if (plan.inferred.length > 0) {
    lines.push(`Inferred: ${plan.inferred.join(", ")}`);
  }
  const sections: Array<[string, CapabilityRecord[]]> = [
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
  if (plan.routing && plan.routing.length > 0) {
    lines.push("Routing:");
    for (const route of plan.routing) {
      const hints = route.matchedHints.length > 0 ? ` hints=${route.matchedHints.join(",")}` : "";
      const derivedFrom =
        route.derivedFrom && route.derivedFrom.length > 0
          ? ` derivedFrom=${route.derivedFrom.join(",")}`
          : "";
      lines.push(
        `- ${route.id} :: source=${route.source}${derivedFrom}${hints} :: usage=${route.usageCount}`,
      );
    }
  }
  if (plan.foundry) {
    lines.push(
      `Foundry: discovered=${plan.foundry.discovered} promoted=${plan.foundry.promoted} bundled=${plan.foundry.bundled} rejected=${plan.foundry.rejected}`,
    );
    if (plan.foundry.routes.length > 0) {
      lines.push("Foundry routes:");
      for (const route of plan.foundry.routes) {
        const reasons = route.reasons.length > 0 ? route.reasons.join(",") : "none";
        lines.push(
          `- ${route.candidateId} :: ${route.type} :: ${route.scope}/${route.state} :: score=${route.score} :: reasons=${reasons}`,
        );
      }
    }
  }
  if (plan.generatedSkillPath) {
    lines.push(`Generated skill: ${plan.generatedSkillPath}`);
  }
  return lines;
}

export function summarizeCapabilityPlan(plan: CapabilityPlan): string {
  const routeSummary =
    plan.routing && plan.routing.length > 0
      ? plan.routing
          .map((route) => {
            const hints = route.matchedHints.length > 0 ? route.matchedHints.join(",") : "none";
            const derivedFrom =
              route.derivedFrom && route.derivedFrom.length > 0
                ? ` derivedFrom=${route.derivedFrom.join(",")}`
                : "";
            return `${route.id}:${route.source}${derivedFrom}:${hints}#${route.usageCount}`;
          })
          .join(" | ")
      : "";
  const foundrySummary = plan.foundry
    ? [
        `foundry=${plan.foundry.discovered}/${plan.foundry.promoted}/${plan.foundry.bundled}/${plan.foundry.rejected}`,
        plan.foundry.routes.length > 0
          ? `foundry-routes=${plan.foundry.routes
              .map((route) => `${route.candidateId}:${route.score}`)
              .join(",")}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : "";
  const statusSummary = [
    plan.ready.length > 0 ? `ready=${plan.ready.map((record) => record.id).join(",")}` : "",
    plan.provisioned.length > 0
      ? `provisioned=${plan.provisioned.map((record) => record.id).join(",")}`
      : "",
    plan.missing.length > 0 ? `missing=${plan.missing.map((record) => record.id).join(",")}` : "",
    plan.failed.length > 0 ? `failed=${plan.failed.map((record) => record.id).join(",")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  return [
    statusSummary,
    routeSummary,
    foundrySummary,
    plan.generatedSkillPath ? `skill=${plan.generatedSkillPath}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
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
  const annotated = await annotateCapabilityRecords({
    objective,
    inferred: unique,
    records,
    source: "objective",
    env: params.env,
  });
  await upsertCapabilityRecords(annotated, params.env);
  const foundry = await resolveFoundryPlan({
    objective,
    workspaceDir: params.workspaceDir,
    env: params.env,
  });
  return buildPlan(objective, unique, annotated, foundry);
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
  const annotated = await annotateCapabilityRecords({
    objective,
    inferred: [...BASE_CAPABILITY_PACK],
    records,
    source: "bootstrap",
    env: params.env,
  });
  await upsertCapabilityRecords(annotated, params.env);
  const foundry = await resolveFoundryPlan({
    objective,
    workspaceDir: params.workspaceDir,
    env: params.env,
  });
  return buildPlan(objective, [...BASE_CAPABILITY_PACK], annotated, foundry);
}
