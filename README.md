# VikiClow

<p align="center">
  <img src="README-header.png" alt="VikiClow" width="860">
</p>

<p align="center">
  <strong>The execution-grade clow/operator system for people who want finished work, not fluent excuses.</strong><br>
  <strong>VikiClow is the clow that compounds capability.</strong><br>
  It discovers, executes, verifies, remembers, and expands instead of stopping at a good answer.
</p>

<p align="center">
  <a href="https://github.com/rebootix-research/viki-clow/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/rebootix-research/viki-clow/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/rebootix-research/viki-clow/actions/workflows/native-verification.yml"><img src="https://img.shields.io/github/actions/workflow/status/rebootix-research/viki-clow/native-verification.yml?branch=main&style=for-the-badge" alt="Native verification"></a>
  <a href="https://github.com/rebootix-research/viki-clow/releases"><img src="https://img.shields.io/github/v/release/rebootix-research/viki-clow?include_prereleases&style=for-the-badge" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f172a?style=for-the-badge" alt="License"></a>
</p>

<p align="center">
  <a href="https://docs.vikiclow.ai">Docs</a>
  &middot; <a href="docs/start/vikiclow.md">Operator guide</a>
  &middot; <a href="docs/tools/vikiclow-skills.md">Capability Foundry</a>
  &middot; <a href=".artifacts/release-proof/release-proof.md">Release proof</a>
  &middot; <a href=".artifacts/runtime-stack-proof/runtime-stack-proof.md">Runtime stack proof</a>
</p>

VikiClow is not another clow that stops at conversation.

OpenClaw defines a broad personal-assistant surface across channels. NemoClaw hardens that model inside a sandboxed reference stack. Clawith pushes toward collaborative multi-agent workspaces. VikiClow takes a different line: durable missions, visible execution, proof, memory, and capability growth in one operator system.

You give it an objective, it turns that objective into a mission, routes the mission through swarms and executors, verifies the result, and records the evidence. When a mission needs a capability that is not already present, Capability Foundry can discover, classify, sandbox, test, promote, and register a compatible one instead of stalling.

## One-screen explanation

VikiClow combines the parts most clow projects keep separate:

- a durable mission runtime with explicit terminal states
- Viki Browser for visible browser work with managed profiles and proof
- swarm-of-swarms orchestration with verifier and recovery routing
- a voice-native command center with mandatory readiness checks
- persistent memory that survives provider and model changes
- Capability Foundry for curated discovery, promotion, bundling, and routing of proven capabilities
- full PC and web execution surfaces instead of answer-only UX
- a self-evolution engine for candidate intake, experiments, promotion, and rollback

The result is a clow that compounds capability over time instead of resetting to a blank prompt loop every session.

## Category benchmark

VikiClow sits in the same public category as OpenClaw, NemoClaw, and Clawith, but it solves a different problem shape. OpenClaw positions a personal assistant across channels. NemoClaw positions a hardened OpenShell reference stack for running OpenClaw more safely. Clawith positions a multi-agent collaboration platform for teams. VikiClow positions the full execution loop: mission durability, visible execution, proof, memory, and curated capability growth in one stack.

