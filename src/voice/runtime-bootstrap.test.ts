import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withTempHome } from "../config/test-helpers.js";
import { ensureVoiceRuntimeBootstrap } from "./runtime-bootstrap.js";

describe("voice runtime bootstrap", () => {
  it("creates the required runtime voice scaffold and manifest", async () => {
    await withTempHome(async () => {
      const status = await ensureVoiceRuntimeBootstrap({
        cfg: {
          plugins: {
            entries: {
              "talk-voice": { enabled: true },
              "phone-control": { enabled: true },
              "device-pair": { enabled: true },
            },
          },
          skills: {
            entries: {
              "sherpa-onnx-tts": {
                env: {
                  SHERPA_ONNX_RUNTIME_DIR: "/tmp/runtime",
                  SHERPA_ONNX_MODEL_DIR: "/tmp/model",
                },
              },
              "openai-whisper": {
                env: {
                  WHISPER_MODEL: "turbo",
                },
              },
            },
          },
        },
      });

      expect(status.ready).toBe(true);
      expect(status.localBackends.whisperConfigured).toBe(true);
      await expect(fs.readFile(status.manifestPath, "utf8")).resolves.toContain('"required": true');
      await expect(fs.access(path.join(status.dirs.base, "tts"))).resolves.toBeUndefined();
    });
  });
});
