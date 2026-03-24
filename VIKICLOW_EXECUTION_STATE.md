# VikiClow Execution State

## Current Objective
Close the still-partial deep pillars with shipped native-browser launchers, enforced mandatory voice bootstrap in setup, deeper mission-backbone adapter wiring, and a narrowed residue list that isolates only compatibility internals and unavailable live backends or toolchains.

## Completed Workstreams
- Shipped a real packaged Viki Browser launcher path under `dist/`:
  - `dist/viki-browser-launch.mjs`
  - `dist/Viki Browser.cmd`
  - `dist/Viki Browser.ps1`
  - `dist/Viki Browser`
- Wired the browser launcher generation into the real build and release path so `build`, `build:strict-smoke`, and release proof require those launchers.
- Tightened native-browser verification:
  - `vikiclow browser verify-native --json` passes with packaged launcher candidates present in `dist/`.
  - Native proof writes a real JSON artifact under `~/.vikiclow/browserd/native-proof.json`.
- Enforced mandatory voice bootstrap in non-interactive setup through the real onboarding path:
  - local non-interactive onboarding now bundles capabilities, persists bundle inventory location, and fails if voice readiness is false.
- Strengthened bundled capability behavior for setup readiness:
  - mandatory voice skills (`sherpa-onnx-tts`, `openai-whisper`) auto-install even when general skill auto-install is disabled.
  - successful Whisper provisioning seeds a default `WHISPER_MODEL`.
- Pushed browser and memory state into the persisted mission backbone:
  - mission materialization now persists browserd and native-browser status alongside Temporal and LangGraph.
  - mission materialization now persists Graphiti and Neo4j proof status alongside Temporal and LangGraph.
- Expanded the execution prompt and mission CLI so the live runtime now exposes:
  - Viki Browser boundary
  - Graphiti boundary
  - native and browser proof paths
  - memory proof paths
- Reduced remaining product-facing residue:
  - cleaned the last visible `lobster` wording from the Chinese workflow docs and workflow-related operational docs that still showed up in the sweep.
- Closed the public docs and identity lane on the requested top-level surfaces:
  - rewrote the README and public product copy to position VikiClow as an execution system, not a chatbot
  - normalized remaining `Vikiclow` casing drift on the requested public docs and app READMEs
  - cleaned the last requested legacy-facing doctor prompt string to `pre-VikiClow`
  - reran a focused residue sweep on the requested surfaces with no remaining hits
- Closed the backend live-stack lane with a real Docker-backed proof:
  - added `docker-compose.runtime-stack.yml` with isolated host ports for Temporal and Neo4j
  - added `scripts/runtime-stack-proof.ts` to bring up the stack, run a real mission, and write proof artifacts
  - extended memory backend config so Graphiti and Neo4j env overrides can drive the runtime directly
  - proved Temporal connected at `127.0.0.1:17233` and Neo4j-backed Graphiti connected at `neo4j://127.0.0.1:17687`

## In-Progress Workstreams
- None.

## Exact Next Actions
- If a future pass is requested, the remaining work is limited to:
  - live LangGraph verification against a real `VIKICLOW_LANGGRAPH_ENDPOINT`
  - native macOS and Android verification on hosts that actually have `swift` and `java` or `JAVA_HOME`
  - a deliberate compatibility-breaking decision on whether to rename the legacy `lobster` plugin id and path itself
  - a real packaged native CEF or desktop browser binary if the product should move beyond the launcher-based native browser path shipped now

## Blockers
- No live LangGraph endpoint was reachable from this machine, so the LangGraph layer is still adapter and materialization-backed rather than service-connected.
- No packaged native CEF browser executable exists under `dist/`; the shipped native-browser path is real via launchers and control-service wiring, but not a compiled CEF binary or app bundle.
- Native macOS verification is blocked locally because `swift` is unavailable.
- Native Android verification is blocked locally because `java` or `JAVA_HOME` are unavailable.
- Remaining non-legal legacy residue is now internal compatibility surface only:
  - bundled workflow plugin id and path compatibility in `extensions/lobster/**`
  - internal compatibility exports such as `src/plugin-sdk/lobster.ts`
  - compatibility allowlist tests that intentionally preserve the alias
  - `src/capabilities/bundle.ts` auto-enables the compatibility plugin id `lobster`

