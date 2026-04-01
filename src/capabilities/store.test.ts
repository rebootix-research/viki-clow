import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadCapabilityFoundryRegistry, saveCapabilityFoundryRegistry } from "./store.js";
import type { CapabilityFoundryCandidate, CapabilityFoundryRegistry } from "./types.js";

function makeCandidate(catalogPath: string): CapabilityFoundryCandidate {
  return {
    id: "repo:browser-automation",
    name: "Browser Automation Repo",
    type: "repo_integration",
    summary: "Approved browser automation integration.",
    compatibility: "compatible",
    scope: "optional",
    state: "promoted",
    source: {
      kind: "github_repo",
      sourceUrl: "https://github.com/example/browser-automation",
      repo: "example/browser-automation",
      ref: "main",
      installMethod: "git_clone",
      dependencies: ["node", "playwright"],
      notes: "curated",
    },
    sourceCatalogId: "workspace-approved",
    sourceCatalogEntryId: "repo:browser-automation",
    sourceFamily: "curated_repo",
    approval: "approved",
    classification: {
      objectiveHints: ["browser", "automation"],
      tags: ["browser", "automation"],
      selectionNotes: ["approved source catalog"],
    },
    lifecycleReceipt: {
      discoveredAt: "2026-04-02T00:00:00.000Z",
      fetchedAt: "2026-04-02T00:00:01.000Z",
      inspectedAt: "2026-04-02T00:00:02.000Z",
      sandboxedAt: "2026-04-02T00:00:03.000Z",
      testedAt: "2026-04-02T00:00:04.000Z",
      promotedAt: "2026-04-02T00:00:05.000Z",
    },
    installReceipt: {
      startedAt: "2026-04-02T00:00:01.000Z",
      finishedAt: "2026-04-02T00:00:02.000Z",
      method: "git_clone",
      command: ["git", "clone", "https://github.com/example/browser-automation"],
      artifactPath: path.join(path.dirname(catalogPath), "browser-automation"),
      status: "success",
      summary: "cloned repository",
    },
    scoreReceipt: {
      scoredAt: "2026-04-02T00:00:04.000Z",
      score: 17,
      verdict: "promote",
      reasons: ["approved", "browser", "automation"],
      evaluator: "foundry",
    },
    provenance: {
      version: "main",
      license: "MIT",
      sourceRef: "main",
      repository: "example/browser-automation",
      homepage: "https://github.com/example/browser-automation",
      dependencies: ["node", "playwright"],
      fetchedFrom: catalogPath,
    },
    test: {
      status: "passed",
      summary: "Repo test passed",
      testedAt: "2026-04-02T00:00:04.000Z",
      proofPath: path.join(path.dirname(catalogPath), "proof.json"),
    },
    registration: {
      kind: "repo_integration",
      targetId: "browser-automation",
      entrypoint: "package.json",
      path: path.dirname(catalogPath),
      autoBundled: false,
      routeHints: ["browser", "automation"],
      usageRecipe: "Use when you need browser automation.",
    },
    usage: {
      suggested: 1,
      success: 2,
      failure: 0,
      lastOutcome: "success",
      lastUsedAt: "2026-04-02T00:00:06.000Z",
    },
  };
}

describe("Capability Foundry registry persistence", () => {
  it("persists source catalogs, provenance, and receipts", async () => {
    const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-state-"));
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-root-"));
    const catalogPath = path.join(rootDir, ".vikiclow", "capabilities", "sources.json");
    await fs.mkdir(path.dirname(catalogPath), { recursive: true });
    await fs.writeFile(
      catalogPath,
      `${JSON.stringify(
        {
          version: 1,
          id: "workspace-approved",
          generatedAt: "2026-04-02T00:00:00.000Z",
          updatedAt: "2026-04-02T00:00:00.000Z",
          entries: [
            {
              id: "repo:browser-automation",
              name: "Browser Automation Repo",
              family: "curated_repo",
              kind: "repo_integration",
              sourceUrl: "https://github.com/example/browser-automation",
              ref: "main",
              installMethod: "git_clone",
              dependencies: ["node", "playwright"],
              provenance: {
                repository: "example/browser-automation",
                homepage: "https://github.com/example/browser-automation",
                license: "MIT",
              },
              routeHints: ["browser", "automation"],
              approval: "approved",
              bundle: false,
              testCommand: ["pnpm", "test"],
              description: "Approved browser automation integration.",
              notes: ["repo-catalog"],
            },
          ],
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const env = {
      VIKICLOW_STATE_DIR: stateDir,
      VIKICLOW_FOUNDRY_SOURCE_CATALOG_PATHS: catalogPath,
    } as NodeJS.ProcessEnv;
    const initial = await loadCapabilityFoundryRegistry(env);
    const sourceCatalogs = initial.sourceCatalogs ?? [];
    const registry: CapabilityFoundryRegistry = {
      version: 1,
      generatedAt: "2026-04-02T00:00:00.000Z",
      updatedAt: "2026-04-02T00:00:00.000Z",
      sourceCatalogRevision: initial.sourceCatalogRevision,
      workspaceDir: rootDir,
      supportedSources: [],
      sourceCatalogs: [...sourceCatalogs],
      candidates: [makeCandidate(catalogPath)],
      usage: [],
    };

    await saveCapabilityFoundryRegistry(registry, env);
    const loaded = await loadCapabilityFoundryRegistry(env);
    expect(loaded.sourceCatalogs?.some((catalog) => catalog.id === "workspace-approved")).toBe(
      true,
    );
    expect(loaded.sourceCatalogs?.some((catalog) => catalog.id === "vikiclow.bundled.skills")).toBe(
      true,
    );
    expect(loaded.supportedSources.length).toBeGreaterThan(0);
    expect(loaded.sourceCatalogRevision).toHaveLength(12);
    expect(loaded.candidates[0]?.installReceipt?.status).toBe("success");
    expect(loaded.candidates[0]?.scoreReceipt?.verdict).toBe("promote");
    expect(loaded.candidates[0]?.lifecycleReceipt?.promotedAt).toBe("2026-04-02T00:00:05.000Z");
    expect(loaded.candidates[0]?.provenance.repository).toBe("example/browser-automation");
  });
});
