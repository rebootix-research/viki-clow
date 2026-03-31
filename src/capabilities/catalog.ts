import { createHash } from "node:crypto";
import type { CapabilityId, CapabilitySpec } from "./types.js";

export const CAPABILITY_SPECS: Record<CapabilityId, CapabilitySpec> = {
  git: {
    id: "git",
    label: "Git",
    kind: "core_tool",
    summary: "Repository history, cloning, branching, and patch application.",
    objectiveHints: ["git", "repo", "branch", "commit", "pull request"],
    source: {
      kind: "binary",
      command: "git",
      args: ["--version"],
      notes: "Local git binary used for repository discovery and patch application.",
    },
  },
  node: {
    id: "node",
    label: "Node.js",
    kind: "core_tool",
    summary: "JavaScript and TypeScript runtime execution.",
    objectiveHints: ["node", "typescript", "javascript", "npm", "pnpm"],
    source: {
      kind: "binary",
      command: "node",
      args: ["--version"],
      notes: "Local Node.js runtime used for CLI and workspace execution.",
    },
  },
  python: {
    id: "python",
    label: "Python",
    kind: "core_tool",
    summary: "Python-based automation, OCR, and model helpers.",
    objectiveHints: ["python", "ocr", "notebook", "whisper"],
    source: {
      kind: "binary",
      command: "python",
      args: ["--version"],
      notes: "Local Python runtime used for automation, OCR, and helper scripts.",
    },
  },
  ffmpeg: {
    id: "ffmpeg",
    label: "FFmpeg",
    kind: "downloadable_asset",
    summary: "Audio/video conversion for media and voice pipelines.",
    objectiveHints: ["audio", "video", "media", "voice", "transcribe"],
    source: {
      kind: "binary",
      command: "ffmpeg",
      args: ["--version"],
      notes: "Media tool used for voice and video workflows.",
    },
  },
  playwright: {
    id: "playwright",
    label: "Playwright Browsers",
    kind: "runtime_adapter",
    summary: "Deterministic browser automation, screenshots, and traces.",
    objectiveHints: ["browser", "web", "playwright", "trace", "publish", "upload"],
    installLabel: "corepack pnpm exec playwright install chromium",
    source: {
      kind: "runtime_adapter",
      command: "corepack",
      args: ["pnpm", "exec", "playwright", "--version"],
      installLabel: "corepack pnpm exec playwright install chromium",
      notes: "Managed browser automation runtime and its installable Chromium bundle.",
    },
  },
  browser_profiles: {
    id: "browser_profiles",
    label: "Viki Browser Profiles",
    kind: "runtime_adapter",
    summary: "Managed mission browser profiles and evidence directories.",
    objectiveHints: ["browser", "web", "session", "cookies", "profile"],
    source: {
      kind: "workspace_artifact",
      path: ".vikiclow/browser",
      create: true,
      notes: "Workspace-scoped browser profiles, traces, and evidence directories.",
    },
  },
  generated_skill: {
    id: "generated_skill",
    label: "Generated Local Skill",
    kind: "generated_local_skill",
    summary: "A local skill generated from mission intent and stored in the workspace.",
    objectiveHints: ["skill", "workflow", "automation", "adapter"],
    source: {
      kind: "generated_skill",
      path: "skills/generated-<objective>/SKILL.md",
      create: true,
      notes: "A generated mission skill written into the active workspace.",
    },
  },
};

export const CAPABILITY_CATALOG = Object.values(CAPABILITY_SPECS);
export const CAPABILITY_CATALOG_REVISION = createHash("sha256")
  .update(
    JSON.stringify(
      CAPABILITY_CATALOG.map((entry) => ({
        id: entry.id,
        label: entry.label,
        kind: entry.kind,
        summary: entry.summary,
        objectiveHints: entry.objectiveHints,
        source: entry.source,
      })),
    ),
  )
  .digest("hex")
  .slice(0, 12);

export function getCapabilitySpec(id: CapabilityId): CapabilitySpec {
  return CAPABILITY_SPECS[id];
}

export function normalizeCapabilityObjective(objective: string): string {
  return objective.trim().toLowerCase();
}

export function buildCapabilityRouting(objective: string): Array<{
  id: CapabilityId;
  matchedHints: string[];
}> {
  const normalized = normalizeCapabilityObjective(objective);
  return CAPABILITY_CATALOG
    .map((spec) => ({
      id: spec.id,
      matchedHints: spec.objectiveHints.filter((hint) => normalized.includes(hint)),
    }))
    .filter((entry) => entry.matchedHints.length > 0)
    .toSorted((left, right) => {
      if (right.matchedHints.length !== left.matchedHints.length) {
        return right.matchedHints.length - left.matchedHints.length;
      }
      return left.id.localeCompare(right.id);
    });
}

export function inferCapabilityIdsForObjective(objective: string): CapabilityId[] {
  return buildCapabilityRouting(objective).map((entry) => entry.id);
}
