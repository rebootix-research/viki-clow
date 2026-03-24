import { spawn } from "node:child_process";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import type { VikiClowPluginApi } from "vikiclow/plugin-sdk/lobster";
import { resolveWindowsLobsterSpawn } from "./windows-spawn.js";

type LobsterEnvelope =
  | {
      ok: true;
      status: "ok" | "needs_approval" | "cancelled";
      output: unknown[];
      requiresApproval: null | {
        type: "approval_request";
        prompt: string;
        items: unknown[];
        resumeToken?: string;
      };
    }
  | {
      ok: false;
      error: { type?: string; message: string };
    };

function resolveWorkflowExecutable(): string {
  const preferred = process.env.VIKICLOW_WORKFLOW_BIN?.trim();
  if (preferred) {
    return preferred;
  }
  return process.platform === "win32" ? "viki-workflow.cmd" : "viki-workflow";
}

function normalizeForCwdSandbox(p: string): string {
  const normalized = path.normalize(p);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function resolveCwd(cwdRaw: unknown): string {
  if (typeof cwdRaw !== "string" || !cwdRaw.trim()) {
    return process.cwd();
  }
  const cwd = cwdRaw.trim();
  if (path.isAbsolute(cwd)) {
    throw new Error("cwd must be a relative path");
  }
  const base = process.cwd();
  const resolved = path.resolve(base, cwd);

  const rel = path.relative(normalizeForCwdSandbox(base), normalizeForCwdSandbox(resolved));
  if (rel === "" || rel === ".") {
    return resolved;
  }
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("cwd must stay within the gateway working directory");
  }
  return resolved;
}

async function runLobsterSubprocessOnce(params: {
  execPath: string;
  argv: string[];
  cwd: string;
  timeoutMs: number;
  maxStdoutBytes: number;
}) {
  const { execPath, argv, cwd } = params;
  const timeoutMs = Math.max(200, params.timeoutMs);
  const maxStdoutBytes = Math.max(1024, params.maxStdoutBytes);

  const env = { ...process.env, LOBSTER_MODE: "tool" } as Record<string, string | undefined>;
  const nodeOptions = env.NODE_OPTIONS ?? "";
  if (nodeOptions.includes("--inspect")) {
    delete env.NODE_OPTIONS;
  }
  const spawnTarget =
    process.platform === "win32"
      ? resolveWindowsLobsterSpawn(execPath, argv, env)
      : { command: execPath, argv };

  return await new Promise<{ stdout: string }>((resolve, reject) => {
    const child = spawn(spawnTarget.command, spawnTarget.argv, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env,
      windowsHide: spawnTarget.windowsHide,
    });

    let stdout = "";
    let stdoutBytes = 0;
    let stderr = "";
    let settled = false;

    const settle = (
      result: { ok: true; value: { stdout: string } } | { ok: false; error: Error },
    ) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (result.ok) {
        resolve(result.value);
      } else {
        reject(result.error);
      }
    };

    const failAndTerminate = (message: string) => {
      try {
        child.kill("SIGKILL");
      } finally {
        settle({ ok: false, error: new Error(message) });
      }
    };

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk) => {
      const str = String(chunk);
      stdoutBytes += Buffer.byteLength(str, "utf8");
      if (stdoutBytes > maxStdoutBytes) {
        failAndTerminate("workflow runtime output exceeded maxStdoutBytes");
        return;
      }
      stdout += str;
    });

    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    const timer = setTimeout(() => {
      failAndTerminate("workflow runtime subprocess timed out");
    }, timeoutMs);

    child.once("error", (err) => {
      settle({ ok: false, error: err });
    });

    child.once("exit", (code) => {
      if (code !== 0) {
        settle({
          ok: false,
          error: new Error(
            `workflow runtime failed (${code ?? "?"}): ${stderr.trim() || stdout.trim()}`,
          ),
        });
        return;
      }
      settle({ ok: true, value: { stdout } });
    });
  });
}

