import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveMissionBackbonePaths } from "./backbone-materializer.js";
import { buildMissionBackbone } from "./backbone.js";
import { buildMissionExecutionPrompt } from "./orchestration.js";
import { beginMissionRun } from "./runtime.js";
import { loadMissionRecord } from "./store.js";

const tempStateDirs: string[] = [];

async function withTempStateDir<T>(run: (stateDir: string) => Promise<T>): Promise<T> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-mission-"));
  tempStateDirs.push(tempDir);
  const previous = process.env.VIKICLOW_STATE_DIR;
  process.env.VIKICLOW_STATE_DIR = tempDir;
  try {
    return await run(tempDir);
  } finally {
    if (previous === undefined) {
      delete process.env.VIKICLOW_STATE_DIR;
    } else {
      process.env.VIKICLOW_STATE_DIR = previous;
    }
  }
}

afterEach(async () => {
  await Promise.all(
    tempStateDirs
      .splice(0, tempStateDirs.length)
      .map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("mission runtime", () => {
  it("persists completed missions with proof metadata and swarm plan", async () => {
    await withTempStateDir(async (stateDir) => {
      const workspaceDir = await fs.mkdtemp(path.join(stateDir, "workspace-"));
      const tracker = await beginMissionRun({
        objective: "Ship the docs update and verify the browser flow",
        runId: "run-complete",
        sessionId: "session-1",
        sessionKey: "main",
        agentId: "main",
        workspaceDir,
        deliver: false,
        replayRequest: {
          message: "Ship the docs update and verify the browser flow",
          missionId: "pending",
        },
      });

      await tracker.onEvent({
        runId: "run-complete",
        seq: 1,
        stream: "assistant",
        ts: Date.now(),
        data: {
          text: "Working through the documentation and browser validation now.",
        },
      });

      await tracker.finalizeCompleted({
        replyText: "Docs shipped and browser flow verified.",
        sessionFile: path.join(os.tmpdir(), "session.jsonl"),
        aborted: false,
      });

      const record = await loadMissionRecord(tracker.missionId);
      expect(record?.status).toBe("completed");
      expect(record?.resume.request?.missionId).toBe(tracker.missionId);
      expect(record?.plan.swarms.length).toBeGreaterThan(0);
      expect(record?.backbone?.temporal.adapter).toBe("temporal");
      expect(record?.backbone?.langGraph.adapter).toBe("langgraph");
      expect(record?.backbone?.langGraph.nodes.some((node) => node.role === "verifier")).toBe(true);
      expect(record?.backbone?.langGraph.edges.some((edge) => edge.relation === "verifies")).toBe(
        true,
      );
      expect(record?.backbone?.langGraph.currentNodeId).toBe("swarm-verifier");
      expect(record?.backbone?.browser.adapter).toBe("browserd");
      expect(record?.backbone?.browser.product).toBe("Viki Browser");
      expect(record?.backbone?.memory.adapter).toBe("graphiti");
      expect(record?.backbone?.materialized).toBe(true);
      expect(record?.proof?.swarmCount).toBe(record?.plan.swarms.length);
      expect(record?.proof?.terminalState).toBe("completed");
      expect(record?.terminalMessage).toContain("completed");
      expect(record?.artifacts.some((artifact) => artifact.kind === "transcript")).toBe(true);
      expect(buildMissionBackbone(record!).langGraph.currentNodeId).toBe("swarm-verifier");
      const backbonePaths = resolveMissionBackbonePaths(tracker.missionId);
      await expect(fs.readFile(backbonePaths.temporalPath, "utf8")).resolves.toContain(
        '"workflowId":',
      );
      await expect(fs.readFile(backbonePaths.langGraphPath, "utf8")).resolves.toContain(
        '"graphId":',
      );
      await expect(fs.readFile(backbonePaths.proofPath, "utf8")).resolves.toContain(
        `"missionId": "${tracker.missionId}"`,
      );
      await expect(fs.readFile(backbonePaths.proofPath, "utf8")).resolves.toContain('"browser"');
      await expect(fs.readFile(backbonePaths.proofPath, "utf8")).resolves.toContain('"memory"');
      const memoryDir = path.join(workspaceDir, "memory");
      const memoryFiles = await fs.readdir(memoryDir);
      const writebackFile = memoryFiles.find((entry) => entry.endsWith(".md"));
      expect(writebackFile).toBeDefined();
      const writebackContents = await fs.readFile(
        path.join(memoryDir, writebackFile ?? ""),
        "utf8",
      );
      expect(writebackContents).toContain(`Mission: ${tracker.missionId}`);
      expect(writebackContents).toContain("Status: completed");
      const prompt = buildMissionExecutionPrompt(record!);
      expect(prompt).toContain("Swarm-of-Swarms Topology");
      expect(prompt).toContain("Mission Proof");
      expect(prompt).toContain("Domain swarm count");
      expect(prompt).toContain("Temporal boundary");
      expect(prompt).toContain("LangGraph boundary");
      expect(prompt).toContain("Viki Browser boundary");
      expect(prompt).toContain("Graphiti boundary");
    });
  });

  it("records capability preflight artifacts on the mission record", async () => {
    await withTempStateDir(async (stateDir) => {
      const workspaceDir = await fs.mkdtemp(path.join(stateDir, "workspace-capability-"));
      const tracker = await beginMissionRun({
        objective: "Publish the web flow and generate a reusable browser skill",
        runId: "run-capability",
        sessionId: "session-capability",
        sessionKey: "main",
        agentId: "main",
        workspaceDir,
        deliver: false,
        replayRequest: {
          message: "Publish the web flow and generate a reusable browser skill",
          missionId: "pending",
        },
      });

      await tracker.recordCapabilityPlan({
        objective: "Publish the web flow and generate a reusable browser skill",
        inferred: ["playwright", "browser_profiles", "generated_skill"],
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
          {
            id: "generated_skill",
            label: "Generated Local Skill",
            kind: "generated_local_skill",
            status: "provisioned",
            checkedAt: new Date().toISOString(),
            details: "/tmp/workspace/skills/generated-browser-skill/SKILL.md",
          },
        ],
        missing: [],
        failed: [],
        routing: [
          {
            id: "playwright",
            source: "objective",
            matchedHints: ["browser", "web", "playwright"],
            usageCount: 1,
          },
          {
            id: "browser_profiles",
            source: "derived",
            matchedHints: ["playwright"],
            derivedFrom: ["playwright"],
            usageCount: 1,
          },
          {
            id: "generated_skill",
            source: "objective",
            matchedHints: ["skill", "workflow", "automation"],
            usageCount: 1,
          },
        ],
        generatedSkillPath: "/tmp/workspace/skills/generated-browser-skill/SKILL.md",
      });

      await tracker.finalizeCompleted({ replyText: "Capability preflight recorded." });
      const record = await loadMissionRecord(tracker.missionId);
      expect(record?.artifacts.some((artifact) => artifact.label === "Capability preflight")).toBe(
        true,
      );
      expect(
        record?.capabilityPlan?.routing?.some((route) => route.id === "browser_profiles"),
      ).toBe(true);
      expect(
        record?.artifacts.some((artifact) => artifact.label === "Generated mission skill"),
      ).toBe(true);
      expect(record?.checkpoint?.summary).toContain("Capability preflight");
      const memoryDir = path.join(workspaceDir, "memory");
      const memoryFiles = await fs.readdir(memoryDir);
      const writebackFile = memoryFiles.find((entry) => entry.endsWith(".md"));
      expect(writebackFile).toBeDefined();
      const writebackContents = await fs.readFile(
        path.join(memoryDir, writebackFile ?? ""),
        "utf8",
      );
      expect(writebackContents).toContain("Capability Foundry:");
      expect(writebackContents).toContain("browser_profiles");
    });
  });

  it("persists approval waits as needs_approval terminal state", async () => {
    await withTempStateDir(async (stateDir) => {
      const workspaceDir = await fs.mkdtemp(path.join(stateDir, "workspace-approval-"));
      const tracker = await beginMissionRun({
        objective: "Run an elevated desktop command that may need approval",
        runId: "run-approval",
        sessionId: "session-2",
        sessionKey: "main",
        agentId: "main",
        workspaceDir,
        deliver: true,
        replayRequest: {
          message: "Run an elevated desktop command that may need approval",
          missionId: "pending",
        },
      });

      await tracker.onEvent({
        runId: "run-approval",
        seq: 2,
        stream: "tool",
        ts: Date.now(),
        data: {
          phase: "result",
          name: "exec",
          result: {
            details: {
              status: "approval-pending",
              approvalId: "approval-1",
              approvalSlug: "approval-1",
              command: "sudo systemctl restart vikiclow",
              host: "gateway",
            },
          },
        },
      });

      await tracker.finalizeCompleted({
        replyText: "Waiting for approval.",
        aborted: false,
      });

      const record = await loadMissionRecord(tracker.missionId);
      expect(record?.status).toBe("needs_approval");
      expect(record?.approvals.at(-1)?.command).toContain("sudo systemctl restart vikiclow");
      expect(record?.terminalMessage).toContain("needs approval");
      expect(record?.backbone?.langGraph.currentNodeId).toBe("swarm-verifier");
      expect(record?.proof?.terminalState).toBe("needs_approval");
      expect(record?.proof?.topology).toContain("sovereign orchestrator");
      expect(record?.backbone?.temporal.workflowId).toBe(`mission-${tracker.missionId}`);
    });
  });

  it("classifies blocked terminal errors and keeps proof aligned", async () => {
    await withTempStateDir(async (stateDir) => {
      const workspaceDir = await fs.mkdtemp(path.join(stateDir, "workspace-blocked-"));
      const tracker = await beginMissionRun({
        objective: "Complete a mission that will be blocked by policy",
        runId: "run-blocked",
        sessionId: "session-3",
        sessionKey: "main",
        agentId: "main",
        workspaceDir,
        deliver: true,
        replayRequest: {
          message: "Complete a mission that will be blocked by policy",
          missionId: "pending",
        },
      });

      await tracker.finalizeFailed(new Error("blocked by policy: approval route unavailable"));

      const record = await loadMissionRecord(tracker.missionId);
      expect(record?.status).toBe("blocked");
      expect(record?.backbone?.langGraph.currentNodeId).toBe("swarm-recovery");
      expect(record?.proof?.terminalState).toBe("blocked");
      expect(record?.proof?.terminalMessage).toContain("blocked");
      expect(record?.lastError).toContain("blocked by policy");
    });
  });
});
