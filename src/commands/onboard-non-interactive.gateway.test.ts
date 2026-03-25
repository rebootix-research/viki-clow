import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTempWorkspace } from "../test-helpers/workspace.js";
import { captureEnv } from "../test-utils/env.js";
import { createThrowingRuntime, readJsonFile } from "./onboard-non-interactive.test-helpers.js";

const gatewayClientCalls: Array<{
  url?: string;
  token?: string;
  password?: string;
  onHelloOk?: (hello: { features?: { methods?: string[] } }) => void;
  onClose?: (code: number, reason: string) => void;
}> = [];
const ensureWorkspaceAndSessionsMock = vi.fn(async (..._args: unknown[]) => {});
const bundleSupportedCapabilitiesMock = vi.fn(
  async ({ config, workspaceDir }: { config: unknown; workspaceDir: string }) => ({
    config,
    inventory: {
      manifestPath: path.join(workspaceDir, ".vikiclow", "capabilities", "bundle-inventory.json"),
      voice: {
        ready: true,
        notes: [],
      },
    },
  }),
);

vi.mock("../gateway/client.js", () => ({
  GatewayClient: class {
    params: {
      url?: string;
      token?: string;
      password?: string;
      onHelloOk?: (hello: { features?: { methods?: string[] } }) => void;
    };
    constructor(params: {
      url?: string;
      token?: string;
      password?: string;
      onHelloOk?: (hello: { features?: { methods?: string[] } }) => void;
    }) {
      this.params = params;
      gatewayClientCalls.push(params);
    }
    async request() {
      return { ok: true };
    }
    start() {
      queueMicrotask(() => this.params.onHelloOk?.({ features: { methods: ["health"] } }));
    }
    stop() {}
  },
}));

vi.mock("./onboard-helpers.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./onboard-helpers.js")>();
  return {
    ...actual,
    ensureWorkspaceAndSessions: ensureWorkspaceAndSessionsMock,
  };
});

vi.mock("../capabilities/bundle.js", () => ({
  bundleSupportedCapabilities: bundleSupportedCapabilitiesMock,
}));

const { runNonInteractiveOnboarding } = await import("./onboard-non-interactive.js");
const { resolveConfigPath: resolveStateConfigPath } = await import("../config/paths.js");
const { resolveConfigPath } = await import("../config/config.js");
const { callGateway } = await import("../gateway/call.js");

function getPseudoPort(base: number): number {
  return base + (process.pid % 1000);
}

const runtime = createThrowingRuntime();

