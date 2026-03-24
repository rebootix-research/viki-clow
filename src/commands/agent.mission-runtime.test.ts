import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as configModule from "../config/config.js";
import { loadModelCatalog } from "../agents/model-catalog.js";
import { runEmbeddedPiAgent } from "../agents/pi-embedded.js";
import { listMissionRecords } from "../missions/store.js";
import type { RuntimeEnv } from "../runtime.js";
import { agentCommand } from "./agent.js";

vi.mock("../agents/model-catalog.js", () => ({
  loadModelCatalog: vi.fn(),
}));

vi.mock("../agents/pi-embedded.js", () => ({
  runEmbeddedPiAgent: vi.fn(),
}));

vi.mock("../capabilities/runtime.js", () => ({
  ensureCapabilitiesForObjective: vi.fn(async () => ({
    objective: "mocked",
    inferred: ["playwright"],
    ready: [],
    provisioned: [
      {
        id: "browser_profiles",
        label: "Viki Browser Profiles",
        kind: "runtime_adapter",
        status: "provisioned",
        checkedAt: new Date().toISOString(),
        details: "/tmp/workspace/.vikiclow/browser/profiles/mission-default",
      },
    ],
    missing: [],
    failed: [],
  })),
}));

vi.mock("../agents/auth-profiles.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../agents/auth-profiles.js")>();
  return {
    ...actual,
    ensureAuthProfileStore: vi.fn(() => ({ version: 1, profiles: {} })),
  };
});

vi.mock("../agents/workspace.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../agents/workspace.js")>();
  return {
    ...actual,
    ensureAgentWorkspace: vi.fn(async ({ dir }: { dir: string }) => ({ dir })),
  };
});

vi.mock("../agents/skills.js", () => ({
  buildWorkspaceSkillSnapshot: vi.fn(() => undefined),
}));

vi.mock("../agents/skills/refresh.js", () => ({
  getSkillsSnapshotVersion: vi.fn(() => 0),
}));

vi.mock("../cli/command-secret-gateway.js", () => ({
  resolveCommandSecretRefsViaGateway: vi.fn(async ({ config }: { config: unknown }) => ({
    resolvedConfig: config,
    diagnostics: [],
    targetStatesByPath: {},
    hadUnresolvedTargets: false,
  })),
}));

const runtime: RuntimeEnv = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
};

const configSpy = vi.spyOn(configModule, "loadConfig");
const readConfigFileSnapshotForWriteSpy = vi.spyOn(configModule, "readConfigFileSnapshotForWrite");
const tempDirs: string[] = [];

async function withTempStateDir<T>(run: (stateDir: string) => Promise<T>): Promise<T> {
  const stateDir = await fsp.mkdtemp(path.join(os.tmpdir(), "vikiclow-agent-mission-"));
  tempDirs.push(stateDir);
  const previousStateDir = process.env.VIKICLOW_STATE_DIR;
  process.env.VIKICLOW_STATE_DIR = stateDir;
  try {
    return await run(stateDir);
  } finally {
    if (previousStateDir === undefined) {
      delete process.env.VIKICLOW_STATE_DIR;
    } else {
      process.env.VIKICLOW_STATE_DIR = previousStateDir;
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  configModule.clearRuntimeConfigSnapshot();
  vi.mocked(runEmbeddedPiAgent).mockResolvedValue({
    payloads: [{ text: "Mission done." }],
    meta: {
      durationMs: 5,
      agentMeta: { sessionId: "embedded-session", provider: "anthropic", model: "claude-opus" },
    },
  });
  vi.mocked(loadModelCatalog).mockResolvedValue([]);
  readConfigFileSnapshotForWriteSpy.mockResolvedValue({
    snapshot: { valid: false, resolved: {} as never },
    writeOptions: {},
  } as unknown as Awaited<ReturnType<typeof configModule.readConfigFileSnapshotForWrite>>);
});

afterEach(async () => {
  await Promise.all(tempDirs.splice(0, tempDirs.length).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

describe("agent mission runtime integration", () => {
  it("creates a persisted mission for a real agentCommand run", async () => {
    await withTempStateDir(async (stateDir) => {
      const store = path.join(stateDir, "sessions.json");
      const workspace = path.join(stateDir, "workspace");
      fs.mkdirSync(workspace, { recursive: true });
      configSpy.mockReturnValue({
        agents: {
          defaults: {
            model: { primary: "anthropic/claude-opus-4-5" },
            models: { "anthropic/claude-opus-4-5": {} },
            workspace,
          },
        },
        session: { store, mainKey: "main" },
      } as never);

      await agentCommand({ message: "Ship the browser flow end to end", to: "+1555" }, runtime);

      const missions = await listMissionRecords();
      expect(missions).toHaveLength(1);
      expect(missions[0]?.objective).toContain("Ship the browser flow end to end");
      expect(missions[0]?.status).toBe("completed");
      expect(missions[0]?.resume.request?.missionId).toBe(missions[0]?.id);
      expect(missions[0]?.plan.swarms.length).toBeGreaterThan(0);
    });
  });
});
