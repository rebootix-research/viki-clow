import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadApprovedFoundryCatalog } from "./foundry-catalog.js";

const tempDirs: string[] = [];

async function tempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0, tempDirs.length).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("Capability Foundry catalog", () => {
  it("loads curated families with supported source families and bundled ready capabilities", async () => {
    const catalog = await loadApprovedFoundryCatalog({
      rootDir: process.cwd(),
    });

    expect(catalog.supportedSources).toEqual(
      expect.arrayContaining([
        "bundled_skill:skill",
        "bundled_plugin:plugin",
        "curated_mcp:mcp_server",
        "curated_repo:repo_integration",
        "curated_asset:asset_dependency",
      ]),
    );
    expect(catalog.sourceCatalogRevision).toMatch(/^[a-f0-9]{12}$/u);
    expect(catalog.entries.some((entry) => entry.sourceFamily === "bundled_skill")).toBe(true);
    expect(catalog.entries.some((entry) => entry.sourceFamily === "curated_mcp")).toBe(true);
    expect(catalog.entries.some((entry) => entry.sourceFamily === "curated_repo")).toBe(true);
    expect(catalog.entries.some((entry) => entry.sourceFamily === "curated_asset")).toBe(true);
    expect(catalog.entries.some((entry) => entry.approval === "approved")).toBe(true);
  });

  it("merges an override catalog from disk without losing curated source normalization", async () => {
    const rootDir = await tempDir("vikiclow-foundry-catalog-");
    const overrideDir = await tempDir("vikiclow-foundry-catalog-override-");
    const overridePath = path.join(overrideDir, "foundry-sources.json");
    await fs.writeFile(
      overridePath,
      JSON.stringify(
        {
          version: 1,
          id: "custom.catalog",
          generatedAt: "2026-04-02T00:00:00.000Z",
          updatedAt: "2026-04-02T00:00:00.000Z",
          entries: [
            {
              id: "plugin:custom",
              name: "Custom Plugin",
              family: "bundled_plugin",
              kind: "plugin",
              sourceUrl: "https://example.invalid/custom-plugin",
              installMethod: "plugin_enable",
              dependencies: ["node"],
              provenance: { repository: "example/custom-plugin" },
              routeHints: ["custom"],
              approval: "approved",
              bundle: true,
              description: "Custom bundled plugin",
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const catalog = await loadApprovedFoundryCatalog({
      rootDir,
      env: {
        ...process.env,
        VIKICLOW_FOUNDRY_CATALOG_PATH: overridePath,
      },
    });

    expect(catalog.entries.some((entry) => entry.id === "plugin:custom")).toBe(true);
    expect(catalog.entries.find((entry) => entry.id === "plugin:custom")?.sourceFamily).toBe(
      "bundled_plugin",
    );
  });
});
