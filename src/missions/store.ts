import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import type { MissionRecord } from "./types.js";

const writeQueues = new Map<string, Promise<void>>();

export function resolveMissionsDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveStateDir(env), "missions");
}

export function resolveMissionPath(id: string, env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveMissionsDir(env), `${id}.json`);
}

async function writeFileAtomic(pathname: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(pathname), { recursive: true });
  const tempPath = `${pathname}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, contents, "utf8");
  await fs.rename(tempPath, pathname);
}

export async function saveMissionRecord(
  record: MissionRecord,
  env: NodeJS.ProcessEnv = process.env,
): Promise<MissionRecord> {
  const pathname = resolveMissionPath(record.id, env);
  const current = writeQueues.get(record.id) ?? Promise.resolve();
  const next = current.then(async () => {
    await writeFileAtomic(pathname, `${JSON.stringify(record, null, 2)}\n`);
  });
  writeQueues.set(
    record.id,
    next.catch(() => {}),
  );
  await next;
  return record;
}

export async function loadMissionRecord(
  id: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<MissionRecord | null> {
  const pathname = resolveMissionPath(id, env);
  try {
    const raw = await fs.readFile(pathname, "utf8");
    return JSON.parse(raw) as MissionRecord;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function listMissionRecords(
  env: NodeJS.ProcessEnv = process.env,
): Promise<MissionRecord[]> {
  const dir = resolveMissionsDir(env);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const records = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .map(async (entry) => {
        const raw = await fs.readFile(path.join(dir, entry), "utf8");
        return JSON.parse(raw) as MissionRecord;
      }),
  );
  return records.toSorted((left, right) => right.updatedAt - left.updatedAt);
}
