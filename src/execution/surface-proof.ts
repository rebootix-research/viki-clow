import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWebFetchTool } from "../agents/tools/web-fetch.js";
import { resolveBrowserdPaths, type BrowserdManifest } from "../browser/browserd.js";
import { writeNativeVikiBrowserProof } from "../browser/native-proof.js";
import type { VikiClowConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import { runPluginCommandWithTimeout } from "../plugin-sdk/run-command.js";

export type ExecutionSurfaceProof = {
  version: 1;
  generatedAt: string;
  product: "VikiClow";
  browser: {
    passed: boolean;
    nativeProofPath: string;
    manifestPresent: boolean;
    sessionVaultReady: boolean;
    evidenceReady: boolean;
    launcherSmokePassed: boolean;
  };
  localCommand: {
    code: number;
    stdout: string;
    stderr: string;
  };
  fileWrite: {
    path: string;
    exists: boolean;
  };
  webFetch: {
    url: string;
    status: number | null;
    finalUrl: string | null;
    extractor: string | null;
    title: string | null;
    textPreview: string;
  };
  passed: boolean;
  notes: string[];
};

function buildMinimalWebConfig(): VikiClowConfig {
  return {
    tools: {
      web: {
        fetch: {
          enabled: true,
          readability: true,
          timeoutSeconds: 15,
          maxCharsCap: 2400,
        },
      },
    },
  };
}

function readToolPayload(result: unknown): Record<string, unknown> {
  if (
    result &&
    typeof result === "object" &&
    "details" in result &&
    result.details &&
    typeof result.details === "object"
  ) {
    return result.details as Record<string, unknown>;
  }
  return {};
}

function stringify(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stringifyScalar(value: unknown, fallback = "unknown"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

async function runExecutionWebFetch(
  webFetchTool: NonNullable<ReturnType<typeof createWebFetchTool>>,
) {
  const candidates = ["https://example.com", "http://example.com"] as const;
  let lastError: unknown;
  for (const url of candidates) {
    try {
      const result = await webFetchTool.execute("execution-surface-proof", {
        url,
        extractMode: "text",
        maxChars: 1200,
      });
      return {
        url,
        payload: readToolPayload(result),
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("web_fetch proof failed");
}

async function seedBrowserExecutionState(params: { env: NodeJS.ProcessEnv }) {
  const stateDir = resolveStateDir(params.env);
  const browserdPaths = resolveBrowserdPaths(params.env);
  const profileRoot = path.join(stateDir, "browserd", "profiles", "main");
  const sessionVaultDir = path.join(profileRoot, "user-data");
  const evidenceDir = path.join(profileRoot, "evidence");
  const userDataDir = path.join(profileRoot, "profile");
  await fs.mkdir(sessionVaultDir, { recursive: true });
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.mkdir(userDataDir, { recursive: true });
  const manifest: BrowserdManifest = {
    version: 1,
    service: "browserd",
    product: "Viki Browser",
    reason: "execution-surface-proof",
    generatedAt: new Date().toISOString(),
    manifestPath: browserdPaths.manifestPath,
    controlPort: 18789,
    controlUrl: "http://127.0.0.1:18789/",
    defaultProfile: "main",
    enabled: true,
    profiles: [
      {
        name: "main",
        running: false,
        pid: null,
        cdpPort: 0,
        cdpUrl: "",
        color: "#11847E",
        driver: "vikiclow",
        isRemote: false,
        tabCount: 0,
        userDataDir,
        sessionVaultDir,
        evidenceDir,
      },
    ],
  };
  await fs.mkdir(path.dirname(browserdPaths.manifestPath), { recursive: true });
  await fs.writeFile(browserdPaths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export async function writeExecutionSurfaceProof(params?: {
  rootDir?: string;
  outDir?: string;
  env?: NodeJS.ProcessEnv;
  workspaceDir?: string;
}): Promise<{ proof: ExecutionSurfaceProof; jsonPath: string; markdownPath: string }> {
  const rootDir = params?.rootDir ?? process.cwd();
  const outDir = params?.outDir ?? path.join(rootDir, ".artifacts", "execution-surface");
  const workspaceDir =
    params?.workspaceDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-execution-proof-")));
  const env = params?.env ?? process.env;

  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(workspaceDir, { recursive: true });
  const proofEnv = {
    ...env,
    VIKICLOW_STATE_DIR:
      env.VIKICLOW_STATE_DIR?.trim() || path.join(workspaceDir, ".vikiclow-state"),
  };
  await fs.mkdir(resolveStateDir(proofEnv), { recursive: true });
  await seedBrowserExecutionState({ env: proofEnv });

  const fileWritePath = path.join(workspaceDir, "vikiclow-execution-proof.txt");
  await fs.writeFile(
    fileWritePath,
    "VikiClow execution surface proof: local filesystem write confirmed.\n",
    "utf8",
  );

  const commandResult = await runPluginCommandWithTimeout({
    argv: [
      process.execPath,
      "-e",
      "console.log('vikiclow-execution-surface-ok'); console.log(process.platform);",
    ],
    timeoutMs: 15_000,
    cwd: workspaceDir,
    env: proofEnv,
  });

  const webFetchTool = createWebFetchTool({
    config: buildMinimalWebConfig(),
  });
  if (!webFetchTool) {
    throw new Error("web_fetch tool is unavailable");
  }
  const webFetchResult = await runExecutionWebFetch(webFetchTool);
  const webPayload = webFetchResult.payload;

  const browserProof = await writeNativeVikiBrowserProof({
    rootDir,
    env: proofEnv,
    outDir: path.join(outDir, "browser-proof"),
  });

  const fileExists = await fs
    .access(fileWritePath)
    .then(() => true)
    .catch(() => false);
  const notes: string[] = [];
  if (commandResult.code !== 0) {
    notes.push(`local command failed: ${commandResult.stderr || "exit code was non-zero"}`);
  }
  if (!fileExists) {
    notes.push("local filesystem proof file was not created");
  }
  const webStatus =
    typeof webPayload.status === "number" ? webPayload.status : Number(webPayload.status) || null;
  if (webStatus !== 200) {
    notes.push(`web fetch returned status ${stringifyScalar(webPayload.status)}`);
  }
  if (!browserProof.proof.passed) {
    notes.push(
      browserProof.proof.notes.length > 0
        ? `browser proof incomplete: ${browserProof.proof.notes.join("; ")}`
        : "browser proof incomplete",
    );
  }

  const proof: ExecutionSurfaceProof = {
    version: 1,
    generatedAt: new Date().toISOString(),
    product: "VikiClow",
    browser: {
      passed: browserProof.proof.passed,
      nativeProofPath: browserProof.jsonPath,
      manifestPresent: browserProof.proof.manifestPresent,
      sessionVaultReady: browserProof.proof.sessionVaultReady,
      evidenceReady: browserProof.proof.evidenceReady,
      launcherSmokePassed: browserProof.proof.launcherSmoke.passed,
    },
    localCommand: {
      code: commandResult.code,
      stdout: commandResult.stdout.trim(),
      stderr: commandResult.stderr.trim(),
    },
    fileWrite: {
      path: fileWritePath,
      exists: fileExists,
    },
    webFetch: {
      url: webFetchResult.url,
      status: webStatus,
      finalUrl: stringify(webPayload.finalUrl),
      extractor: stringify(webPayload.extractor),
      title: stringify(webPayload.title),
      textPreview: stringify(webPayload.text)?.slice(0, 280) ?? "",
    },
    passed:
      commandResult.code === 0 && fileExists && webStatus === 200 && browserProof.proof.passed,
    notes,
  };

  const jsonPath = path.join(outDir, "execution-surface-proof.json");
  const markdownPath = path.join(outDir, "execution-surface-proof.md");
  await fs.writeFile(jsonPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");
  const markdown = [
    "# VikiClow Execution Surface Proof",
    "",
    `- Generated at: \`${proof.generatedAt}\``,
    `- Browser ready: \`${proof.browser.passed}\``,
    `- Local command exit code: \`${proof.localCommand.code}\``,
    `- File write: \`${proof.fileWrite.path}\``,
    `- Web fetch status: \`${proof.webFetch.status}\``,
    "",
    "## Notes",
    "",
    ...(proof.notes.length > 0
      ? proof.notes.map((note) => `- ${note}`)
      : ["- All execution surfaces passed."]),
    "",
  ].join("\n");
  await fs.writeFile(markdownPath, `${markdown}\n`, "utf8");
  return { proof, jsonPath, markdownPath };
}
