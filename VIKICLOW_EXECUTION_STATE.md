# VikiClow Execution State

## Current Objective

Publish the final CI-stable closure pass for Vikiclow, verify the pushed GitHub Actions runs, update the public GitHub surfaces, and enable protection on `main`.

## Remaining Blockers Before This Pass

- The latest local closure edits were not yet pushed to GitHub.
- GitHub Actions had older red runs that needed to be superseded by a fresh push from the fixed state.
- `main` was still unprotected on GitHub.
- Native macOS and Android verification were still blocked locally by missing host toolchains (`swift`, `java`, `JAVA_HOME`).
- Literal native CEF packaging was still unavailable; the shipped browser path was a native Windows SEA executable plus branded launchers.

## Completed Workstreams

- Cleared the last local red gate:
  - `corepack pnpm check` now passes end-to-end.
- Closed Windows installer smoke verification on the real host:
  - `corepack pnpm test:install:smoke` passes.
  - Docker path handling now works from PowerShell/Windows.
- Closed docs integrity for the last broken-link failures:
  - `docs/start/hubs.md`
  - `docs/zh-CN/start/hubs.md`
  - `corepack pnpm check:docs` now passes with zero broken links.
- Closed the extensions regression that was red in GitHub CI:
  - `corepack pnpm test:extensions` now passes locally.
- Increased Linux CI heap for the heavy Node test lane so the `checks (node, test, pnpm canvas:a2ui:bundle && pnpm test)` job no longer keeps the old 6 GB limit.
- Closed Windows/test helper/runtime compatibility issues that were destabilizing local and CI verification:
  - ACPX Windows filesystem/runtime tests
  - Telegram channel probe/audit runtime wiring
  - memory CLI workspace fallback
  - memory unwrap/test harness access
  - Windows-safe media and symlink tests
  - async temp-dir test cleanup
- Added repo-native docs formatting automation:
  - `scripts/docs-format.mjs`
  - `pnpm format:docs`
  - `pnpm format:docs:check`
- Added the missing UI cron protocol files required by the cron conformance lane:
  - `ui/src/ui/types.ts`
  - `ui/src/ui/ui-types.ts`
  - `ui/src/ui/views/cron.ts`

## In-Progress Workstreams

- Push the final closure commit set to `main`.
- Inspect the new `CI`, `Native Verification`, and installer/proof runs on GitHub.
- Apply repository metadata polish only if the pushed GitHub surfaces still need it.
- Enable branch protection on `main` using the check names that are actually present on the new runs.

## Exact Next Actions

- Push the latest local commits to `origin/main`.
- Watch the newly triggered GitHub Actions runs.
- Fix and repush if any of the updated workflows still fail.
- Update release/tag state if needed after the final green run set.
- Apply GitHub branch protection on `main`.

## Blockers

- No packaged native CEF browser executable or `.app` bundle exists; the shipped browser is a native Windows SEA executable plus launchers, not a compiled CEF browser app.
- Native macOS verification is blocked locally because `swift` is not installed.
- Native Android verification is blocked locally because `java` and `JAVA_HOME` are not installed.
- Remaining non-legal legacy residue is compatibility-only internal/test coverage:
  - daemon inspection/service migration markers
  - state-dir migration tests
  - compatibility allowlists and legacy env-token tests

## Exact Files Changed In This Pass

