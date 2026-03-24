import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import type { EvolutionCandidate, EvolutionExperiment, EvolutionPromotion } from "./types.js";

function resolveEvolutionDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "evolution");
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<string> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
  return filePath;
}

async function readJsonDir<T>(dirPath: string): Promise<T[]> {
  try {
    const entries = await fs.readdir(dirPath);
    const items = await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".json"))
        .map(async (entry) => JSON.parse(await fs.readFile(path.join(dirPath, entry), "utf8")) as T),
    );
    return items;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function resolveEvolutionPaths(env: NodeJS.ProcessEnv = process.env) {
  const baseDir = resolveEvolutionDir(env);
  return {
    baseDir,
    candidatesDir: path.join(baseDir, "candidates"),
    experimentsDir: path.join(baseDir, "experiments"),
    promotionsDir: path.join(baseDir, "promotions"),
  };
}

export async function saveEvolutionCandidate(
  candidate: EvolutionCandidate,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const { candidatesDir } = resolveEvolutionPaths(env);
  return await writeJsonAtomic(path.join(candidatesDir, `${candidate.id}.json`), candidate);
}

export async function saveEvolutionExperiment(
  experiment: EvolutionExperiment,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const { experimentsDir } = resolveEvolutionPaths(env);
  return await writeJsonAtomic(path.join(experimentsDir, `${experiment.id}.json`), experiment);
}

export async function saveEvolutionPromotion(
  promotion: EvolutionPromotion,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const { promotionsDir } = resolveEvolutionPaths(env);
  return await writeJsonAtomic(path.join(promotionsDir, `${promotion.id}.json`), promotion);
}

export async function listEvolutionCandidates(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EvolutionCandidate[]> {
  const { candidatesDir } = resolveEvolutionPaths(env);
  return (await readJsonDir<EvolutionCandidate>(candidatesDir)).sort((left, right) =>
    right.receivedAt.localeCompare(left.receivedAt),
  );
}

export async function listEvolutionExperiments(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EvolutionExperiment[]> {
  const { experimentsDir } = resolveEvolutionPaths(env);
  return (await readJsonDir<EvolutionExperiment>(experimentsDir)).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export async function listEvolutionPromotions(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EvolutionPromotion[]> {
  const { promotionsDir } = resolveEvolutionPaths(env);
  return (await readJsonDir<EvolutionPromotion>(promotionsDir)).sort((left, right) =>
    (right.promotedAt ?? right.rolledBackAt ?? "").localeCompare(
      left.promotedAt ?? left.rolledBackAt ?? "",
    ),
  );
}
