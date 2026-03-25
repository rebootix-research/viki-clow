import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bundleSupportedCapabilities } from "./bundle.js";

const mocks = vi.hoisted(() => ({
  ensureBaseCapabilityPack: vi.fn(async () => ({
    objective: "base",
    inferred: ["git", "playwright"],
    ready: [],
    provisioned: [],
    missing: [],
    failed: [],
  })),
  buildWorkspaceSkillStatus: vi.fn(() => ({
    workspaceDir: "/tmp/workspace",
    managedSkillsDir: "/tmp/skills",
    skills: [
      {
        name: "vikiclow-skills",
        description: "Registry",
        source: "vikiclow-bundled",
        bundled: true,
        filePath: "/repo/skills/vikiclow-skills/SKILL.md",
        baseDir: "/repo/skills/vikiclow-skills",
        skillKey: "vikiclow-skills",
        always: false,
        disabled: false,
        blockedByAllowlist: false,
        eligible: false,
        requirements: { bins: ["vikiclow-skills"], anyBins: [], env: [], config: [], os: [] },
        missing: { bins: ["vikiclow-skills"], anyBins: [], env: [], config: [], os: [] },
        configChecks: [],
        install: [
          { id: "node", kind: "node", label: "Install vikiclow-skills", bins: ["vikiclow-skills"] },
        ],
      },
    ],
  })),
  installSkill: vi.fn(async () => ({
    ok: true,
    message: "Installed",
    stdout: "",
    stderr: "",
    code: 0,
  })),
  loadPluginManifestRegistry: vi.fn(() => ({
    plugins: [
      {
        id: "talk-voice",
        name: "Talk Voice",
        channels: [],
        providers: [],
        skills: [],
        origin: "bundled",
        rootDir: "/repo/extensions/talk-voice",
        source: "bundled",
      },
      {
        id: "memory-core",
        name: "Memory Core",
        kind: "memory",
        channels: [],
        providers: [],
        skills: [],
        origin: "bundled",
        rootDir: "/repo/extensions/memory-core",
        source: "bundled",
      },
      {
        id: "voice-call",
        name: "Voice Call",
        channels: [],
        providers: [],
        skills: [],
        origin: "bundled",
        rootDir: "/repo/extensions/voice-call",
        source: "bundled",
      },
    ],
    diagnostics: [],
  })),
  ensureVoiceRuntimeBootstrap: vi.fn(async () => ({
    version: 1,
    generatedAt: new Date().toISOString(),
    required: true as const,
    ready: true,
    configDir: "/tmp/.vikiclow",
    manifestPath: "/tmp/.vikiclow/voice/bootstrap-manifest.json",
    dirs: {
      base: "/tmp/.vikiclow/voice",
      wakeword: "/tmp/.vikiclow/voice/wakeword",
      stt: "/tmp/.vikiclow/voice/stt",
      tts: "/tmp/.vikiclow/voice/tts",
      logs: "/tmp/.vikiclow/voice/logs",
    },
    plugins: {
      talkVoiceEnabled: true,
      phoneControlEnabled: true,
      devicePairEnabled: true,
      voiceCallAvailable: true,
    },
    localBackends: {
      sherpaConfigured: false,
      whisperConfigured: false,
    },
    notes: [],
  })),
  writeNativeVikiBrowserProof: vi.fn(async () => ({
    proof: { manifestPresent: true, passed: true },
    jsonPath: "/tmp/browser/native-proof.json",
  })),
  writeGraphitiBackboneProof: vi.fn(async () => ({
    paths: { proofPath: "/tmp/memory/graphiti-proof.json" },
    delegatedBackend: "local-shadow",
  })),
  writeVoiceBootstrapProof: vi.fn(async () => ({
    proof: { passed: true },
    jsonPath: "/tmp/voice/voice-proof.json",
    mdPath: "/tmp/voice/voice-proof.md",
  })),
  resolveDefaultAgentId: vi.fn(() => "main"),
  resolveMemoryBackendConfig: vi.fn(() => ({ graphiti: undefined })),
}));

