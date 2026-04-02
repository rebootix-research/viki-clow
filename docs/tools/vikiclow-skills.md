# Capability Foundry

Capability Foundry is Vikiclow’s curated capability supply chain. It keeps a fresh install useful immediately, but it does so with gates, provenance, and proof instead of blind trust.

The goal is simple: discover good capabilities, classify them correctly, sandbox them, test them, promote the ones that pass, bundle the safest winners, and register them so missions can route to them automatically.

In practice that means Vikiclow can absorb proven external capability without turning the product into an untrusted marketplace or a blind GitHub scraper.

## What It Covers

Capability Foundry supports four curated source families and their downstream inventory:

- bundled local Vikiclow skills
- bundled Vikiclow plugins
- curated MCP servers
- curated GitHub integrations and runtime assets

Those source families are recorded in:

- `~/.vikiclow/capabilities/source-catalog.json`
- `~/.vikiclow/capabilities/source-catalog.md`

And the shipped inventory is tracked in:

- `~/.vikiclow/capabilities/bundle-inventory.json`
- `~/.vikiclow/capabilities/bundle-inventory.md`
- `~/.vikiclow/capabilities/bundle-receipts.json`
- `~/.vikiclow/capabilities/bundle-receipts.md`

## Capability Types

Capability Foundry understands these capability shapes:

- `skill`
- `plugin`
- `mcp_server`
- `repo_integration`
- `asset_dependency`

Each candidate keeps source metadata, provenance, compatibility, test status, promotion status, bundle status, and runtime registration hints.

## The Foundry Pipeline

Capability Foundry uses a controlled promotion flow:

```text
discover
  -> classify
  -> fetch / install / vendor / wrap
  -> inspect
  -> sandbox
  -> test
  -> score
  -> promote or reject
  -> bundle if appropriate
  -> register for runtime routing
  -> remember successful usage
```

That means a capability is not treated as available just because it was found.

It must be:

- curated from an approved source family
- normalized into Vikiclow’s manifest model
- safe enough to sandbox
- testable enough to prove value
- promotable into the registry
- routable at runtime when the mission needs it

## Ready-to-Use Bundle

Fresh installs bundle the strongest safe capabilities that are already proven in the repo.

The shipped bundle currently emphasizes:

- mission skill generation and workspace automation
- browser and desktop control
- voice readiness and transcription helpers
- workflow and memory routing
- curated runtime assets for local speech and operator flows

Bundle state is recorded as both inventory and receipts so you can see what was installed, what was enabled, what was promoted, and what was skipped.

## How To Use It

```bash
vikiclow capabilities list
vikiclow capabilities discover "publish a browser workflow"
vikiclow capabilities fetch playwright browser_profiles
vikiclow capabilities inspect
vikiclow capabilities foundry discover
vikiclow capabilities foundry ingest mcp:filesystem repo:langgraph
vikiclow capabilities foundry test skill:viki-skill-factory
vikiclow capabilities foundry promote skill:viki-skill-factory --bundle
vikiclow capabilities foundry routes "create a reusable browser workflow skill"
vikiclow capabilities bundle
vikiclow capabilities bootstrap
vikiclow capabilities plan "create a reusable automation skill"
corepack pnpm capabilities:proof
```

## What The Proof Shows

The proof bundle records:

- discovered candidates
- normalized source families
- bundled capabilities
- bundle receipts
- provenance and source origin
- sandbox/test/promotion state
- runtime routing hints
- ready-to-use capability inventory

This is the evidence trail the repo uses to show that Capability Foundry is real, not aspirational.

## Why It Matters At Runtime

Capability Foundry is not a library catalog. It is part of mission selection.

When a task arrives, Vikiclow can route to a proven skill, plugin, MCP server, or repo integration that already knows how to do the work. Successful usage is written back so the next mission can pick the right capability faster.

That is how the system improves without becoming dependent on model memory alone.

## Related Guides

- [Running VikiClow as your execution system](/start/vikiclow)
- [CI and proof](/ci)
- [Browser](/tools/browser)
