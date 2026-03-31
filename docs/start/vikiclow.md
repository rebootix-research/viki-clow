---
summary: "Operator guide for running VikiClow as a durable execution system."
read_when:
  - Onboarding a dedicated VikiClow instance
  - Deciding how to run VikiClow safely on a personal machine
title: "Running VikiClow as Your Execution System"
---

# Running VikiClow as your execution system

VikiClow is strongest when it is treated like an operator endpoint you own.

That means:

- one trusted operator boundary
- one durable workspace
- one visible browser runtime
- one memory backbone
- one bundled capability set that is ready before the first serious mission
- one Capability Foundry inventory that records what can be discovered, promoted, and routed

## What VikiClow can do

VikiClow is built to execute, not only answer.

It can:

- browse with managed profiles and evidence capture
- run durable missions with explicit terminal states
- speak, transcribe, and keep voice readiness visible
- use local-computer and device-linked execution paths
- persist writeback and graph-style memory across runs
- discover curated capabilities, sandbox them, promote them, and register them at runtime

## Recommended operator shape

```mermaid
flowchart TB
  A["Your devices"] --> B["VikiClow gateway"]
  B --> C["Mission runtime"]
  B --> D["Viki Browser"]
  B --> E["Voice runtime"]
  B --> F["Persistent memory"]
  B --> G["Capability Foundry"]
```

## Fast setup

### 1. Install and onboard

```bash
vikiclow onboard --install-daemon
```

That path now expects:

- bundled capability bootstrap
- mandatory voice readiness
- browser runtime support
- Capability Foundry inventory and proof
- mission and memory state directories

### 2. Start the gateway

```bash
vikiclow gateway --port 18789
```

### 3. Verify the execution surfaces

```bash
vikiclow browser verify-native --json
vikiclow memory graphiti status
corepack pnpm execution:proof
corepack pnpm capabilities:proof
```

The capability proof refreshes the bundled inventory, provenance, routing hints, and proof artifacts so you can confirm the Capability Foundry lane is healthy before a serious mission.

### 4. Inspect capability routing

```bash
vikiclow capabilities list
vikiclow capabilities discover "publish a browser workflow"
vikiclow capabilities fetch playwright browser_profiles
vikiclow capabilities foundry discover
vikiclow capabilities foundry routes "create a reusable browser workflow skill"
vikiclow capabilities plan "create a reusable automation skill"
vikiclow capabilities bundle
```

### 5. Run a real mission

```bash
vikiclow agent --message "Open the release dashboard, verify the browser session, and finish the task end to end."
```

## Stronger local runtime

If you want the strongest local mission + memory path this repository can verify directly:

```bash
corepack pnpm runtime:stack:up
corepack pnpm runtime:stack:proof
corepack pnpm runtime:stack:down
```

That live proof exercises:

- Temporal-backed mission connectivity
- Neo4j-backed graph memory connectivity
- mission creation, completion, writeback, and graph-backed search

## Workspace model

By default the durable workspace lives under `~/.vikiclow/workspace`.

It is part of the runtime contract, not just prompt text:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `HEARTBEAT.md`
- mission writeback under `memory/`
- Capability Foundry inventory under `capabilities/foundry/`

## Operational stance

Recommended defaults:

- keep tool access narrow until trust is established
- use approvals for high-impact actions
- inspect proofs and backbones, not just replies
- treat browser, memory, and capability artifacts as the real audit trail

## Next docs

- [Getting started](/start/getting-started)
- [Browser](/tools/browser)
- [Memory](/concepts/memory)
- [Security](/gateway/security)
- [Capability Foundry](/tools/vikiclow-skills)
