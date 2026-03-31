import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { MissionRecord } from "../missions/types.js";
import {
  appendMissionMemoryWriteback,
  resolveMissionMemoryWritebackRelativePath,
} from "./mission-writeback.js";

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
      capabilityPlan: {
        objective: "Verify the browser flow",
        inferred: ["playwright", "browser_profiles"],
        ready: [],
        provisioned: [],
        missing: [],
        failed: [],
        routing: [
          {
            id: "playwright",
            source: "objective",
            matchedHints: ["browser", "playwright"],
            usageCount: 3,
          },
          {
            id: "browser_profiles",
            source: "derived",
            matchedHints: ["playwright"],
            derivedFrom: ["playwright"],
            usageCount: 3,
          },
        ],
        foundry: {
          registryPath: "/tmp/state/capabilities/foundry/registry.json",
          discovered: 6,
          promoted: 2,
          bundled: 2,
          rejected: 1,
          routes: [
            {
              candidateId: "skill:viki-skill-factory",
              name: "Viki Skill Factory",
              type: "skill",
              score: 7,
              reasons: ["hint:skill", "usage:success=2"],
              scope: "bundled",
              state: "bundled",
              sourceUrl:
                "https://github.com/rebootix-research/viki-clow/tree/main/skills/viki-skill-factory",
              usage: {
                suggested: 3,
                success: 2,
                failure: 0,
              },
              registration: {
                kind: "skill",
                targetId: "viki-skill-factory",
                entrypoint: "/tmp/workspace/skills/viki-skill-factory/SKILL.md",
                autoBundled: true,
                routeHints: ["skill", "factory"],
              },
            },
          ],
        },
      },
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
      expect(contents).toContain("Capability Foundry:");
      expect(contents).toContain("browser_profiles");
      expect(contents).toContain("skill:viki-skill-factory");

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