| Dimension                          | VikiClow                                                                                                 | [OpenClaw](https://github.com/openclaw/openclaw)                                           | [NemoClaw](https://github.com/NVIDIA/NemoClaw)                                     | [Clawith](https://github.com/dataelement/Clawith)                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Public repo positioning            | Execution-grade clow/operator system                                                                     | Personal AI assistant across channels                                                      | Hardened OpenShell reference stack for OpenClaw                                    | Multi-agent collaboration platform for teams                                            |
| Durable runtime model              | Explicit missions, checkpoints, terminal states, verifier writeback                                      | Not explicit on the public repo surface                                                    | State management and hardened blueprint are explicit, but the repo is marked alpha | Persistent identity, triggers, focus items, and workspaces are explicit                 |
| Visible execution surface          | Viki Browser plus shell, file, voice, device, and web routes                                             | Messaging channels plus a live Canvas are explicit                                         | Container runtime and sandbox are explicit; browser surface is not                 | Team workspace and agent UI are explicit; browser operator surface is not               |
| Proof and evidence discipline      | Release proof, runtime-stack proof, execution-surface proof, mission proof                               | CI and releases are visible; proof artifacts are not front-and-center                      | Security policy and release notes are explicit; proof-first surfaces are not       | Whitepaper, docs, and product UI are visible; proof artifact discipline is not explicit |
| Capability growth model            | Capability Foundry with curated discovery, sandboxing, scoring, promotion, bundling, and runtime routing | Adjacent skills ecosystem and directory are visible                                        | Runtime hardening is the emphasis, not a capability promotion pipeline             | Runtime tool discovery and install are explicit via Smithery and ModelScope             |
| Persistent state and memory        | Mission writeback plus Neo4j-backed graph-memory proof paths                                             | Always-on assistant framing is explicit; memory strategy is not front-and-center in README | Sandboxed state management is explicit                                             | Long-term memory, soul, and private workspaces are explicit                             |
| Governance and operator discipline | Protected main, green CI, release-proof surfaces, explicit terminal states                               | CI and release posture are visible                                                         | Security posture is central                                                        | Multi-tenant RBAC, approvals, audit logs, and quotas are explicit                       |

Comparison is grounded in the public repository surfaces linked above as of 2026-04-02. It compares what those repos clearly present, not hidden implementation details or invented benchmark numbers.

## Why VikiClow wins

Other clow projects usually dominate one slice of the problem:

- OpenClaw gives broad personal-assistant reach across channels.
- NemoClaw hardens that model inside a sandboxed runtime.
- Clawith pushes deeply into multi-agent organizational collaboration.

VikiClow wins when the requirement is not just interaction, but finished work with operator discipline:

- **Durable missions instead of session-only chat.** Objectives become inspectable mission records with retries, checkpoints, explicit terminal states, and recovery paths.
- **Proof instead of vibes.** Release proof, runtime-stack proof, execution-surface proof, browser proof, voice proof, and mission backbone proof ship with the product.
- **Visible browser work, not invisible browsing.** Viki Browser gives the operator a branded browser surface with profiles, manifests, evidence paths, and native packaging flows.
- **Capability growth as a supply chain, not an afterthought.** Capability Foundry treats skills, plugins, MCP servers, repo integrations, and runtime assets as curated candidates that must be tested and promoted before use.
- **Persistent writeback instead of disposable context.** Mission outcomes, graph-memory proof paths, and capability routing history survive restart and provider changes.
- **Release discipline built into the repo.** Protected main, green CI, and release-proof workflows are part of the shipped operating model, not internal hygiene hidden from users.

If OpenClaw is a personal assistant, NemoClaw is a hardened reference stack, and Clawith is a multi-agent workplace, VikiClow is the execution-grade clow that turns intent into durable finished work.

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

Mission writeback, Graphiti-style proof paths, and Neo4j-backed graph memory keep memory outside model context alone.

### Capability Foundry

Capability Foundry is VikiClow's controlled supply chain for new capability:

- discover curated source families and candidate integrations
- classify them as skills, plugins, MCP servers, repo integrations, or asset dependencies
- fetch or install them from approved sources
- sandbox and test them before promotion
- promote or reject them with recorded reasons
- bundle proven winners into the shipped system
- register them into runtime routing so VikiClow can choose the right capability for the task
- persist inventory, provenance, receipts, and usage knowledge so future missions learn from successful runs

It is intentionally curated rather than crawler-driven. The shipped catalog favors bundled VikiClow skills and plugins, approved MCP servers, selected upstream repo integrations, and runtime assets that have a clear place in the mission stack.

Capability Foundry is exposed through the CLI, proof artifacts, the bundled capability inventory, and the runtime routing layer.

Key commands:

- `vikiclow capabilities foundry discover`
- `vikiclow capabilities foundry ingest <candidate-id>`
- `vikiclow capabilities foundry test <candidate-id>`
- `vikiclow capabilities foundry promote <candidate-id> --bundle`
- `vikiclow capabilities foundry routes "<objective>"`
- `corepack pnpm capabilities:proof`

The shipped inventory is explicit and inspectable:

- source catalog: `~/.vikiclow/capabilities/source-catalog.json`
- bundle receipts: `~/.vikiclow/capabilities/bundle-receipts.json`
- ready capability inventory: `~/.vikiclow/capabilities/bundle-inventory.json`
- proof bundle: `.artifacts/capability-bundle/`

### Full PC and web execution

VikiClow can use Viki Browser, raw HTTP and web-fetch routes, local commands, file surfaces, device-linked actions, and channel-connected control.

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

```text
Capability Foundry
  -> discover curated sources
  -> classify and fetch candidates
  -> sandbox / test / score
  -> promote or reject
  -> bundle and register
  -> route at runtime
  -> remember success
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
node .\\vikiclow.mjs onboard --install-daemon
```

Windows operators should prefer WSL2 for day-to-day runtime work. Native PowerShell is supported for build, bootstrap, launcher, and proof flows, but the broader local automation stack is more reliable under WSL2.

## Quick start

### 1. Bootstrap VikiClow

```bash
vikiclow onboard --install-daemon
```

This configures the workspace, gateway, bundled capabilities, browser runtime, Capability Foundry inventory, and mandatory voice readiness.

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

### 5. Inspect and refresh capability inventory

```bash
vikiclow capabilities list
vikiclow capabilities discover "publish a browser workflow"
vikiclow capabilities fetch playwright browser_profiles
vikiclow capabilities bundle
vikiclow capabilities bootstrap
vikiclow capabilities plan "create a reusable automation skill"
corepack pnpm capabilities:proof
```

### 6. Run an end-to-end mission

```bash
vikiclow agent --message "Open the browser, collect release evidence, update the docs, and finish the work end to end."
```

## Reliability and proof

VikiClow ships proof surfaces because execution claims are cheap without artifacts.

- release proof: `.artifacts/release-proof/`
- runtime stack proof: `.artifacts/runtime-stack-proof/`
- execution surface proof: `.artifacts/execution-surface/`
- Capability Foundry proof: `.artifacts/capability-bundle/`
- voice proof: `.artifacts/voice-proof/`
- browser proof: `~/.vikiclow/browserd/native-proof.json`
- mission backbone proof: `~/.vikiclow/missions/backbone/`
- graph memory proof: `~/.vikiclow/memory/graphiti/`

Use `corepack pnpm capabilities:proof` to regenerate the Capability Foundry proof bundle locally.

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
- browserd manifests for profile, session, and evidence verification
- raw web-fetch routes for lightweight HTTP extraction
- local command execution surfaces for controlled system work
- file writeback and workspace memory
- node and device-linked surfaces for screen, camera, audio, and paired-machine execution

## What is finished today

This repo is already a serious operator system, not a demo shell:

- build and release proof are green
- browser launchers are shipped in `dist/`
- mission runtime and backbone proofs are real
- voice bootstrap is enforced in setup
- Capability Foundry ships with inventory, provenance, routing, proof, and bundle receipts
- the bundled catalog distinguishes curated local skills, bundled plugins, MCP server candidates, GitHub integrations, and runtime assets
- runtime stack proof exercises Temporal, LangGraph, and Neo4j where Docker is available

What remains environment-dependent is equally explicit:

- a compiled native CEF browser app is not bundled in this repo build
- native macOS and Android verification require host toolchains

## Why teams choose VikiClow

- They want execution, not demo conversation.
- They want durable state, not single-turn magic tricks.
- They want proof, memory, and repeatability.
- They want one system that can browse, control, verify, discover, and recover.
- They want a clow that compounds capability instead of staying frozen at install time.

## Docs

- Docs hub: [https://docs.vikiclow.ai](https://docs.vikiclow.ai)
- Product vision: [VISION.md](VISION.md)
- Personal operator guide: [docs/start/vikiclow.md](docs/start/vikiclow.md)
- Capability Foundry guide: [docs/tools/vikiclow-skills.md](docs/tools/vikiclow-skills.md)
- CI and proof: [docs/ci.md](docs/ci.md)
- Install and update: [docs/install/updating.md](docs/install/updating.md)
- Browser surfaces: [docs/tools/browser.md](docs/tools/browser.md)

## License

MIT. See [LICENSE](LICENSE).