function parseEnvelope(stdout: string): LobsterEnvelope {
  const trimmed = stdout.trim();

  const tryParse = (input: string) => {
    try {
      return JSON.parse(input) as unknown;
    } catch {
      return undefined;
    }
  };

  let parsed: unknown = tryParse(trimmed);

  // Some environments can leak extra stdout (e.g. warnings/logs) before the
  // final JSON envelope. Be tolerant and parse the last JSON-looking suffix.
  if (parsed === undefined) {
    const suffixMatch = trimmed.match(/({[\s\S]*}|\[[\s\S]*])\s*$/);
    if (suffixMatch?.[1]) {
      parsed = tryParse(suffixMatch[1]);
    }
  }

  if (parsed === undefined) {
    throw new Error("workflow runtime returned invalid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("workflow runtime returned invalid JSON envelope");
  }

  const ok = (parsed as { ok?: unknown }).ok;
  if (ok === true || ok === false) {
    return parsed as LobsterEnvelope;
  }

  throw new Error("workflow runtime returned invalid JSON envelope");
}

function buildWorkflowArgv(action: string, params: Record<string, unknown>): string[] {
  if (action === "run") {
    const pipeline = typeof params.pipeline === "string" ? params.pipeline : "";
    if (!pipeline.trim()) {
      throw new Error("pipeline required");
    }
    const argv = ["run", "--mode", "tool", pipeline];
    const argsJson = typeof params.argsJson === "string" ? params.argsJson : "";
    if (argsJson.trim()) {
      argv.push("--args-json", argsJson);
    }
    return argv;
  }
  if (action === "resume") {
    const token = typeof params.token === "string" ? params.token : "";
    if (!token.trim()) {
      throw new Error("token required");
    }
    const approve = params.approve;
    if (typeof approve !== "boolean") {
      throw new Error("approve required");
    }
    return ["resume", "--token", token, "--approve", approve ? "yes" : "no"];
  }
  throw new Error(`Unknown action: ${action}`);
}

export function createWorkflowTool(
  api: VikiClowPluginApi,
  options: {
    name?: "workflow" | "lobster";
    label?: string;
    description?: string;
  } = {},
) {
  const toolName = options.name ?? "workflow";
  const label = options.label ?? "Viki Workflow";
  const description =
    options.description ??
    "Run Viki Workflow pipelines as a local-first runtime with typed envelopes and resumable approvals.";
  return {
    name: toolName,
    label,
    description,
    parameters: Type.Object({
      // NOTE: Prefer string enums in tool schemas; some providers reject unions/anyOf.
      action: Type.Unsafe<"run" | "resume">({ type: "string", enum: ["run", "resume"] }),
      pipeline: Type.Optional(Type.String()),
      argsJson: Type.Optional(Type.String()),
      token: Type.Optional(Type.String()),
      approve: Type.Optional(Type.Boolean()),
      cwd: Type.Optional(
        Type.String({
          description:
            "Relative working directory (optional). Must stay within the gateway working directory.",
        }),
      ),
      timeoutMs: Type.Optional(Type.Number()),
      maxStdoutBytes: Type.Optional(Type.Number()),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const action = typeof params.action === "string" ? params.action.trim() : "";
      if (!action) {
        throw new Error("action required");
      }

      const preferredExecPath = resolveWorkflowExecutable();
      const cwd = resolveCwd(params.cwd);
      const timeoutMs = typeof params.timeoutMs === "number" ? params.timeoutMs : 20_000;
      const maxStdoutBytes =
        typeof params.maxStdoutBytes === "number" ? params.maxStdoutBytes : 512_000;

      const argv = buildWorkflowArgv(action, params);

      if (api.runtime?.version && api.logger?.debug) {
        api.logger.debug(`workflow runtime plugin=${api.runtime.version}`);
      }

      let stdout: string;
      try {
        ({ stdout } = await runLobsterSubprocessOnce({
          execPath: preferredExecPath,
          argv,
          cwd,
          timeoutMs,
          maxStdoutBytes,
        }));
      } catch (error) {
        if (preferredExecPath === "lobster" || preferredExecPath === "lobster.cmd") {
          throw error;
        }
        ({ stdout } = await runLobsterSubprocessOnce({
          execPath: "lobster",
          argv,
          cwd,
          timeoutMs,
          maxStdoutBytes,
        }));
      }

      const envelope = parseEnvelope(stdout);

      return {
        content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }],
        details: envelope,
      };
    },
  };
}

export function createLobsterTool(api: VikiClowPluginApi) {
  return createWorkflowTool(api, {
    name: "lobster",
    label: "Viki Workflow (Legacy Alias)",
    description:
      "Compatibility alias for older Viki Workflow tool calls. Prefer the workflow tool name for new policies and prompts.",
  });
}
