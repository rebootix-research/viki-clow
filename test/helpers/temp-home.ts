import fs from "node:fs/promises";
import path from "node:path";
import { createTempHomeEnv } from "../../src/test-utils/temp-home.js";

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
  const tempHome = await createTempHomeEnv(prefix);
  const home = tempHome.home;
  const defaultEnv = {
    XDG_CONFIG_HOME: path.join(home, ".config"),
    XDG_DATA_HOME: path.join(home, ".local", "share"),
    XDG_CACHE_HOME: path.join(home, ".cache"),
  } satisfies Record<string, string>;
  const previousEnv = new Map<string, string | undefined>();
  try {
    await Promise.all(
      Object.values(defaultEnv).map(async (dir) => await fs.mkdir(dir, { recursive: true })),
    );

    for (const [key, value] of Object.entries(defaultEnv)) {
      previousEnv.set(key, process.env[key]);
      process.env[key] = value;
    }

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
    await tempHome.restore();
  }
}
