# VikiClow Execution State

## Current Objective
Strengthen GitHub Actions coverage for native/browser/runtime verification so post-push CI exposes the remaining environment-backed gaps directly and keeps the native lanes zero-red.

## Remaining Blockers Before This Pass
- Native browser packaging was launcher-backed but not yet producing a shipped Windows executable.
- Workflow plugin renaming had not fully cleared its test/runtime path.
- LangGraph live verification needed a rebuilt probe path instead of metadata-only proof.
- Product-facing legacy repo URLs and a few public-facing legacy strings still remained.
- Native macOS and Android verification were still blocked by missing host toolchains (`swift`, `java` / `JAVA_HOME`).

## Completed Workstreams
- Added a dedicated `Native Verification` GitHub Actions workflow:
  - Windows native-browser packaging + verification
  - Ubuntu runtime-stack proof
  - Ubuntu voice bootstrap proof
  - macOS Swift/native push coverage
- Strengthened the main `CI` workflow:
  - macOS now runs on pushes to `main`, not only PRs
  - Android now uploads unit-test reports and the debug APK as artifacts
- Validated the edited workflow files locally with YAML parsing and `actionlint`.
- Closed the shipped native Windows browser path:
  - `dist/Viki Browser.exe`
  - `dist/viki-browser-launch.mjs`
  - `dist/Viki Browser.cmd`
  - `dist/Viki Browser.ps1`
  - `dist/Viki Browser`
- Closed browser proof at the product CLI layer:
  - `vikiclow browser package-native --json` now builds the native executable on Windows.
  - `vikiclow browser verify-native --json` now passes with a ready session vault and evidence store.
  - direct launcher and direct executable probe runs both return `product: "Viki Browser"`.
- Closed the workflow plugin identity/runtime migration:
  - renamed the bundled workflow extension from `extensions/lobster/**` to `extensions/workflow/**`
  - removed `src/plugin-sdk/lobster.ts`
  - aligned plugin-sdk export and Vitest aliasing on `vikiclow/plugin-sdk/workflow`
  - restored green workflow plugin tests on Windows
- Closed the live runtime stack proof with a rebuilt LangGraph service:
  - Temporal connected live
  - LangGraph connected live and invoked a real graph (`sovereign -> verifier`)
  - Neo4j-backed Graphiti memory path connected live
- Closed the public identity sweep for the remaining visible product surfaces:
  - normalized lingering `vikiclow/vikiclow` repo URLs to `rebootix-research/viki-clow`
  - scrubbed remaining easy public-facing legacy references from changelog/test fixture surfaces
  - left only deliberate migration/compatibility markers in internal/runtime support code
- Kept mandatory voice bootstrap/readiness enforced in setup, with existing voice proof still valid.
- Refreshed public-facing product surfaces so the repo reads like a premium execution platform:
  - `README.md`
  - `VISION.md`
  - top-level docs/install docs/app READMEs

## In-Progress Workstreams
- Final commit, push, and GitHub release update.
- Final identity cleanup on GitHub-facing docs/scripts/product text.

## Exact Next Actions
- Push the workflow changes.
- Inspect the first `CI` and `Native Verification` runs on GitHub.
- Download `runtime-stack-proof`, `voice-proof`, `native-browser-windows`, `native-browser-proof`, `android-test-report`, and `android-debug-apk` from the first successful run.
- Commit the closure-pass repo state.
- Rebuild once on the final commit SHA so `dist/build-info.json` matches the final head.
- Rerun `release:proof` on the final commit.
- Push `main`.
- Publish a final GitHub tag/release for this closure pass.

## Blockers
- No packaged native CEF browser binary or `.app` bundle exists; the shipped native browser is a Windows SEA executable plus launcher-based sibling-process surface, not a compiled CEF app.
- Native macOS verification is blocked locally because `swift` is not installed.
- Native Android verification is blocked locally because `java` and `JAVA_HOME` are not installed.
- Remaining non-legal legacy residue is internal compatibility only:
  - `src/daemon/inspect.ts`
  - `src/daemon/constants.ts`
  - `src/config/paths.ts`
  - `src/commands/doctor-config-flow.ts`
  - migration/compatibility tests referencing legacy state dirs or service names
  - `apps/macos/Sources/VikiClow/PeekabooBridgeHostCoordinator.swift`
  - `scripts/install.sh` legacy state detection
  - unresolved external repo references that were not changed because the replacement target could not be verified from this environment:
    - `CONTRIBUTING.md` (`vikiclow/trust`)
    - `docs/install/nix.md`
    - `docs/security/CONTRIBUTING-THREAT-MODEL.md`

