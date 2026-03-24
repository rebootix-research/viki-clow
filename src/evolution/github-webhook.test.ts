import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseGitHubWebhookCandidate, verifyGitHubWebhookSignature } from "./github-webhook.js";

describe("evolution github webhook", () => {
  it("verifies a GitHub webhook signature", () => {
    const payload = JSON.stringify({ hello: "world" });
    const secret = "top-secret";
    const signature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
    expect(
      verifyGitHubWebhookSignature({
        payload,
        secret,
        signature256: signature,
      }),
    ).toBe(true);
    expect(
      verifyGitHubWebhookSignature({
        payload,
        secret: "wrong-secret",
        signature256: signature,
      }),
    ).toBe(false);
  });

  it("parses a release webhook into a candidate manifest", () => {
    const payload = JSON.stringify({
      release: {
        name: "vikiclow 2026.3.10",
        tag_name: "v2026.3.10",
        html_url: "https://github.com/vikiclow/vikiclow/releases/tag/v2026.3.10",
      },
      repository: {
        full_name: "vikiclow/vikiclow",
        html_url: "https://github.com/vikiclow/vikiclow",
      },
    });
    const candidate = parseGitHubWebhookCandidate({
      event: "release",
      payload,
      deliveryId: "delivery-1",
    });
    expect(candidate?.id).toBe("delivery-1");
    expect(candidate?.name).toBe("vikiclow 2026.3.10");
    expect(candidate?.source).toBe("github_release");
    expect(candidate?.notes).toContain("vikiclow/vikiclow");
  });
});
