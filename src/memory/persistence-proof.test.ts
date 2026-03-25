import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withTempHome } from "../config/test-helpers.js";
import {
  readLatestMemoryPersistenceProof,
  readLatestMemoryWritebackSummary,
  recordMemoryPersistenceProof,
} from "./persistence-proof.js";

describe("memory persistence proof", () => {
  it("writes and reloads a durable proof manifest", async () => {
    await withTempHome(async () => {
      const record = await recordMemoryPersistenceProof({
        agentId: "main",
        result: "ready",
        status: {
          backend: "builtin",
          provider: "none",
          files: 2,
          chunks: 5,
          dirty: false,
          workspaceDir: "/workspace",
          dbPath: "/workspace/.vikiclow/memory/main.sqlite",
          sources: ["memory"],
          extraPaths: [],
          cache: { enabled: true, entries: 1, maxEntries: 100 },
          fts: { enabled: true, available: true },
          vector: { enabled: false },
          batch: {
            enabled: false,
            failures: 0,
            limit: 2,
            wait: true,
            concurrency: 1,
            pollIntervalMs: 1,
            timeoutMs: 1,
          },
          custom: { searchMode: "search" },
        },
        syncReason: "bootstrap",
      });

      expect(record.agentId).toBe("main");
      expect(record.result).toBe("ready");
      await expect(fs.readFile(record.proofPath, "utf-8")).resolves.toContain('"result": "ready"');
      await expect(fs.readFile(record.eventsPath, "utf-8")).resolves.toContain(
        '"syncReason":"bootstrap"',
      );

      const reloaded = await readLatestMemoryPersistenceProof({ agentId: "main" });
      expect(reloaded?.lineageId).toBe(record.lineageId);
      expect(reloaded?.proofPath).toBe(record.proofPath);
      expect(reloaded?.eventsPath).toBe(record.eventsPath);
    });
  });

  it("updates the manifest when a later proof is recorded", async () => {
    await withTempHome(async () => {
      const bootstrap = await recordMemoryPersistenceProof({
        agentId: "main",
        result: "ready",
        status: {
          backend: "builtin",
          provider: "none",
          files: 1,
          chunks: 1,
          dirty: false,
        },
      });
      const completed = await recordMemoryPersistenceProof({
        agentId: "main",
        result: "completed",
        status: {
          backend: "builtin",
          provider: "none",
          files: 3,
          chunks: 7,
          dirty: false,
        },
        syncReason: "manual",
      });

      expect(completed.recordedAt >= bootstrap.recordedAt).toBe(true);
      const reloaded = await readLatestMemoryPersistenceProof({ agentId: "main" });
      expect(reloaded?.result).toBe("completed");
      expect(reloaded?.syncReason).toBe("manual");
    });
  });

  it("summarizes the latest memory writeback file in a workspace", async () => {
    await withTempHome(async () => {
      const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-memory-writeback-"));
      try {
        const memoryDir = path.join(workspaceDir, "memory");
        await fs.mkdir(memoryDir, { recursive: true });
        const writebackPath = path.join(memoryDir, "2026-03-24.md");
        await fs.writeFile(
          writebackPath,
          "## Mission Writeback\n- Mission: mission-123\n",
          "utf-8",
        );

        const summary = await readLatestMemoryWritebackSummary({ workspaceDir });
        expect(summary?.relativePath).toBe("memory/2026-03-24.md");
        expect(summary?.path).toBe(writebackPath);
        expect(summary?.size).toBeGreaterThan(0);
      } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
      }
    });
  });
});
