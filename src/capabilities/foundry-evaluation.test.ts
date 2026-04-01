import { describe, expect, it } from "vitest";
import { buildFoundryReceipt, scoreFoundryCandidate } from "./foundry-evaluation.js";
import type { CapabilityFoundryCandidate } from "./types.js";

function makeCandidate(
  overrides: Partial<CapabilityFoundryCandidate> = {},
): CapabilityFoundryCandidate {
  return {
    id: "skill:foundry-test",
    name: "Foundry Test Skill",
    type: "skill",
    summary: "A test skill for foundry scoring",
    compatibility: "compatible",
    scope: "bundled",
    state: "tested",
    source: {
      kind: "local_repo",
      sourceUrl: "https://example.invalid/skill",
      localPath: "/tmp/foundry-test",
      installMethod: "workspace_copy",
      dependencies: ["node"],
    },
    sourceCatalogId: "vikiclow.foundry.approved",
    sourceCatalogEntryId: "skill:foundry-test",
    sourceFamily: "bundled_skill",
    approval: "approved",
    classification: {
      objectiveHints: ["foundry", "test", "skill"],
      tags: ["foundry", "test", "skill"],
      selectionNotes: ["bundled source"],
    },
    sandbox: {
      path: "/tmp/foundry-test",
    },
    lifecycleReceipt: {
      discoveredAt: "2026-04-02T00:00:00.000Z",
      fetchedAt: "2026-04-02T00:00:01.000Z",
      inspectedAt: "2026-04-02T00:00:02.000Z",
      sandboxedAt: "2026-04-02T00:00:03.000Z",
      testedAt: "2026-04-02T00:00:04.000Z",
    },
    provenance: {
      version: "1.0.0",
      license: "MIT",
      sourceRef: "main",
      repository: "example/foundry-test",
      registry: undefined,
      homepage: "https://example.invalid/skill",
      author: "Vikiclow",
      artifactDigest: "sha256:abc123",
      dependencies: ["node"],
      fetchedFrom: "/tmp/foundry-test",
    },
    test: {
      status: "passed",
      summary: "Ready for routing",
      testedAt: "2026-04-02T00:00:04.000Z",
      proofPath: "/tmp/foundry-test/proof.json",
    },
    registration: {
      kind: "skill",
      targetId: "skill:foundry-test",
      entrypoint: "/tmp/foundry-test/SKILL.md",
      path: "/tmp/foundry-test",
      autoBundled: true,
      routeHints: ["foundry", "test", "skill"],
      usageRecipe: "Use for foundry routing tests.",
    },
    promotedAt: undefined,
    rejectedAt: undefined,
    rejectionReason: undefined,
    usage: {
      suggested: 1,
      success: 2,
      failure: 0,
      lastOutcome: "success",
      lastUsedAt: "2026-04-02T00:00:05.000Z",
    },
    notes: ["seed"],
    ...overrides,
  };
}

describe("Capability Foundry evaluation", () => {
  it("scores curated approved candidates using family, approval, provenance, and usage signals", () => {
    const candidate = makeCandidate();
    const scored = scoreFoundryCandidate(candidate, "find a foundry skill for routing");

    expect(scored.score).toBeGreaterThan(0);
    expect(scored.reasons).toEqual(
      expect.arrayContaining(["family:bundled_skill", "approval:approved", "source:local_repo"]),
    );
  });

  it("builds receipts with catalog provenance and stage data", () => {
    const candidate = makeCandidate();
    const receipt = buildFoundryReceipt({
      candidate,
      stage: "promote",
      outcome: "promoted",
      objective: "route a foundry skill",
      beforeState: "tested",
      afterState: "promoted",
    });

    expect(receipt.receiptId).toMatch(/^[a-f0-9]{16}$/u);
    expect(receipt.stage).toBe("promote");
    expect(receipt.outcome).toBe("promoted");
    expect(receipt.source).toMatchObject({
      sourceCatalogId: "vikiclow.foundry.approved",
      sourceCatalogEntryId: "skill:foundry-test",
      sourceFamily: "bundled_skill",
      approval: "approved",
    });
    expect(receipt.state).toMatchObject({
      before: "tested",
      after: "promoted",
      compatibility: "compatible",
    });
    expect(receipt.evidencePaths).toEqual(
      expect.arrayContaining(["/tmp/foundry-test", "/tmp/foundry-test/proof.json"]),
    );
  });
});
