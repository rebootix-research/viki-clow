import crypto from "node:crypto";
import type { EvolutionCandidate } from "./types.js";

function stripSha256Prefix(signature: string): string {
  return signature.replace(/^sha256=/i, "").trim();
}

export function verifyGitHubWebhookSignature(params: {
  payload: string;
  secret: string;
  signature256: string;
}): boolean {
  const expected = crypto.createHmac("sha256", params.secret).update(params.payload).digest("hex");
  const actual = stripSha256Prefix(params.signature256);
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(actual, "utf8"));
}

function stringValue(input: unknown): string | undefined {
  return typeof input === "string" && input.trim() ? input.trim() : undefined;
}

export function parseGitHubWebhookCandidate(params: {
  event: string;
  payload: string;
  deliveryId?: string;
}): EvolutionCandidate | null {
  const parsed = JSON.parse(params.payload) as Record<string, unknown>;
  if (params.event !== "release") {
    return null;
  }
  const release = parsed.release as Record<string, unknown> | undefined;
  const repository = parsed.repository as Record<string, unknown> | undefined;
  const name =
    stringValue(release?.name) ??
    stringValue(release?.tag_name) ??
    stringValue(repository?.full_name) ??
    "github-release";
  const sourceUrl =
    stringValue(release?.html_url) ??
    stringValue(repository?.html_url) ??
    stringValue(parsed.sender && (parsed.sender as Record<string, unknown>).html_url);
  const repoName = stringValue(repository?.full_name);
  return {
    id: params.deliveryId?.trim() || crypto.createHash("sha1").update(params.payload).digest("hex"),
    name,
    kind: "repo",
    source: "github_release",
    sourceUrl,
    receivedAt: new Date().toISOString(),
    status: "intake",
    notes: repoName ? `Repository: ${repoName}` : undefined,
    tags: [params.event].filter(Boolean),
    digest: crypto.createHash("sha256").update(params.payload).digest("hex"),
  };
}