vi.mock("./runtime.js", () => ({ ensureBaseCapabilityPack: mocks.ensureBaseCapabilityPack }));
vi.mock("../agents/skills-status.js", () => ({
  buildWorkspaceSkillStatus: mocks.buildWorkspaceSkillStatus,
}));
vi.mock("../agents/skills-install.js", () => ({ installSkill: mocks.installSkill }));
vi.mock("../plugins/manifest-registry.js", () => ({
  loadPluginManifestRegistry: mocks.loadPluginManifestRegistry,
}));
vi.mock("../voice/runtime-bootstrap.js", () => ({
  ensureVoiceRuntimeBootstrap: mocks.ensureVoiceRuntimeBootstrap,
}));
vi.mock("../browser/native-proof.js", () => ({
  writeNativeVikiBrowserProof: mocks.writeNativeVikiBrowserProof,
}));
vi.mock("../memory/graphiti-backbone.js", () => ({
  writeGraphitiBackboneProof: mocks.writeGraphitiBackboneProof,
}));
vi.mock("../voice/bootstrap-proof.js", () => ({
  writeVoiceBootstrapProof: mocks.writeVoiceBootstrapProof,
}));
vi.mock("../agents/agent-scope.js", () => ({ resolveDefaultAgentId: mocks.resolveDefaultAgentId }));
vi.mock("../memory/backend-config.js", () => ({
  resolveMemoryBackendConfig: mocks.resolveMemoryBackendConfig,
}));

const tempDirs: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all(
    tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("bundle supported capabilities", () => {
  it("writes an inventory, enables core bundled plugins, and records bundled skills", async () => {
    const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-bundle-state-"));
    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-bundle-workspace-"));
    tempDirs.push(stateDir, workspaceDir);
    const previous = process.env.VIKICLOW_STATE_DIR;
    process.env.VIKICLOW_STATE_DIR = stateDir;
    try {
      const result = await bundleSupportedCapabilities({
        workspaceDir,
        config: {},
        autoInstall: true,
        rootDir: process.cwd(),
      });

      expect(result.config.plugins?.entries?.["talk-voice"]?.enabled).toBe(true);
      expect(result.config.plugins?.slots?.memory).toBe("memory-core");
      expect(
        result.inventory.plugins.some(
          (entry) => entry.id === "talk-voice" && entry.status === "enabled",
        ),
      ).toBe(true);
      expect(
        result.inventory.plugins.some(
          (entry) => entry.id === "voice-call" && entry.status === "skipped",
        ),
      ).toBe(true);
      expect(
        result.inventory.skills.some(
          (entry) => entry.name === "vikiclow-skills" && entry.status === "installed",
        ),
      ).toBe(true);
      await expect(fs.readFile(result.inventory.manifestPath, "utf8")).resolves.toContain(
        '"version": 1',
      );
    } finally {
      if (previous === undefined) {
        delete process.env.VIKICLOW_STATE_DIR;
      } else {
        process.env.VIKICLOW_STATE_DIR = previous;
      }
    }
  });

  it("still auto-installs mandatory voice skills when skip-skills mode disables general auto-install", async () => {
    const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-bundle-voice-state-"));
    const workspaceDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "vikiclow-bundle-voice-workspace-"),
    );
    tempDirs.push(stateDir, workspaceDir);
    const previous = process.env.VIKICLOW_STATE_DIR;
    process.env.VIKICLOW_STATE_DIR = stateDir;
    mocks.buildWorkspaceSkillStatus.mockReturnValueOnce({
      workspaceDir,
      managedSkillsDir: "/tmp/skills",
      skills: [
        {
          name: "openai-whisper",
          description: "Whisper",
          source: "vikiclow-bundled",
          bundled: true,
          filePath: "/repo/skills/openai-whisper/SKILL.md",
          baseDir: "/repo/skills/openai-whisper",
          skillKey: "openai-whisper",
          always: false,
          disabled: false,
          blockedByAllowlist: false,
          eligible: false,
          requirements: { bins: ["whisper"], anyBins: [], env: [], config: [], os: [] },
          missing: { bins: ["whisper"], anyBins: [], env: [], config: [], os: [] },
          configChecks: [],
          install: [{ id: "uv", kind: "uv", label: "Install openai-whisper", bins: ["whisper"] }],
        },
      ],
    });
    try {
      const result = await bundleSupportedCapabilities({
        workspaceDir,
        config: {},
        autoInstall: false,
        rootDir: process.cwd(),
      });

      expect(mocks.installSkill).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceDir,
          skillName: "openai-whisper",
        }),
      );
      expect(result.config.skills?.entries?.["openai-whisper"]?.env?.WHISPER_MODEL).toBe("turbo");
      expect(
        result.inventory.skills.some(
          (entry) => entry.name === "openai-whisper" && entry.status === "installed",
        ),
      ).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.VIKICLOW_STATE_DIR;
      } else {
        process.env.VIKICLOW_STATE_DIR = previous;
      }
    }
  });
});
