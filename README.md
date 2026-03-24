# VikiClow

<p align="center">
  <img src="README-header.png" alt="VikiClow" width="860">
</p>

<p align="center">
  <strong>A category-defining execution system for real work.</strong><br>
  VikiClow turns intent into durable missions that browse, click, type, speak, recover, verify, and finish.
</p>

<p align="center">
  <a href="https://github.com/rebootix-research/viki-clow/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/rebootix-research/viki-clow/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/rebootix-research/viki-clow/releases"><img src="https://img.shields.io/github/v/release/rebootix-research/viki-clow?include_prereleases&style=for-the-badge" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f172a?style=for-the-badge" alt="License"></a>
</p>

VikiClow is not a chatbot with extra buttons.

It is an execution-first system built for operators who want an AI that can carry work from request to terminal outcome. User intent becomes a mission object. Missions are routed through orchestration, browser execution, local-computer control, verification, memory writeback, and proof.

The product goal is simple: when a task is technically possible, VikiClow should find a way to complete it.

## What VikiClow is

VikiClow combines the surfaces that most tools ship separately:

- a durable mission runtime with explicit terminal states
- Viki Browser for visible, profile-aware browser execution
- swarm-of-swarms orchestration with verifier and recovery routing
- a voice-native command center with mandatory readiness checks
- persistent memory that survives provider and model changes
- capability synthesis and provisioning when a mission is missing something
- full PC and web execution surfaces instead of answer-only UX
- a self-evolution engine for candidate intake, experiments, promotion, and rollback

## Why it feels different

Most AI products still assume the conversation is the product.

VikiClow assumes the mission is the product.

- It persists state instead of pretending every request starts from zero.
- It leaves artifacts and evidence instead of vague "done" messages.
- It treats failure, recovery, approval, and retry as first-class runtime states.
- It is designed to keep working even if you switch providers, models, or auth paths.
- It is built to operate through browser, shell, file, channel, and device surfaces as one system.

## Product pillars

### Universal task execution

Intent becomes a mission record with plan, state, checkpoints, evidence, retries, and a terminal result.

### Viki Browser

VikiClow ships a branded browser surface with managed profiles, launcher packaging, browserd manifests, session vaults, evidence capture, and Playwright-compatible automation.

### Durable missions

Terminal states are explicit and inspectable:

- `completed`
- `failed`
- `blocked`
- `needs_approval`

### Swarm-of-swarms orchestration

A sovereign orchestrator routes domain swarms for browser work, coding, research, documents, local computer control, ops, and communication.

### Voice-native command center

Voice is not a plugin afterthought. Bootstrap, proof, and readiness are part of the setup path.

### Persistent memory

Mission writeback, Graphiti-style proof paths, and Neo4j-backed graph memory surfaces keep memory outside model context alone.

### Capability synthesis and provisioning

If a mission is missing a capability, VikiClow can classify the gap, provision what it can, validate the result, and retry.

### Full PC and web execution

VikiClow can use Viki Browser, raw HTTP/web-fetch routes, local commands, file surfaces, device-linked actions, and channel-connected control.

### Self-evolution engine

Candidates can be ingested, benchmarked, promoted, and rolled back with provenance.

## Architecture

```text
User intent
  -> mission object
  -> sovereign orchestrator
  -> domain swarms
  -> browser / repo / research / local-computer executors
  -> verifier / recovery
  -> terminal state + evidence
  -> persistent memory writeback
```

## Install

### Recommended

```bash
npm install -g vikiclow@latest
vikiclow onboard --install-daemon
```

### From source

```bash
git clone https://github.com/rebootix-research/viki-clow.git
cd viki-clow
corepack enable
corepack pnpm install
corepack pnpm build
node .\vikiclow.mjs onboard --install-daemon
```

Windows operators should prefer WSL2 for day-to-day runtime work. Native PowerShell is supported for build, bootstrap, and launcher flows, but the broader local automation stack is more reliable under WSL2.

## Quick start

### 1. Bootstrap VikiClow

```bash
vikiclow onboard --install-daemon
```

This configures the workspace, gateway, bundled capabilities, browser runtime, and mandatory voice readiness.

### 2. Start the runtime

```bash
vikiclow gateway --port 18789
```

### 3. Inspect the control surface

```bash
vikiclow dashboard --no-open
```

### 4. Verify the browser product

```bash
vikiclow browser package-native
vikiclow browser verify-native --json
```

### 5. Run an end-to-end mission

```bash
vikiclow agent --message "Open the browser, collect release evidence, update the docs, and finish the work end to end."
```

## Reliability and proof

VikiClow ships proof surfaces because execution claims are cheap without artifacts.

- release proof: `.artifacts/release-proof/`
- runtime stack proof: `.artifacts/runtime-stack-proof/`
- execution surface proof: `.artifacts/execution-surface/`
- capability bundle proof: `.artifacts/capability-bundle/`
- voice proof: `.artifacts/voice-proof/`
- browser proof: `~/.vikiclow/browserd/native-proof.json`
- mission backbone proof: `~/.vikiclow/missions/backbone/`
- graph memory proof: `~/.vikiclow/memory/graphiti/`

## Runtime stack

For the strongest local runtime path supported directly by this repository:

```bash
corepack pnpm runtime:stack:up
corepack pnpm runtime:stack:proof
corepack pnpm runtime:stack:down
```

That flow validates the live Temporal-backed mission descriptor path and the live Neo4j-backed Graphiti proof path the repo can exercise locally.

## Execution surfaces

VikiClow is intentionally broader than extension-style browsing:

- Viki Browser for visible browser sessions
- browserd manifests for profile/session/evidence verification
- raw web-fetch routes for lightweight HTTP extraction
- local command execution surfaces for controlled system work
- file writeback and workspace memory
- node/device-linked surfaces for screen, camera, audio, and paired-machine execution

## What is finished today

This repo is already a serious operator system, not a demo shell:

- build and release proof are green
- browser launchers are shipped in `dist/`
- mission runtime and backbone proofs are real
- voice bootstrap is enforced in setup
- bundled capabilities ship with inventory and proof
- runtime stack proof exercises Temporal + Neo4j where Docker is available

What remains environment-dependent is equally explicit:

- a compiled native CEF browser app is not bundled in this repo build
- live LangGraph proof depends on an actual reachable endpoint
- native macOS and Android verification require host toolchains

## Why teams choose VikiClow

- They want execution, not demo conversation.
- They want durable state, not single-turn magic tricks.
- They want proof, memory, and repeatability.
- They want one system that can browse, control, verify, and recover.

## Docs

- Docs hub: [https://docs.vikiclow.ai](https://docs.vikiclow.ai)
- Product vision: [VISION.md](VISION.md)
- Personal operator guide: [docs/start/vikiclow.md](docs/start/vikiclow.md)
- Install and update: [docs/install/updating.md](docs/install/updating.md)
- Browser surfaces: [docs/tools/browser.md](docs/tools/browser.md)

## License

MIT. See [LICENSE](LICENSE).