## Exact Files Changed So Far (This Pass)
- `src/browser/native-launcher.ts`
- `src/browser/native-launcher.test.ts`
- `src/browser/native-proof.ts`
- `src/cli/browser-cli-manage.ts`
- `scripts/write-browser-launchers.ts`
- `scripts/release-proof.ts`
- `scripts/release-check.ts`
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
- `src/cli/mission-cli.ts`
- `src/plugin-sdk/workflow-runtime.ts`
- `docs/zh-CN/tools/workflow.md`
- `docs/zh-CN/tools/lobster.md`
- `docs/zh-CN/automation/cron-vs-heartbeat.md`
- `docs/zh-CN/tools/llm-task.md`
- `extensions/lobster/README.md`
- `README.md`
- `docs/index.md`
- `docs/start/vikiclow.md`
- `VISION.md`
- `apps/ios/README.md`
- `apps/android/README.md`
- `docs/install/updating.md`
- `docs/install/railway.mdx`
- `src/commands/doctor-gateway-services.ts`
- `docker-compose.runtime-stack.yml`
- `.env.example`
- `scripts/runtime-stack-proof.ts`
- `src/memory/backend-config.ts`
- `src/memory/backend-config.test.ts`
- `VIKICLOW_EXECUTION_STATE.md`

## Tests Run So Far (This Pass)
- `corepack pnpm exec vitest run --config vitest.config.ts src/browser/native-launcher.test.ts src/browser/native-proof.test.ts src/voice/runtime-bootstrap.test.ts src/capabilities/bundle.test.ts src/commands/onboard-non-interactive.gateway.test.ts src/missions/runtime.test.ts src/commands/agent.mission-runtime.test.ts` - passed (`7` files / `19` tests)
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false` - passed
- `corepack pnpm build` - passed
- `corepack pnpm capabilities:proof` - passed
- `node .\vikiclow.mjs browser verify-native --json` - passed
- `corepack pnpm release:proof` - passed
- Residue sweep:
  - `rg -n "OpenClaw|Open Claw|OpenClow|Open Clow|Lobster|lobster" docs src extensions package.json skills --glob '!dist/**' --glob '!node_modules/**' --glob '!LICENSE*' --glob '!NOTICE*' --glob '!THIRD_PARTY_NOTICES*'`
  - completed and narrowed the residue list to internal compatibility surfaces plus one internal plugin auto-enable id
- Docs and identity lane verification:
  - `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false` - passed after the doctor prompt casing change
  - `rg -n "Vikiclow|vikiclowbot|moltbot|OpenClaw|Open Claw|OpenClow|Open Clow|Lobster|lobster|personal AI assistant|super-alpha|extremely alpha|internal-use only" README.md docs/index.md docs/start/vikiclow.md VISION.md apps/ios/README.md apps/android/README.md docs/install/updating.md docs/install/railway.mdx src/commands/doctor-gateway-services.ts` - no hits
- Backend live-stack verification:
  - `corepack pnpm install` - passed
  - `corepack pnpm exec vitest run --config vitest.config.ts src/memory/backend-config.test.ts src/memory/graphiti-backbone.test.ts src/missions/runtime.test.ts src/commands/agent.mission-runtime.test.ts` - passed (`4` files / `17` tests)
  - `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false` - passed after backend env override fixes
  - `corepack pnpm runtime:stack:proof` - passed with live Temporal and Neo4j-backed Graphiti

## Artifact Paths So Far (This Pass)
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\viki-browser-launch.mjs`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.cmd`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser.ps1`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\dist\Viki Browser`
- `C:\Users\Nabeel Saleem\.vikiclow\browserd\native-proof.json`
- `C:\Users\Nabeel Saleem\.vikiclow\browserd\manifest.json`
- `C:\Users\Nabeel Saleem\.vikiclow\capabilities\bundle-inventory.json`
- `C:\Users\Nabeel Saleem\.vikiclow\capabilities\bundle-inventory.md`
- `C:\Users\Nabeel Saleem\.vikiclow\missions\backbone\mission-80e35cd5-d33b-403c-bb77-0588c2ef6cb8\proof.json`
- `C:\Users\Nabeel Saleem\.vikiclow\memory\graphiti\main\proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\capability-bundle\capability-bundle-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\capability-bundle\capability-bundle-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\capability-bundle\browser-proof\native-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\capability-bundle\voice-proof\voice-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\capability-bundle\voice-proof\voice-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\release-proof\release-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\release-proof\release-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\release-proof\vikiclow-2026.3.9.tgz`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\runtime-stack-proof\runtime-stack-proof.json`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\runtime-stack-proof\runtime-stack-proof.md`
- `C:\Users\Nabeel Saleem\Desktop\viki clow\.artifacts\runtime-stack-proof\runtime-stack-ps.json`