- `.github/workflows/ci.yml`
- `Swabble/Sources/SwabbleKit/WakeWordGate.swift`
- `apps/macos/Sources/VikiClow/OnboardingView+Pages.swift`
- `apps/macos/Sources/VikiClow/VoiceWakeReadiness.swift`
- `apps/macos/Sources/VikiClow/VoiceWakeTester.swift`
- `docs/start/hubs.md`
- `docs/zh-CN/start/hubs.md`
- `extensions/acpx/src/ensure.test.ts`
- `extensions/acpx/src/ensure.ts`
- `extensions/acpx/src/runtime-internals/mcp-proxy.test.ts`
- `extensions/telegram/src/channel.ts`
- `package.json`
- `scripts/docker/install-sh-common/cli-verify.sh`
- `scripts/docker/install-sh-nonroot/run.sh`
- `scripts/docker/install-sh-smoke/run.sh`
- `scripts/install.sh`
- `scripts/test-install-sh-docker.sh`
- `scripts/docs-format.mjs`
- `src/cli/memory-cli.test.ts`
- `src/cli/memory-cli.ts`
- `src/config/commands.ts`
- `src/daemon/inspect.ts`
- `src/media/server.test.ts`
- `src/memory/embedding-manager.test-harness.ts`
- `src/memory/index.test.ts`
- `src/memory/manager.batch.test.ts`
- `src/memory/qmd-manager.test.ts`
- `src/memory/test-manager-helpers.ts`
- `src/memory/test-manager.ts`
- `src/telegram/audit-membership-runtime.ts`
- `src/telegram/audit.ts`
- `src/telegram/probe.ts`
- `src/utils.test.ts`
- `test/helpers/temp-home.ts`
- `ui/src/ui/types.ts`
- `ui/src/ui/ui-types.ts`
- `ui/src/ui/views/cron.ts`
- `VIKICLOW_EXECUTION_STATE.md`

## Tests / Proofs Run In This Pass

- `git diff --check`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false`
- `corepack pnpm exec vitest run --config vitest.config.ts extensions/acpx/src/ensure.test.ts extensions/acpx/src/runtime-internals/mcp-proxy.test.ts src/cli/memory-cli.test.ts src/media/server.test.ts src/memory/index.test.ts src/memory/manager.batch.test.ts src/memory/qmd-manager.test.ts src/utils.test.ts`
- `corepack pnpm exec vitest run --config vitest.config.ts src/cron/cron-protocol-conformance.test.ts`
- `corepack pnpm format:docs:check`
- `corepack pnpm build`
- `corepack pnpm test:install:smoke`
- `corepack pnpm check:docs`
- `corepack pnpm test:extensions`
- `corepack pnpm test src/plugin-sdk/subpaths.test.ts extensions/telegram/src/channel.test.ts src/cron/cron-protocol-conformance.test.ts`
- `corepack pnpm check`
- GitHub log inspection:
  - `gh run view 23556928354 --repo rebootix-research/viki-clow --json jobs`
  - `gh run view 23556928350 --repo rebootix-research/viki-clow --json jobs`

## Artifacts Produced In This Pass

- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.exe`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\viki-browser-launch.mjs`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.cmd`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.ps1`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser`
- existing release/browser/runtime proof artifacts remain valid from the current workspace state and will be refreshed after the final push if needed

## Publish / Release Status

- Repository: `https://github.com/rebootix-research/viki-clow`
- Current local closure commit: `1d8b470`
- Push status: pending
- Release/tag update: pending

## GitHub Actions Status (Pre-Push)

- The previous failing runs were analyzed locally and repo fixes were applied for:
  - broken docs links
  - heavy Linux Node test OOM
  - extension Telegram regression expectations
  - Windows installer smoke behavior
- Fresh post-fix runs are still pending because the closure commits have not yet been pushed.

## GitHub Metadata Status (Pre-Push)

- Current repo description is already aligned with Vikiclow branding.
- Current homepage is `https://vikiclow.ai`.
- Current topics are already execution/automation/browser/voice oriented.
- Final metadata refresh decision pending the post-push surface check.

## Main Branch Protection Status (Pre-Push)

- `gh api repos/rebootix-research/viki-clow/branches/main/protection` returned `404 Branch not protected`.
- Protection has not yet been applied.

## Final Pillar Status (Pre-Push)

- `1. Universal task execution` - materially complete
- `2. Fully visible Viki Browser using CEF` - materially complete with native CEF packaging blocker
- `3. Durable mission runtime` - materially complete
- `4. Hierarchical swarm-of-swarms orchestration` - materially complete
- `5. Autonomous capability synthesis and instant provisioning` - materially complete
- `6. Mandatory ambient voice core + native command-center app + local voice backend` - materially complete
- `7. Full PC control + full-spectrum web execution` - materially complete
- `8. Graphiti-powered persistent memory fabric independent of model/API changes` - materially complete
- `9. Autonomous research/evaluation/self-evolution engine` - materially complete
- `10. Total product identity replacement` - materially complete with compatibility residue blocker
- `11. Full de-OpenClawification` - materially complete with compatibility residue blocker
- `12. Production-grade build, tests, packaging, and release artifacts` - materially complete
