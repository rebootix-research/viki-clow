<div align="center">

<!-- BANNER SVG -->

<svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#050A14"/>
      <stop offset="100%" style="stop-color:#0A1628"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00D4FF"/>
      <stop offset="100%" style="stop-color:#0066FF"/>
    </linearGradient>
    <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00D4FF;stop-opacity:0"/>
      <stop offset="50%" style="stop-color:#00D4FF;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#00D4FF;stop-opacity:0"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textGlow">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->

  <rect width="900" height="280" fill="url(#bg)" rx="12"/>

  <!-- Grid lines horizontal -->

  <line x1="0" y1="56" x2="900" y2="56" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.15"/>
  <line x1="0" y1="112" x2="900" y2="112" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.15"/>
  <line x1="0" y1="168" x2="900" y2="168" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.15"/>
  <line x1="0" y1="224" x2="900" y2="224" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.15"/>

  <!-- Grid lines vertical -->

  <line x1="150" y1="0" x2="150" y2="280" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.1"/>
  <line x1="300" y1="0" x2="300" y2="280" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.1"/>
  <line x1="450" y1="0" x2="450" y2="280" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.1"/>
  <line x1="600" y1="0" x2="600" y2="280" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.1"/>
  <line x1="750" y1="0" x2="750" y2="280" stroke="#00D4FF" stroke-width="0.3" stroke-opacity="0.1"/>

  <!-- Corner brackets -->

  <path d="M20,20 L20,50 M20,20 L50,20" stroke="#00D4FF" stroke-width="2" fill="none" filter="url(#glow)"/>
  <path d="M880,20 L880,50 M880,20 L850,20" stroke="#00D4FF" stroke-width="2" fill="none" filter="url(#glow)"/>
  <path d="M20,260 L20,230 M20,260 L50,260" stroke="#00D4FF" stroke-width="2" fill="none" filter="url(#glow)"/>
  <path d="M880,260 L880,230 M880,260 L850,260" stroke="#00D4FF" stroke-width="2" fill="none" filter="url(#glow)"/>

  <!-- Top accent line -->

  <rect x="0" y="0" width="900" height="3" fill="url(#accent)" rx="2"/>

  <!-- Bottom accent line -->

  <rect x="0" y="277" width="900" height="3" fill="url(#accent)" rx="2"/>

  <!-- Left circuit decoration -->

  <path d="M60,80 L60,140 L90,140 L90,160 L120,160" stroke="#00D4FF" stroke-width="1.5" fill="none" stroke-opacity="0.5" filter="url(#glow)"/>
  <circle cx="60" cy="80" r="3" fill="#00D4FF" fill-opacity="0.6" filter="url(#glow)"/>
  <circle cx="120" cy="160" r="3" fill="#00D4FF" fill-opacity="0.6" filter="url(#glow)"/>

  <!-- Right circuit decoration -->

  <path d="M840,100 L840,160 L810,160 L810,180 L780,180" stroke="#00D4FF" stroke-width="1.5" fill="none" stroke-opacity="0.5" filter="url(#glow)"/>
  <circle cx="840" cy="100" r="3" fill="#00D4FF" fill-opacity="0.6" filter="url(#glow)"/>
  <circle cx="780" cy="180" r="3" fill="#00D4FF" fill-opacity="0.6" filter="url(#glow)"/>

  <!-- Rebootix logo mark — small top left -->

<text x="42" y="44" font-family="monospace" font-size="10" fill="#00D4FF" fill-opacity="0.7" letter-spacing="3">REBOOTIX RESEARCH</text>

  <!-- Main title: VIKICLOW -->

<text x="450" y="145" font-family="'Courier New', monospace" font-size="72" font-weight="900" text-anchor="middle" fill="url(#accent)" filter="url(#textGlow)" letter-spacing="8">VIKICLOW</text>

  <!-- Subtitle -->

<text x="450" y="185" font-family="monospace" font-size="14" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.75" letter-spacing="4">EXECUTION-FIRST  ·  AI RUNTIME  ·  MISSION DRIVEN</text>

  <!-- Horizontal glow line under subtitle -->

  <rect x="200" y="196" width="500" height="1" fill="url(#glowLine)" opacity="0.8"/>

  <!-- Bottom status line -->