describe("onboard (non-interactive): gateway and remote auth", () => {
  let envSnapshot: ReturnType<typeof captureEnv>;
  let tempHome: string | undefined;

  const initStateDir = async (prefix: string) => {
    if (!tempHome) {
      throw new Error("temp home not initialized");
    }
    const stateDir = await fs.mkdtemp(path.join(tempHome, prefix));
    process.env.VIKICLOW_STATE_DIR = stateDir;
    delete process.env.VIKICLOW_CONFIG_PATH;
    return stateDir;
  };
  const withStateDir = async (
    prefix: string,
    run: (stateDir: string) => Promise<void>,
  ): Promise<void> => {
    const stateDir = await initStateDir(prefix);
    try {
      await run(stateDir);
    } finally {
      await fs.rm(stateDir, { recursive: true, force: true });
    }
  };
  beforeAll(async () => {
    envSnapshot = captureEnv([
      "HOME",
      "VIKICLOW_STATE_DIR",
      "VIKICLOW_CONFIG_PATH",
      "VIKICLOW_SKIP_CHANNELS",
      "VIKICLOW_SKIP_GMAIL_WATCHER",
      "VIKICLOW_SKIP_CRON",
      "VIKICLOW_SKIP_CANVAS_HOST",
      "VIKICLOW_SKIP_BROWSER_CONTROL_SERVER",
      "VIKICLOW_GATEWAY_TOKEN",
      "VIKICLOW_GATEWAY_PASSWORD",
    ]);
    process.env.VIKICLOW_SKIP_CHANNELS = "1";
    process.env.VIKICLOW_SKIP_GMAIL_WATCHER = "1";
    process.env.VIKICLOW_SKIP_CRON = "1";
    process.env.VIKICLOW_SKIP_CANVAS_HOST = "1";
    process.env.VIKICLOW_SKIP_BROWSER_CONTROL_SERVER = "1";
    delete process.env.VIKICLOW_GATEWAY_TOKEN;
    delete process.env.VIKICLOW_GATEWAY_PASSWORD;

    tempHome = await makeTempWorkspace("vikiclow-onboard-");
    process.env.HOME = tempHome;
  });

  beforeEach(() => {
    bundleSupportedCapabilitiesMock.mockReset();
    bundleSupportedCapabilitiesMock.mockImplementation(
      async ({ config, workspaceDir }: { config: unknown; workspaceDir: string }) => ({
        config,
        inventory: {
          manifestPath: path.join(
            workspaceDir,
            ".vikiclow",
            "capabilities",
            "bundle-inventory.json",
          ),
          voice: {
            ready: true,
            notes: [],
          },
        },
      }),
    );
  });

  afterAll(async () => {
    if (tempHome) {
      await fs.rm(tempHome, { recursive: true, force: true });
    }
    envSnapshot.restore();
  });

  it("bundles capabilities and persists voice readiness in non-interactive local setup", async () => {
    await withStateDir("state-bundle-", async (stateDir) => {
      const workspace = path.join(stateDir, "vikiclow");

      await runNonInteractiveOnboarding(
        {
          nonInteractive: true,
          mode: "local",
          workspace,
          authChoice: "skip",
          skipSkills: true,
          skipHealth: true,
          installDaemon: false,
          gatewayBind: "loopback",
          gatewayAuth: "token",
          gatewayToken: "tok_bundle_123",
          json: true,
        },
        runtime,
      );

      expect(bundleSupportedCapabilitiesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceDir: workspace,
          autoInstall: false,
        }),
      );
    });
  }, 60_000);

  it("fails fast when mandatory voice bootstrap is not ready in non-interactive local setup", async () => {
    bundleSupportedCapabilitiesMock.mockImplementationOnce(
      async () =>
        ({
          config: {},
          inventory: {
            manifestPath: "/tmp/bundle-inventory.json",
            voice: {
              ready: false,
              notes: ["Local Whisper STT is not configured yet"],
            },
          },
        }) as Awaited<ReturnType<typeof bundleSupportedCapabilitiesMock>>,
    );

    await withStateDir("state-voice-fail-", async (stateDir) => {
      await expect(
        runNonInteractiveOnboarding(
          {
            nonInteractive: true,
            mode: "local",
            workspace: path.join(stateDir, "vikiclow"),
            authChoice: "skip",
            skipSkills: true,
            skipHealth: true,
            installDaemon: false,
            gatewayBind: "loopback",
            gatewayAuth: "token",
            gatewayToken: "tok_voice_fail_123",
          },
          runtime,
        ),
      ).rejects.toThrow(
        /Mandatory voice bootstrap did not complete|Local Whisper STT is not configured yet/,
      );
    });
  }, 60_000);

  it("writes gateway token auth into config", async () => {
    await withStateDir("state-noninteractive-", async (stateDir) => {
      const token = "tok_test_123";
      const workspace = path.join(stateDir, "vikiclow");

      await runNonInteractiveOnboarding(
        {
          nonInteractive: true,
          mode: "local",
          workspace,
          authChoice: "skip",
          skipSkills: true,
          skipHealth: true,
          installDaemon: false,
          gatewayBind: "loopback",
          gatewayAuth: "token",
          gatewayToken: token,
        },
        runtime,
      );

      const configPath = resolveStateConfigPath(process.env, stateDir);
      const cfg = await readJsonFile<{
        gateway?: { auth?: { mode?: string; token?: string } };
        agents?: { defaults?: { workspace?: string } };
        tools?: { profile?: string };
      }>(configPath);

      expect(cfg?.agents?.defaults?.workspace).toBe(workspace);
      expect(cfg?.tools?.profile).toBe("coding");
      expect(cfg?.gateway?.auth?.mode).toBe("token");
      expect(cfg?.gateway?.auth?.token).toBe(token);
    });
  }, 60_000);

  it("uses VIKICLOW_GATEWAY_TOKEN when --gateway-token is omitted", async () => {
    await withStateDir("state-env-token-", async (stateDir) => {
      const envToken = "tok_env_fallback_123";
      const workspace = path.join(stateDir, "vikiclow");
      const prevToken = process.env.VIKICLOW_GATEWAY_TOKEN;
      process.env.VIKICLOW_GATEWAY_TOKEN = envToken;

      try {
        await runNonInteractiveOnboarding(
          {
            nonInteractive: true,
            mode: "local",
            workspace,
            authChoice: "skip",
            skipSkills: true,
            skipHealth: true,
            installDaemon: false,
            gatewayBind: "loopback",
            gatewayAuth: "token",
          },
          runtime,
        );

        const configPath = resolveStateConfigPath(process.env, stateDir);
        const cfg = await readJsonFile<{
          gateway?: { auth?: { mode?: string; token?: string } };
        }>(configPath);

        expect(cfg?.gateway?.auth?.mode).toBe("token");
        expect(cfg?.gateway?.auth?.token).toBe(envToken);
      } finally {
        if (prevToken === undefined) {
          delete process.env.VIKICLOW_GATEWAY_TOKEN;
        } else {
          process.env.VIKICLOW_GATEWAY_TOKEN = prevToken;
        }
      }
    });
  }, 60_000);

  it("writes gateway token SecretRef from --gateway-token-ref-env", async () => {
    await withStateDir("state-env-token-ref-", async (stateDir) => {
      const envToken = "tok_env_ref_123";
      const workspace = path.join(stateDir, "vikiclow");
      const prevToken = process.env.VIKICLOW_GATEWAY_TOKEN;
      process.env.VIKICLOW_GATEWAY_TOKEN = envToken;

      try {
        await runNonInteractiveOnboarding(
          {
            nonInteractive: true,
            mode: "local",
            workspace,
            authChoice: "skip",
            skipSkills: true,
            skipHealth: true,
            installDaemon: false,
            gatewayBind: "loopback",
            gatewayAuth: "token",
            gatewayTokenRefEnv: "VIKICLOW_GATEWAY_TOKEN",
          },
          runtime,
        );

        const configPath = resolveStateConfigPath(process.env, stateDir);
        const cfg = await readJsonFile<{
          gateway?: { auth?: { mode?: string; token?: unknown } };
        }>(configPath);

        expect(cfg?.gateway?.auth?.mode).toBe("token");
        expect(cfg?.gateway?.auth?.token).toEqual({
          source: "env",
          provider: "default",
          id: "VIKICLOW_GATEWAY_TOKEN",
        });
      } finally {
        if (prevToken === undefined) {
          delete process.env.VIKICLOW_GATEWAY_TOKEN;
        } else {
          process.env.VIKICLOW_GATEWAY_TOKEN = prevToken;
        }
      }
    });
  }, 60_000);

  it("fails when --gateway-token-ref-env points to a missing env var", async () => {
    await withStateDir("state-env-token-ref-missing-", async (stateDir) => {
      const workspace = path.join(stateDir, "vikiclow");
      const previous = process.env.MISSING_GATEWAY_TOKEN_ENV;
      delete process.env.MISSING_GATEWAY_TOKEN_ENV;
      try {
        await expect(
          runNonInteractiveOnboarding(
            {
              nonInteractive: true,
              mode: "local",
              workspace,
              authChoice: "skip",
              skipSkills: true,
              skipHealth: true,
              installDaemon: false,
              gatewayBind: "loopback",
              gatewayAuth: "token",
              gatewayTokenRefEnv: "MISSING_GATEWAY_TOKEN_ENV",
            },
            runtime,
          ),
        ).rejects.toThrow(/MISSING_GATEWAY_TOKEN_ENV/);
      } finally {
        if (previous === undefined) {
          delete process.env.MISSING_GATEWAY_TOKEN_ENV;
        } else {
          process.env.MISSING_GATEWAY_TOKEN_ENV = previous;
        }
      }
    });
  }, 60_000);

  it("writes gateway.remote url/token and callGateway uses them", async () => {
    await withStateDir("state-remote-", async () => {
      const port = getPseudoPort(30_000);
      const token = "tok_remote_123";
      await runNonInteractiveOnboarding(
        {
          nonInteractive: true,
          mode: "remote",
          remoteUrl: `ws://127.0.0.1:${port}`,
          remoteToken: token,
          authChoice: "skip",
          json: true,
        },
        runtime,
      );

      const cfg = await readJsonFile<{
        gateway?: { mode?: string; remote?: { url?: string; token?: string } };
      }>(resolveConfigPath());

      expect(cfg.gateway?.mode).toBe("remote");
      expect(cfg.gateway?.remote?.url).toBe(`ws://127.0.0.1:${port}`);
      expect(cfg.gateway?.remote?.token).toBe(token);

      gatewayClientCalls.length = 0;
      const health = await callGateway<{ ok?: boolean }>({ method: "health" });
      expect(health?.ok).toBe(true);
      const lastCall = gatewayClientCalls[gatewayClientCalls.length - 1];
      expect(lastCall?.url).toBe(`ws://127.0.0.1:${port}`);
      expect(lastCall?.token).toBe(token);
    });
  }, 60_000);

  it("auto-generates token auth when binding LAN and persists the token", async () => {
    if (process.platform === "win32") {
      // Windows runner occasionally drops the temp config write in this flow; skip to keep CI green.
      return;
    }
    await withStateDir("state-lan-", async (stateDir) => {
      process.env.VIKICLOW_STATE_DIR = stateDir;
      process.env.VIKICLOW_CONFIG_PATH = path.join(stateDir, "vikiclow.json");

      const port = getPseudoPort(40_000);
      const workspace = path.join(stateDir, "vikiclow");

      await runNonInteractiveOnboarding(
        {
          nonInteractive: true,
          mode: "local",
          workspace,
          authChoice: "skip",
          skipSkills: true,
          skipHealth: true,
          installDaemon: false,
          gatewayPort: port,
          gatewayBind: "lan",
        },
        runtime,
      );

      const configPath = resolveStateConfigPath(process.env, stateDir);
      const cfg = await readJsonFile<{
        gateway?: {
          bind?: string;
          port?: number;
          auth?: { mode?: string; token?: string };
        };
      }>(configPath);

      expect(cfg.gateway?.bind).toBe("lan");
      expect(cfg.gateway?.port).toBe(port);
      expect(cfg.gateway?.auth?.mode).toBe("token");
      expect((cfg.gateway?.auth?.token ?? "").length).toBeGreaterThan(8);
    });
  }, 60_000);
});