## Exact Files Changed In This Pass
- `.github/workflows/ci.yml`
- `.github/workflows/native-verification.yml`
- `VIKICLOW_EXECUTION_STATE.md`
- `vitest.config.ts`
- `CHANGELOG.md`
- `apps/macos/Tests/VikiClowIPCTests/ChannelsSettingsSmokeTests.swift`
- `src/browser/native-proof.ts`
- `src/browser/native-proof.test.ts`
- `scripts/runtime-stack-proof.ts`
- bulk repo URL normalization across product/docs/scripts surfaces from `vikiclow/vikiclow` to `rebootix-research/viki-clow`
- plus the already-active closure-pass files still pending commit in this repo state
- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/install/ansible.md`
- `docs/security/CONTRIBUTING-THREAT-MODEL.md`
- `scripts/update-clawtributors.ts`

## Tests / Proofs Run In This Pass
- local workflow YAML parse for:
  - `.github/workflows/ci.yml`
  - `.github/workflows/native-verification.yml`
- `git diff --check`
- local `actionlint` for:
  - `.github/workflows/ci.yml`
  - `.github/workflows/native-verification.yml`
- `corepack pnpm exec vitest run --config vitest.config.ts extensions/workflow/src/workflow-spawn.test.ts extensions/workflow/src/workflow-tool.test.ts`
- `corepack pnpm exec vitest run --config vitest.config.ts src/browser/native-launcher.test.ts src/browser/native-proof.test.ts src/browser/native-packager.test.ts src/browser/browserd.test.ts extensions/workflow/src/workflow-spawn.test.ts extensions/workflow/src/workflow-tool.test.ts src/memory/backend-config.test.ts src/memory/graphiti-backbone.test.ts src/missions/runtime.test.ts src/commands/agent.mission-runtime.test.ts src/capabilities/bundle.test.ts src/commands/onboard-non-interactive.gateway.test.ts`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false`
- `corepack pnpm build`
- `node .\\dist\\viki-browser-launch.mjs --probe --json`
- `& 'C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\dist\\Viki Browser.exe' --probe --json`
- `node .\\vikiclow.mjs browser package-native --json`
- `node .\\vikiclow.mjs browser verify-native --json`
- `corepack pnpm execution:proof`
- `corepack pnpm runtime:stack:proof`
- `corepack pnpm release:proof`
- `Get-Command swift`
- `Get-Command java`
- residue sweeps with `rg` over product/runtime/doc surfaces
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false`
- targeted residue sweeps over `AGENTS.md`, `CONTRIBUTING.md`, `docs/install/ansible.md`, and `scripts/update-clawtributors.ts`

## Artifacts Produced In This Pass
- No new local product artifacts were generated for the workflow-only CI closure edit.
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\dist\\Viki Browser.exe`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\dist\\viki-browser-launch.mjs`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\execution-surface\\execution-surface-proof.json`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\execution-surface\\execution-surface-proof.md`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\runtime-stack-proof\\runtime-stack-proof.json`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\runtime-stack-proof\\runtime-stack-proof.md`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\runtime-stack-proof\\runtime-stack-ps.json`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\release-proof\\release-proof.json`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\release-proof\\release-proof.md`
- `C:\\Users\\Nabeel Saleem\\Desktop\\viki clow\\.artifacts\\release-proof\\vikiclow-2026.3.9.tgz`
- `C:\\Users\\Nabeel Saleem\\.vikiclow\\browserd\\manifest.json`
- `C:\\Users\\Nabeel Saleem\\.vikiclow\\browserd\\native-proof.json`

## Publish / Release Status
- Repository already exists: `https://github.com/rebootix-research/viki-clow`
- Branch targeted for final closure push: `main`
- Final closure tag/release: pending this commit

## Final Pillar Status (Pre-Push)
- `1. Universal task execution` — materially complete
- `2. Fully visible Viki Browser using CEF` — materially complete with native-packaging blocker
- `3. Durable mission runtime` — materially complete
- `4. Hierarchical swarm-of-swarms orchestration` — materially complete
- `5. Autonomous capability synthesis and instant provisioning` — materially complete
- `6. Mandatory ambient voice core + native command-center app + local voice backend` — materially complete
- `7. Full PC control + full-spectrum web execution` — materially complete
- `8. Graphiti-powered persistent memory fabric independent of model/API changes` — materially complete
- `9. Autonomous research/evaluation/self-evolution engine` — materially complete
- `10. Total product identity replacement` — materially complete with compatibility residue blocker
- `11. Full de-OpenClawification` — materially complete with compatibility residue blocker
- `12. Production-grade build, tests, packaging, and release artifacts` — materially complete
