import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { MissionRecord } from "../missions/types.js";
import { appendMissionMemoryWriteback, resolveMissionMemoryWritebackRelativePath } from "./mission-writeback.js";

describe("mission memory writeback", () => {
  it("appends a mission summary into the canonical memory file and stays idempotent", async () => {
    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-writeback-"));
    const record = {
      id: "mission-123",
      objective: "Verify the browser flow",
      status: "completed",
      currentState: "Mission completed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      runId: "run-123",
      notificationTarget: { deliver: false },
      completionCriteria: [],
      retryPolicy: { maxAttempts: 3, attemptsUsed: 1, strategy: "resume_same_request" },
      plan: {
        sovereign: "sovereign",
        summary: "summary",
        domains: ["browser_web"],
        swarms: [],
        verifier: "verifier",
        recovery: "recovery",
      },
      subtasks: [],
      dependencies: [],
      approvals: [],
      artifacts: [],
      evidence: [],
      resume: { enabled: true },
      attempts: [],
      workspaceDir,
      agentId: "main",
      sessionId: "session-1",
      sessionKey: "main",
      proof: undefined,
    } as MissionRecord;

    try {
      const first = await appendMissionMemoryWriteback(record, {
        nowMs: Date.UTC(2026, 2, 24, 12, 0, 0),
        timezone: "UTC",
      });
      expect(first?.appended).toBe(true);
      expect(first?.path).toContain(path.join("memory", "2026-03-24.md"));

      const contents = await fs.readFile(first?.path ?? "", "utf8");
      expect(contents).toContain("## Mission Writeback");
      expect(contents).toContain("Mission: mission-123");
      expect(contents).toContain("Status: completed");

      const second = await appendMissionMemoryWriteback(record, {
        nowMs: Date.UTC(2026, 2, 24, 12, 0, 0),
        timezone: "UTC",
      });
      expect(second?.appended).toBe(false);
      expect(second?.path).toBe(first?.path);
    } finally {
      await fs.rm(workspaceDir, { recursive: true, force: true });
    }
  });

  it("resolves the canonical mission writeback path using the selected timezone", () => {
    const relative = resolveMissionMemoryWritebackRelativePath({
      nowMs: Date.UTC(2026, 2, 24, 12, 0, 0),
      timezone: "UTC",
    });

    expect(relative).toBe(path.join("memory", "2026-03-24.md").replace(/\\/g, "/"));
  });
});
