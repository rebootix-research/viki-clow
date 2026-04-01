import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  computeCapabilityFoundrySourceCatalogRevision,
  loadApprovedCapabilitySourceCatalogs,
} from "./source-catalog.js";

describe("Capability Foundry source catalogs", () => {
  it("includes the bundled curated catalogs and produces a stable revision", async () => {
    const catalogs = await loadApprovedCapabilitySourceCatalogs({
      rootDir: process.cwd(),
      includeBuiltins: true,
    });
    expect(catalogs.length).toBeGreaterThan(0);
    expect(catalogs.some((catalog) => catalog.id === "vikiclow.bundled.skills")).toBe(true);
    expect(catalogs.some((catalog) => catalog.entries.some((entry) => entry.bundle))).toBe(true);
    expect(computeCapabilityFoundrySourceCatalogRevision(catalogs)).toHaveLength(12);
  });

  it("loads a repo-approved source catalog deterministically from config files", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vikiclow-foundry-catalog-"));
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
    const catalogs = await loadApprovedCapabilitySourceCatalogs({
      rootDir,
      env: {
        VIKICLOW_FOUNDRY_SOURCE_CATALOG_PATHS: catalogPath,
      } as NodeJS.ProcessEnv,
      includeBuiltins: false,
    });
    expect(catalogs).toHaveLength(1);
    expect(catalogs[0]?.id).toBe("workspace-approved");
    expect(catalogs[0]?.sourcePath).toBe(path.resolve(catalogPath));
    expect(catalogs[0]?.entries[0]?.approval).toBe("approved");
    expect(catalogs[0]?.entries[0]?.dependencies).toEqual(["node", "playwright"]);
    expect(catalogs[0]?.catalogRevision).toHaveLength(12);
  });
});
