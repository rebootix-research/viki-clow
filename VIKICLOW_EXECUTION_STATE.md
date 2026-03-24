# VikiClow Execution State

## Current Objective
Public-release closure for `rebootix-research/viki-clow`, with the remaining gaps reduced to explicit environment or compatibility blockers only.

## Completed Workstreams
- Shipped a real packaged Viki Browser launcher path under `dist/`:
  - `dist/viki-browser-launch.mjs`
  - `dist/Viki Browser.cmd`
  - `dist/Viki Browser.ps1`
  - `dist/Viki Browser`
- Closed the live browser proof path:
  - `vikiclow browser verify-native --json` now passes against the real local manifest.
  - browserd now materializes the session-vault and evidence directories it advertises.
  - the native proof now accepts a real on-disk session vault rather than requiring an in-memory-only runtime field.
- Closed the release-proof browser gate:
  - `release:proof` now validates launcher smoke as part of the shipped release artifact.
- Closed the execution-surface proof:
  - local command execution
  - local filesystem write
  - real web fetch with HTTP fallback for local TLS-certificate environments
  - native browser proof
- Closed the live backend proof lane with Docker-backed runtime validation:
  - Temporal connected live at `127.0.0.1:17233`
  - Neo4j-backed Graphiti path connected live at `neo4j://127.0.0.1:17687`
  - runtime stack proof written under `.artifacts/runtime-stack-proof`
- Enforced mandatory voice bootstrap in setup and kept voice bundle installation mandatory in the bundled capability path.
- Rewrote the public product positioning surfaces as a category-defining execution product:
  - `README.md`
  - `docs/index.md`
  - `docs/start/vikiclow.md`
  - `VISION.md`
  - `apps/ios/README.md`
  - `apps/android/README.md`
  - install docs
- Removed additional visible legacy residue from product-facing docs, skills, browser/runtime proof text, iOS share/runtime strings, and the Tlon settings desk namespace.
- Published the repo to GitHub:
  - repo: `https://github.com/rebootix-research/viki-clow`
  - branch: `main`

## In-Progress Workstreams
- None.

## Exact Next Actions
- If another pass is requested, the remaining work is limited to:
  - live LangGraph verification against a real `VIKICLOW_LANGGRAPH_ENDPOINT`
  - shipping a real native CEF browser binary or app bundle instead of launcher-based packaging
  - native macOS verification on a machine with `swift`
  - native Android verification on a machine with `java` or `JAVA_HOME`
  - a deliberate compatibility-breaking rename of the legacy workflow plugin id/path currently preserved as `extensions/lobster/**`

## Blockers
- No live `VIKICLOW_LANGGRAPH_ENDPOINT` was available in this environment, so LangGraph remains adapter-backed rather than service-connected.
- No packaged native CEF browser executable exists under `dist/`; the shipped browser product is real via the launcher-based sibling-process path, but not yet a compiled CEF app bundle.
- Native macOS verification is blocked locally because `swift` is not installed on this machine.
- Native Android verification is blocked locally because `java` and `JAVA_HOME` are not installed on this machine.
- Remaining non-legal legacy residue is now internal compatibility surface only:
  - `extensions/lobster/**`
  - `src/plugin-sdk/lobster.ts`
  - `src/capabilities/bundle.ts` compatibility auto-enable id
  - compatibility allowlist and migration tests
  - legacy path/service detection helpers used for migration support

