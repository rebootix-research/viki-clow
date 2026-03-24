import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import type { CapabilityRecord } from "./types.js";

type CapabilityManifest = {
  version: 1;
  records: CapabilityRecord[];
};

function resolveManifestPath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "capabilities", "manifest.json");
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, filePath);
}

export async function loadCapabilityManifest(
  env: NodeJS.ProcessEnv = process.env,
): Promise<CapabilityManifest> {
  const manifestPath = resolveManifestPath(env);
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as CapabilityManifest;
    if (parsed.version === 1 && Array.isArray(parsed.records)) {
      return parsed;
    }
  } catch {}
  return { version: 1, records: [] };
}

export async function saveCapabilityRecords(
  records: CapabilityRecord[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const manifestPath = resolveManifestPath(env);
  await writeJsonAtomic(manifestPath, { version: 1, records } satisfies CapabilityManifest);
  return manifestPath;
}

export async function upsertCapabilityRecords(
  records: CapabilityRecord[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  const manifest = await loadCapabilityManifest(env);
  const next = new Map(manifest.records.map((record) => [record.id, record] as const));
  for (const record of records) {
    next.set(record.id, record);
  }
  return await saveCapabilityRecords(Array.from(next.values()), env);
}