<text x="450" y="240" font-family="monospace" font-size="11" text-anchor="middle" fill="#00D4FF" fill-opacity="0.6" letter-spacing="2">[ BUILD: GREEN ]  ·  [ MISSIONS: DURABLE ]  ·  [ PROOF: SHIPPED ]</text>

  <!-- Version tag -->

  <rect x="768" y="32" width="110" height="22" rx="4" fill="#00D4FF" fill-opacity="0.12" stroke="#00D4FF" stroke-width="1" stroke-opacity="0.4"/>
  <text x="823" y="47" font-family="monospace" font-size="11" text-anchor="middle" fill="#00D4FF" letter-spacing="1">v2026.3.9</text>
</svg>

<br/>

[![CI](https://img.shields.io/github/actions/workflow/status/rebootix-research/viki-clow/ci.yml?branch=main&style=flat-square&label=CI&color=00D4FF&labelColor=050A14)](https://github.com/rebootix-research/viki-clow/actions/workflows/ci.yml)
[![Native Verification](https://img.shields.io/github/actions/workflow/status/rebootix-research/viki-clow/native-verification.yml?branch=main&style=flat-square&label=Native+Verification&color=00D4FF&labelColor=050A14)](https://github.com/rebootix-research/viki-clow/actions/workflows/native-verification.yml)
[![Release](https://img.shields.io/github/v/release/rebootix-research/viki-clow?include_prereleases&style=flat-square&color=0066FF&labelColor=050A14)](https://github.com/rebootix-research/viki-clow/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-00D4FF?style=flat-square&labelColor=050A14)](https://github.com/rebootix-research/viki-clow/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-87%25-0066FF?style=flat-square&labelColor=050A14)](https://github.com/rebootix-research/viki-clow)

</div>

-----

<div align="center">

### The AI runtime that actually finishes the job.

**VikiClow doesn’t chat. It executes.**<br/>
It takes your intent, builds a mission, runs it across browser, shell, voice, file, and device surfaces — and hands you back proof.

[**Get Started →**](#install) · [**See the Architecture →**](#architecture) · [**Docs**](https://docs.vikiclow.ai) · [**Vision**](./VISION.md)

</div>

-----

## Why VikiClow Exists

Most “AI agents” are chat wrappers with a tool call bolted on. They forget what they were doing the moment you close the tab. They say “done” and leave no trace. They stall when a capability is missing.

**VikiClow is the opposite.**

|What others do                |What VikiClow does                                              |
|------------------------------|----------------------------------------------------------------|
|One-turn, stateless requests  |Durable missions with checkpoints and retries                   |
|Vague “done” confirmations    |Proof artifacts: release, browser, memory, voice                |
|Stalls when a tool is missing |Capability Foundry discovers, tests, and promotes new capability|
|Chat-first UX                 |Mission-first runtime                                           |
|Single surface (browser ext)  |Browser + shell + voice + file + device as one system           |
|Loses context between sessions|Persistent graph memory backed by Neo4j                         |
|Black-box agent loops         |Typed orchestration with explicit terminal states               |

-----

## What VikiClow Ships

```
┌─────────────────────────────────────────────────────────────────┐
│                        VIKICLOW RUNTIME                         │
├─────────────────┬───────────────────┬───────────────────────────┤
│  Mission Engine │   Viki Browser    │   Capability Foundry      │
│                 │                   │                           │
│  • Durable      │  • Managed        │  • Auto-discover tools    │
│    state        │    profiles       │  • Sandbox & test         │
│  • Checkpoints  │  • Playwright     │  • Promote or reject      │
│  • Retries      │    automation     │  • Runtime routing        │
│  • Proofs       │  • Evidence       │  • Provenance tracking    │
│  • Terminal     │    capture        │                           │
│    states       │  • Session vaults │                           │
├─────────────────┴───────────────────┴───────────────────────────┤
│                     EXECUTION SURFACES                          │
│   Browser  ·  Shell  ·  Voice  ·  File  ·  Screen  ·  Device   │
├─────────────────────────────────────────────────────────────────┤
│                      MEMORY LAYER                               │
│          Neo4j Graph  ·  Graphiti Proof  ·  Mission Writeback   │
└─────────────────────────────────────────────────────────────────┘
```

-----

## Core Pillars

### 🎯 Durable Missions — not conversation turns

Every task becomes a **mission object** with a plan, state machine, checkpoints, retries, evidence, and a terminal result. State is explicit. Nothing is lost between runs.

Terminal states you can actually inspect:

```
completed  ·  failed  ·  blocked  ·  needs_approval
```

-----

### 🌐 Viki Browser — the browser that ships proof

Not a Chrome extension. A **branded browser surface** with:

- Managed profiles and session vaults
- Playwright-compatible automation built in
- `browserd` manifests for native packaging
- Evidence capture baked into every session

-----

### 🧠 Capability Foundry — self-expanding capability

When VikiClow hits a task it can’t handle, it doesn’t stop. **Capability Foundry** kicks in:

```
discover → classify → fetch → sandbox → test → promote → bundle → route → remember
```

Every capability that gets promoted is logged with provenance, scored, and routed automatically on future missions. The system gets smarter every run.

-----

### 🔊 Voice-Native — not a plugin afterthought

Voice readiness is **mandatory at setup**. Bootstrap, proof, and readiness checks are part of the onboarding path — not a feature toggle buried in settings.

-----

### 💾 Persistent Memory — survives everything

Memory isn’t context decoration. It’s infrastructure:

- **Graphiti-style proof paths** for auditable recall
- **Neo4j-backed graph memory** that outlasts model and provider swaps
- **Mission writeback** so every run informs the next

-----

### 🔄 Self-Evolution Engine

VikiClow improves itself. Candidates are ingested, benchmarked, promoted or rejected, and rolled back with full provenance. The system evolves without breaking what works.

-----

## Architecture

```
User intent
    ↓
Mission Object  (plan · state · checkpoints · evidence)
    ↓
Sovereign Orchestrator
    ↓
Domain Swarms
    ↓
┌─────────────┬──────────────┬───────────────┬─────────────┐
│   Browser   │     Repo     │   Research    │   Local PC  │
│  Executor   │   Executor   │   Executor    │   Executor  │
└─────────────┴──────────────┴───────────────┴─────────────┘
    ↓
Verifier  →  Recovery (if needed)
    ↓
Terminal State + Evidence Artifacts
    ↓
Persistent Memory Writeback
```

```
Capability Foundry (parallel)
    ↓
Discover curated sources
    ↓
Classify → Fetch → Sandbox → Test → Score
    ↓
Promote or Reject (with recorded reason)
    ↓
Bundle → Register → Route at Runtime → Remember Success
```

-----

## Install

### Recommended — npm global

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
node ./vikiclow.mjs onboard --install-daemon
```

> **Windows users:** WSL2 is recommended for the full local automation stack. Native PowerShell covers build, bootstrap, launcher, and proof flows.

-----

## Quick Start

**1. Bootstrap**

```bash
vikiclow onboard --install-daemon
```

Configures workspace, gateway, browser runtime, Capability Foundry, and voice readiness in one shot.

**2. Start the runtime**

```bash
vikiclow gateway --port 18789
```

**3. Open the dashboard**

```bash
vikiclow dashboard --no-open
```

**4. Verify the browser**

```bash
vikiclow browser package-native
vikiclow browser verify-native --json
```

**5. Load capability inventory**

```bash
vikiclow capabilities list
vikiclow capabilities discover "publish a browser workflow"
vikiclow capabilities fetch playwright browser_profiles
vikiclow capabilities bundle
vikiclow capabilities bootstrap
```

**6. Run your first mission**

```bash
vikiclow agent --message "Open the browser, collect release evidence, update the docs, and finish the work end to end."
```

-----

## Proof Surfaces

VikiClow doesn’t say “done” and hope you believe it. Every major runtime path ships artifacts.

|Surface                 |Location                                |
|------------------------|----------------------------------------|
|Release proof           |`.artifacts/release-proof/`             |
|Runtime stack proof     |`.artifacts/runtime-stack-proof/`       |
|Execution surface proof |`.artifacts/execution-surface/`         |
|Capability Foundry proof|`.artifacts/capability-bundle/`         |
|Voice proof             |`.artifacts/voice-proof/`               |
|Browser proof           |`~/.vikiclow/browserd/native-proof.json`|
|Mission backbone proof  |`~/.vikiclow/missions/backbone/`        |
|Graph memory proof      |`~/.vikiclow/memory/graphiti/`          |

Regenerate the Capability Foundry proof bundle locally at any time:

```bash
corepack pnpm capabilities:proof
```

-----

## Runtime Stack

Validate the full Temporal + Neo4j backed runtime path locally:

```bash
corepack pnpm runtime:stack:up
corepack pnpm runtime:stack:proof
corepack pnpm runtime:stack:down
```

-----

## Capability Foundry — CLI Reference

```bash
vikiclow capabilities foundry discover
vikiclow capabilities foundry ingest <candidate-id>
vikiclow capabilities foundry test <candidate-id>
vikiclow capabilities foundry promote <candidate-id> --bundle
vikiclow capabilities foundry routes "<objective>"
```

-----

## Execution Surfaces

VikiClow operates across every surface a real operator needs:

- **Viki Browser** — visible browser sessions with managed profiles
- **`browserd` manifests** — profile, session, and evidence verification
- **Raw web-fetch routes** — lightweight HTTP extraction without a browser
- **Local shell execution** — controlled system commands and file ops
- **File writeback** — workspace memory and artifact persistence
- **Screen, camera, audio, paired-machine surfaces** — node/device-linked execution

-----

## What’s Shipped Today

This is not a demo shell or a proof-of-concept. Here’s what’s real:

- ✅ Build and release proof are green
- ✅ Browser launchers shipped in `dist/`
- ✅ Mission runtime and backbone proofs are live
- ✅ Voice bootstrap enforced at setup
- ✅ Capability Foundry ships with inventory, provenance, routing, and proof
- ✅ Runtime stack proof exercises Temporal + Neo4j where Docker is available

**Environment-dependent (explicit, not hidden):**

- Native CEF browser app requires host toolchain — not bundled in repo build
- Live LangGraph proof requires a reachable endpoint
- macOS and Android native verification require host toolchains

-----

## Tech Stack

|Layer           |Technology                         |
|----------------|-----------------------------------|
|Primary runtime |TypeScript (87%)                   |
|Native surfaces |Swift (macOS/iOS), Kotlin (Android)|
|Automation      |Playwright, browserd               |
|Mission state   |Temporal                           |
|Graph memory    |Neo4j + Graphiti                   |
|Package manager |pnpm (corepack)                    |
|Testing         |Vitest                             |
|CI              |GitHub Actions                     |
|Containerization|Docker / Podman                    |

-----

## Why VikiClow Over OpenClow

|Capability          |OpenClow         |VikiClow                                |
|--------------------|-----------------|----------------------------------------|
|Mission durability  |❌ stateless      |✅ durable with checkpoints              |
|Execution proof     |❌ no artifacts   |✅ proof at every surface                |
|Capability expansion|❌ manual         |✅ Capability Foundry (auto)             |
|Memory persistence  |❌ context only   |✅ Neo4j graph, survives provider swap   |
|Browser surface     |❌ extension      |✅ full branded browser + browserd       |
|Voice               |❌ optional add-on|✅ mandatory, verified at boot           |
|Recovery routing    |❌ fail and stop  |✅ verifier + recovery as runtime states |
|Self-evolution      |❌ none           |✅ candidate intake → benchmark → promote|

-----

## Documentation

|Resource                  |Link                                                            |
|--------------------------|----------------------------------------------------------------|
|📖 Docs Hub                |[docs.vikiclow.ai](https://docs.vikiclow.ai)                    |
|🔭 Vision                  |[VISION.md](./VISION.md)                                        |
|🚀 Personal Operator Guide |[docs/start/vikiclow.md](./docs/start/vikiclow.md)              |
|🔧 Capability Foundry Guide|[docs/tools/vikiclow-skills.md](./docs/tools/vikiclow-skills.md)|
|🧪 CI and Proof            |[docs/ci.md](./docs/ci.md)                                      |
|🔄 Install and Update      |[docs/install/updating.md](./docs/install/updating.md)          |
|🌐 Browser Surfaces        |[docs/tools/browser.md](./docs/tools/browser.md)                |

-----

## Contributing

The bar for merging into core is deliberately high — VikiClow is a dependable runtime, not a feature landfill.

We want focused changes, strong tests and proof, product-facing clarity, and deliberate breaking changes only when the product is meaningfully better for it.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

-----

## License

MIT — see [LICENSE](./LICENSE).

-----

<div align="center">

**Built by [Rebootix Research](https://github.com/rebootix-research)**<br/>
*Execution-grade AI for operators who need the work done, not just discussed.*

<br/>

[![Star on GitHub](https://img.shields.io/github/stars/rebootix-research/viki-clow?style=social)](https://github.com/rebootix-research/viki-clow)

</div>