## Exact Files Changed So Far (This Pass)
- `tsdown.config.ts`
- `src/browser/native-launcher.ts`
- `src/browser/native-launcher.test.ts`
- `src/browser/native-proof.ts`
- `src/browser/native-proof.test.ts`
- `src/browser/browserd.ts`
- `src/browser/browserd.test.ts`
- `src/execution/surface-proof.ts`
- `scripts/execution-surface-proof.ts`
- `scripts/release-proof.ts`
- `scripts/release-check.ts`
- `scripts/runtime-stack-proof.ts`
- `scripts/write-browser-launchers.ts`
- `docker-compose.runtime-stack.yml`
- `.env.example`
- `package.json`
- `src/commands/onboard-non-interactive/local.ts`
- `src/commands/onboard-non-interactive/local/output.ts`
- `src/commands/onboard-non-interactive.gateway.test.ts`
- `src/capabilities/bundle.ts`
- `src/capabilities/bundle.test.ts`
- `src/missions/types.ts`
- `src/missions/backbone.ts`
- `src/missions/backbone-materializer.ts`
- `src/missions/orchestration.ts`
- `src/missions/runtime.test.ts`
- `src/commands/agent.mission-runtime.test.ts`
- `src/cli/mission-cli.ts`
- `src/memory/backend-config.ts`
- `src/memory/backend-config.test.ts`
- `src/memory/batch-voyage.ts`
- `src/plugin-sdk/workflow-runtime.ts`
- `skills/gh-issues/SKILL.md`
- `README.md`
- `docs/index.md`
- `docs/start/vikiclow.md`
- `VISION.md`
- `docs/install/updating.md`
- `docs/install/railway.mdx`
- `docs/zh-CN/install/updating.md`
- `docs/zh-CN/install/railway.mdx`
- `docs/zh-CN/tools/workflow.md`
- `docs/zh-CN/tools/lobster.md`
- `docs/zh-CN/automation/cron-vs-heartbeat.md`
- `docs/zh-CN/tools/llm-task.md`
- `apps/ios/README.md`
- `apps/android/README.md`
- `apps/ios/ShareExtension/ShareViewController.swift`
- `apps/ios/Sources/Model/NodeAppModel.swift`
- `src/commands/doctor-gateway-services.ts`
- `extensions/tlon/src/settings.ts`
- `extensions/tlon/src/monitor/index.ts`
- `extensions/lobster/README.md`
- `VIKICLOW_EXECUTION_STATE.md`

## Tests Run So Far (This Pass)
- `corepack pnpm exec vitest run --config vitest.config.ts src/browser/native-launcher.test.ts src/browser/native-proof.test.ts` - passed (`2` files / `5` tests)
- `corepack pnpm exec vitest run --config vitest.config.ts src/browser/browserd.test.ts src/browser/native-proof.test.ts src/browser/native-launcher.test.ts` - passed (`3` files / `6` tests)
- `corepack pnpm exec vitest run --config vitest.config.ts src/memory/backend-config.test.ts src/memory/graphiti-backbone.test.ts src/missions/runtime.test.ts src/commands/agent.mission-runtime.test.ts` - passed (`4` files / `17` tests)
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false` - passed
- `corepack pnpm build` - passed
- `corepack pnpm execution:proof` - passed
- `corepack pnpm runtime:stack:proof` - passed
- `corepack pnpm release:proof` - passed
- `node .\vikiclow.mjs browser verify-native --json` - passed
- Residue sweep:
  - `rg -n "OpenClaw|Open Claw|OpenClow|Open Clow|Lobster|lobster|vikiclowbot|moltbot" docs src extensions package.json skills apps -g "!dist/**" -g "!node_modules/**" -g "!LICENSE*" -g "!NOTICE*" -g "!THIRD_PARTY_NOTICES*"`
  - result narrowed to internal compatibility-only surfaces
- Publish lane:
  - `git init -b main`
  - `git config user.name "Rebootix Research"`
  - `git config user.email "rebootix-research@users.noreply.github.com"`
  - `git add -A`
  - `git commit -m "Initial publish: Vikiclow 2026.3.9"`
  - `gh repo create rebootix-research/viki-clow --public --source=. --remote=origin --push`

## Artifact Paths So Far (This Pass)
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\viki-browser-launch.mjs`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.cmd`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.ps1`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\execution-surface\execution-surface-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\execution-surface\execution-surface-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\runtime-stack-proof\runtime-stack-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\runtime-stack-proof\runtime-stack-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\runtime-stack-proof\runtime-stack-ps.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\release-proof\release-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\release-proof\release-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\release-proof\vikiclow-2026.3.9.tgz`
- `C:\Users\Nabeel Saleem\.vikiclow\browserd\manifest.json`
- `C:\Users\Nabeel Saleem\.vikiclow\browserd\native-proof.json`
- `C:\Users\Nabeel Saleem\.vikiclow\missions\backbone\mission-af9ad417-30ab-41ba-b0e0-bb79cd615c6d\proof.json`
- `C:\Users\Nabeel Saleem\.vikiclow\memory\graphiti\main\proof.json`

## Final Publish Status
- Repository created and pushed: `https://github.com/rebootix-research/viki-clow`
- Remote: `origin`
- Default branch: `main`
- Current publish commit before final tag/release: `b3c83e4`
