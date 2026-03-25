import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { withTempHome } from "../config/test-helpers.js";
import { writeBrowserdManifestForState } from "./browserd.js";
import type { BrowserServerState } from "./server-context.js";

describe("browserd manifest", () => {
  it("writes a persisted Viki Browser sibling-process manifest", async () => {
    await withTempHome(async () => {
      const state = {
        server: null,
        port: 18791,
        resolved: {
          enabled: true,
          defaultProfile: "vikiclow",
          profiles: {
            vikiclow: {
              name: "vikiclow",
              color: "#11847E",
              driver: "vikiclow",
              cdpPort: 18800,
              cdpUrl: "http://127.0.0.1:18800",
              cdpIsLoopback: true,
              cdpProtocol: "http",
              cdpHost: "127.0.0.1",
              attachOnly: false,
            },
          },
        },
        profiles: new Map([
          [
            "vikiclow",
            {
              profile: {
                name: "vikiclow",
                color: "#11847E",
                driver: "vikiclow",
                cdpPort: 18800,
                cdpUrl: "http://127.0.0.1:18800",
                cdpIsLoopback: true,
                cdpProtocol: "http",
                cdpHost: "127.0.0.1",
                attachOnly: false,
              },
              running: {
                pid: 4242,
                exe: {
                  kind: "chrome",
                  path: "/tmp/chrome",
                },
                userDataDir: "/tmp/vikiclow/browser/user-data",
                cdpPort: 18800,
                startedAt: Date.now(),
                proc: null as never,
              },
              lastTargetId: null,
              reconcile: null,
            },
          ],
        ]),
      } as unknown as BrowserServerState;

      const manifest = await writeBrowserdManifestForState({
        state,
        reason: "unit-test",
        profileStatuses: [
          {
            name: "vikiclow",
            cdpPort: 18800,
            cdpUrl: "http://127.0.0.1:18800",
            color: "#11847E",
            running: true,
            tabCount: 3,
            isDefault: true,
            isRemote: false,
          },
        ],
      });

      expect(manifest.service).toBe("browserd");
      expect(manifest.product).toBe("Viki Browser");
      const profile = manifest.profiles[0];
      expect(profile?.tabCount).toBe(3);
      expect(profile?.sessionVaultDir).toContain("browser");
      if (!profile) {
        throw new Error("Expected browserd manifest profile");
      }
      await expect(fs.access(profile.sessionVaultDir)).resolves.toBeUndefined();
      await expect(fs.access(profile.evidenceDir)).resolves.toBeUndefined();
      await expect(fs.readFile(manifest.manifestPath, "utf8")).resolves.toContain(
        '"product": "Viki Browser"',
      );
    });
  });
});
