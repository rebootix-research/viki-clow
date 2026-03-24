import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectVoiceBootstrapProof } from "./bootstrap-proof.js";

describe("voice bootstrap proof", () => {
  it("proves the mandatory voice bootstrap surfaces are still wired", async () => {
    const proof = await collectVoiceBootstrapProof(path.resolve(process.cwd()));

    expect(proof.passed).toBe(true);
    expect(proof.checks.some((check) => check.id === "install-sh-required-voice" && check.passed)).toBe(
      true,
    );
    expect(
      proof.checks.some((check) => check.id === "mac-onboarding-voice-gate" && check.passed),
    ).toBe(true);
    expect(
      proof.checks.some(
        (check) => check.id === "android-voice-readiness-presenter" && check.passed,
      ),
    ).toBe(true);
  });
});
