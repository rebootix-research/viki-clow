import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVikiClowPackageRoot } from "../infra/vikiclow-root.js";
import { pathExists } from "../utils.js";

const FALLBACK_TEMPLATE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/reference/templates",
);

let cachedTemplateDir: string | undefined;
let resolvingTemplateDir: Promise<string> | undefined;

function buildTemplateDirCandidates(opts?: {
  cwd?: string;
  argv1?: string;
  moduleUrl?: string;
}): Promise<string[]> {
  return (async () => {
    const moduleUrl = opts?.moduleUrl ?? import.meta.url;
    const argv1 = opts?.argv1 ?? process.argv[1];
    const cwd = opts?.cwd ?? process.cwd();

    const packageRoot = await resolveVikiClowPackageRoot({ moduleUrl, argv1, cwd });
    return [
      packageRoot ? path.join(packageRoot, "docs", "reference", "templates") : null,
      packageRoot ? path.join(packageRoot, "dist", "docs", "reference", "templates") : null,
      cwd ? path.resolve(cwd, "docs", "reference", "templates") : null,
      cwd ? path.resolve(cwd, "dist", "docs", "reference", "templates") : null,
      FALLBACK_TEMPLATE_DIR,
    ].filter(Boolean) as string[];
  })();
}

export async function resolveWorkspaceTemplateDir(opts?: {
  cwd?: string;
  argv1?: string;
  moduleUrl?: string;
}): Promise<string> {
  if (cachedTemplateDir) {
    return cachedTemplateDir;
  }
  if (resolvingTemplateDir) {
    return resolvingTemplateDir;
  }

  resolvingTemplateDir = (async () => {
    const candidates = await buildTemplateDirCandidates(opts);

    for (const candidate of candidates) {
      if (await pathExists(candidate)) {
        cachedTemplateDir = candidate;
        return candidate;
      }
    }

    cachedTemplateDir = candidates[0] ?? FALLBACK_TEMPLATE_DIR;
    return cachedTemplateDir;
  })();

  try {
    return await resolvingTemplateDir;
  } finally {
    resolvingTemplateDir = undefined;
  }
}

export function resetWorkspaceTemplateDirCache() {
  cachedTemplateDir = undefined;
  resolvingTemplateDir = undefined;
}

export async function resolveWorkspaceTemplatePath(
  name: string,
  opts?: { cwd?: string; argv1?: string; moduleUrl?: string },
): Promise<string> {
  if (cachedTemplateDir) {
    const cachedPath = path.join(cachedTemplateDir, name);
    if (await pathExists(cachedPath)) {
      return cachedPath;
    }
  }

  const candidates = await buildTemplateDirCandidates(opts);
  for (const candidate of candidates) {
    const candidatePath = path.join(candidate, name);
    if (await pathExists(candidatePath)) {
      cachedTemplateDir = candidate;
      return candidatePath;
    }
  }

  const fallbackDir = await resolveWorkspaceTemplateDir(opts);
  return path.join(fallbackDir, name);
}
