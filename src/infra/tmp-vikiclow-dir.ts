import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const POSIX_VIKICLOW_TMP_DIR = "/tmp/vikiclow";
const FS_CONSTANTS = fs.constants ?? { W_OK: 2, X_OK: 1 };
const TMP_DIR_ACCESS_MODE = FS_CONSTANTS.W_OK | FS_CONSTANTS.X_OK;

type ResolvePreferredVikiClowTmpDirOptions = {
  accessSync?: (path: string, mode?: number) => void;
  chmodSync?: (path: string, mode: number) => void;
  lstatSync?: (path: string) => {
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    mode?: number;
    uid?: number;
  };
  mkdirSync?: (path: string, opts: { recursive: boolean; mode?: number }) => void;
  getuid?: () => number | undefined;
  tmpdir?: () => string;
  warn?: (message: string) => void;
};

type MaybeNodeError = { code?: string };

function isNodeErrorWithCode(err: unknown, code: string): err is MaybeNodeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as MaybeNodeError).code === code
  );
}

export function resolvePreferredVikiClowTmpDir(
  options: ResolvePreferredVikiClowTmpDirOptions = {},
): string {
  const accessSync = options.accessSync ?? fs.accessSync;
  const chmodSync = options.chmodSync ?? fs.chmodSync;
  const lstatSync = options.lstatSync ?? fs.lstatSync;
  const mkdirSync = options.mkdirSync ?? fs.mkdirSync;
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const getuid =
    options.getuid ??
    (() => {
      try {
        return typeof process.getuid === "function" ? process.getuid() : undefined;
      } catch {
        return undefined;
      }
    });
  const tmpdir = options.tmpdir ?? os.tmpdir;
  const uid = getuid();

  const isSecureDirForUser = (st: { mode?: number; uid?: number }): boolean => {
    if (process.platform === "win32") {
      // Windows ACL semantics do not map cleanly onto POSIX mode/uid checks, and
      // the temp-dir probe is only used as a best-effort safety guard. Treat a
      // Windows fallback directory as secure once we have confirmed it is not a
      // symlink and can be accessed/created.
      return true;
    }
    if (uid === undefined) {
      return true;
    }
    if (typeof st.uid === "number" && st.uid !== uid) {
      return false;
    }
    // Avoid group/other writable dirs when running on multi-user hosts.
    if (typeof st.mode === "number" && (st.mode & 0o022) !== 0) {
      return false;
    }
    return true;
  };

  const fallback = (): string => {
    const base = tmpdir();
    const suffix = uid === undefined ? "vikiclow" : `vikiclow-${uid}`;
    return path.join(base, suffix);
  };

  const isTrustedTmpDir = (st: {
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    mode?: number;
    uid?: number;
  }): boolean => {
    return st.isDirectory() && !st.isSymbolicLink() && isSecureDirForUser(st);
  };

  const resolveDirState = (candidatePath: string): "available" | "missing" | "invalid" => {
    try {
      const candidate = lstatSync(candidatePath);
      if (!isTrustedTmpDir(candidate)) {
        return "invalid";
      }
      accessSync(candidatePath, TMP_DIR_ACCESS_MODE);
      return "available";
    } catch (err) {
      if (isNodeErrorWithCode(err, "ENOENT")) {
        return "missing";
      }
      return "invalid";
    }
  };

  const tryRepairWritableBits = (candidatePath: string): boolean => {
    try {
      const st = lstatSync(candidatePath);
      if (!st.isDirectory() || st.isSymbolicLink()) {
        return false;
      }
      if (uid !== undefined && typeof st.uid === "number" && st.uid !== uid) {
        return false;
      }
      if (typeof st.mode !== "number" || (st.mode & 0o022) === 0) {
        return false;
      }
      chmodSync(candidatePath, 0o700);
      warn(`[vikiclow] tightened permissions on temp dir: ${candidatePath}`);
      return resolveDirState(candidatePath) === "available";
    } catch {
      return false;
    }
  };

  const ensureTrustedFallbackDir = (): string => {
    const fallbackPath = fallback();
    const state = resolveDirState(fallbackPath);
    if (state === "available") {
      return fallbackPath;
    }
    if (process.platform === "win32") {
      try {
        mkdirSync(fallbackPath, { recursive: true, mode: 0o700 });
        chmodSync(fallbackPath, 0o700);
      } catch {
        // Best-effort on Windows: if the path exists and is not a symlink, let
        // callers proceed rather than fail startup on POSIX-style permission
        // semantics that do not exist there.
      }
      return fallbackPath;
    }
    if (state === "invalid") {
      if (tryRepairWritableBits(fallbackPath)) {
        return fallbackPath;
      }
      throw new Error(`Unsafe fallback VikiClow temp dir: ${fallbackPath}`);
    }
    try {
      mkdirSync(fallbackPath, { recursive: true, mode: 0o700 });
      chmodSync(fallbackPath, 0o700);
    } catch {
      throw new Error(`Unable to create fallback VikiClow temp dir: ${fallbackPath}`);
    }
    if (resolveDirState(fallbackPath) !== "available" && !tryRepairWritableBits(fallbackPath)) {
      throw new Error(`Unsafe fallback VikiClow temp dir: ${fallbackPath}`);
    }
    return fallbackPath;
  };

  const existingPreferredState = resolveDirState(POSIX_VIKICLOW_TMP_DIR);
  if (existingPreferredState === "available") {
    return POSIX_VIKICLOW_TMP_DIR;
  }
  if (existingPreferredState === "invalid") {
    if (tryRepairWritableBits(POSIX_VIKICLOW_TMP_DIR)) {
      return POSIX_VIKICLOW_TMP_DIR;
    }
    return ensureTrustedFallbackDir();
  }

  try {
    accessSync("/tmp", TMP_DIR_ACCESS_MODE);
    // Create with a safe default; subsequent callers expect it exists.
    mkdirSync(POSIX_VIKICLOW_TMP_DIR, { recursive: true, mode: 0o700 });
    chmodSync(POSIX_VIKICLOW_TMP_DIR, 0o700);
    if (
      resolveDirState(POSIX_VIKICLOW_TMP_DIR) !== "available" &&
      !tryRepairWritableBits(POSIX_VIKICLOW_TMP_DIR)
    ) {
      return ensureTrustedFallbackDir();
    }
    return POSIX_VIKICLOW_TMP_DIR;
  } catch {
    return ensureTrustedFallbackDir();
  }
}
