import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type TempHomeOptions = {
  prefix?: string;
  env?: Record<string, string | undefined | ((home: string) => string | undefined)>;
};

export async function withTempHome<T>(
  run: (home: string) => Promise<T> | T,
  options?: TempHomeOptions,
): Promise<T>;
export async function withTempHome<T>(
  prefix: string,
  run: (home: string) => Promise<T> | T,
): Promise<T>;
export async function withTempHome<T>(
  first: string | ((home: string) => Promise<T> | T),
  second?: TempHomeOptions | ((home: string) => Promise<T> | T),
): Promise<T> {
  const run =
    typeof first === "function" ? first : typeof second === "function" ? second : undefined;
  if (!run) {
    throw new Error("withTempHome requires a callback");
  }
  const options =
    typeof first === "string" ? {} : typeof second === "function" ? {} : (second ?? {});
  const prefix =
    typeof first === "string"
      ? first.trim() || "vikiclow-test-home-"
      : options.prefix?.trim() || "vikiclow-test-home-";
  const home = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const previousEnv = new Map<string, string | undefined>();
  try {
    for (const [key, value] of Object.entries(options.env ?? {})) {
      previousEnv.set(key, process.env[key]);
      const resolved = typeof value === "function" ? value(home) : value;
      if (resolved === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = resolved;
      }
    }
    return await run(home);
  } finally {
    for (const [key, value] of previousEnv.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    await fs.rm(home, { recursive: true, force: true });
  }
}
