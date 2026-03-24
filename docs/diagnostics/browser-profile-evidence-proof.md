# Viki Browser Profile and Evidence Proof

This artifact captures the browser-profile and evidence-surface proof added in this continuation pass.

## Profile Surface

- `src/browser/config.test.ts` proves the managed `vikiclow` browser path stays the default and the browser color config normalizes correctly.
- `src/browser/server.post-tabs-open-profile-unknown-returns-404.test.ts` covers profile creation, duplicate rejection, and delete behavior.
- `src/browser/routes/basic.ts` exposes the `/profiles` surface used by the CLI and the browser service.

## Session Surface

- `src/browser/session-tab-registry.test.ts` proves session-key normalization, tab tracking, deduplication, and cleanup.
- `src/browser/bridge-server.auth.test.ts` proves browser bridge auth and sandbox bootstrap do not leak credentials.

## Evidence Surface

- `src/browser/server.agent-contract-snapshot-endpoints.test.ts` and `src/browser/server.agent-contract-form-layout-act-commands.test.ts` cover snapshot, screenshot, act, upload, download, PDF, and trace-adjacent browser evidence flows.
- `src/cli/browser-cli-debug.test.ts` now proves `trace start` and `trace stop` are routed through the active `vikiclow` browser profile and emit a trace artifact path.

## Visible Branding

- The browser-visible docs now use Viki Browser and Viki Browser Relay terminology.
- The browser-visible runtime strings checked in this pass no longer show old relay branding.
