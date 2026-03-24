import type { CapabilityId, CapabilitySpec } from "./types.js";

export const CAPABILITY_SPECS: Record<CapabilityId, CapabilitySpec> = {
  git: {
    id: "git",
    label: "Git",
    kind: "core_tool",
    summary: "Repository history, cloning, branching, and patch application.",
    objectiveHints: ["git", "repo", "branch", "commit", "pull request"],
  },
  node: {
    id: "node",
    label: "Node.js",
    kind: "core_tool",
    summary: "JavaScript and TypeScript runtime execution.",
    objectiveHints: ["node", "typescript", "javascript", "npm", "pnpm"],
  },
  python: {
    id: "python",
    label: "Python",
    kind: "core_tool",
    summary: "Python-based automation, OCR, and model helpers.",
    objectiveHints: ["python", "ocr", "notebook", "whisper"],
  },
  ffmpeg: {
    id: "ffmpeg",
    label: "FFmpeg",
    kind: "downloadable_asset",
    summary: "Audio/video conversion for media and voice pipelines.",
    objectiveHints: ["audio", "video", "media", "voice", "transcribe"],
  },
  playwright: {
    id: "playwright",
    label: "Playwright Browsers",
    kind: "runtime_adapter",
    summary: "Deterministic browser automation, screenshots, and traces.",
    objectiveHints: ["browser", "web", "playwright", "trace", "publish", "upload"],
    installLabel: "corepack pnpm exec playwright install chromium",
  },
  browser_profiles: {
    id: "browser_profiles",
    label: "Viki Browser Profiles",
    kind: "runtime_adapter",
    summary: "Managed mission browser profiles and evidence directories.",
    objectiveHints: ["browser", "web", "session", "cookies", "profile"],
  },
  generated_skill: {
    id: "generated_skill",
    label: "Generated Local Skill",
    kind: "generated_local_skill",
    summary: "A local skill generated from mission intent and stored in the workspace.",
    objectiveHints: ["skill", "workflow", "automation", "adapter"],
  },
};

export function inferCapabilityIdsForObjective(objective: string): CapabilityId[] {
  const normalized = objective.toLowerCase();
  const ids = Object.values(CAPABILITY_SPECS)
    .filter((spec) => spec.objectiveHints.some((hint) => normalized.includes(hint)))
    .map((spec) => spec.id);
  return Array.from(new Set(ids));
}
