# Viki Browser Proof

This artifact captures the browser-lane proof that was added in this continuation pass.

## Visible Browser Path

- `src/cli/browser-cli-extension.test.ts` now verifies the install command prints `Viki Browser Relay` instructions and does not surface the old `VikiClow Browser Relay` wording.
- `src/cli/browser-cli-debug.test.ts` now verifies `trace start` and `trace stop` are routed through the active `vikiclow` profile and emit a trace artifact path.
- `src/browser/config.test.ts` verifies the managed `vikiclow` profile remains the default browser path and that valid hex colors are normalized correctly.
- `src/agents/tools/browser-tool.test.ts` verifies the browser tool description points to the Viki Browser control surface.
- `docs/cli/browser.md`, `docs/tools/browser.md`, `docs/tools/chrome-extension.md`, `docs/tools/browser-linux-troubleshooting.md`, and `docs/zh-CN/tools/browser.md` now present the browser lane with Viki Browser terminology.
- `docs/diagnostics/browser-profile-evidence-proof.md` captures the profile, session, and evidence proof added in this pass.

## Session / Profile / Evidence Surfaces

- `src/browser/session-tab-registry.test.ts` verifies browser tabs are tracked and closed against normalized session keys and normalized profile names.
- `src/browser/bridge-server.auth.test.ts` verifies the browser bridge auth flow and noVNC bootstrap do not leak credentials in the browser path.
- `src/browser/server.agent-contract-snapshot-endpoints.test.ts` and `src/browser/server.agent-contract-form-layout-act-commands.test.ts` cover browser service contract surfaces.

## Verification

- Targeted Vitest run:
  - `corepack pnpm exec vitest run --config vitest.config.ts src/browser/config.test.ts src/agents/tools/browser-tool.test.ts src/cli/browser-cli-extension.test.ts src/cli/browser-cli-debug.test.ts`
  - Result: `67 passed`

## Remaining Internal-Only Branding Notes

- The remaining search hits for `browser service` are internal comments, schema help, and test titles.
- No user-facing `CritterIconRenderer`, `CritterStatusLabel`, or `VikiClow Browser Relay` strings remain in the browser-visible surfaces checked by this pass.
