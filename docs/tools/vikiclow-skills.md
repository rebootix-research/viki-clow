# Capability Foundry

Capability Foundry is VikiClow's curated capability supply chain. It keeps a fresh install useful immediately, but it does so with gates, provenance, and proof instead of blind trust.

The operating model is simple:

discover -> classify -> fetch or wrap -> inspect -> sandbox -> test -> score -> promote or reject -> bundle -> register -> route -> remember

That is the difference between an operator system that compounds capability and a project that sends users to hunt for skills after install.

## What Foundry covers

Capability Foundry supports four curated source families and the inventory they produce:

- bundled local VikiClow skills
- bundled VikiClow plugins
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

## Capability types

Capability Foundry understands these normalized shapes:

- `skill`
- `plugin`
- `mcp_server`
- `repo_integration`
- `asset_dependency`

Each candidate keeps source metadata, provenance, compatibility, lifecycle state, test status, promotion status, bundle status, route hints, and runtime registration metadata.

## Why this matters

VikiClow does not treat a discovered capability as trusted just because it exists.

It has to be:

- curated from an approved source family
- normalized into VikiClow's capability manifest
- safe enough to sandbox
- testable enough to score
- promotable into the registry
- routable at runtime when the mission needs it

This is how VikiClow stays expandable without becoming a blind marketplace.

## Ready-to-use bundle

Fresh installs bundle the strongest safe capabilities that are already proven in the repo.

The shipped bundle emphasizes:

- mission skill generation and workspace automation
- browser and desktop control
- workflow and memory routing
- voice readiness and transcription helpers
- curated runtime assets for local speech and operator flows

Bundle state is recorded as both inventory and receipts so the operator can see what was installed, what was enabled, what was promoted, and what was skipped.

## Operator commands

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

## What the proof shows

The proof bundle records:

- discovered candidates
- normalized source families
- bundled capabilities
- bundle receipts
- provenance and source origin
- sandbox, test, and promotion state
- runtime routing hints
- ready-to-use capability inventory

This is the evidence trail VikiClow uses to show that Capability Foundry is real, not aspirational.

## Runtime effect

Capability Foundry is not a library catalog. It is part of mission routing.

When a task arrives, VikiClow can route to a proven skill, plugin, MCP server, or repo integration that already knows how to do the work. Successful usage is written back so the next mission can pick the right capability faster and with more confidence.

That is how the system improves without becoming dependent on model memory alone.

## Related guides

- [Running VikiClow as your execution system](/start/vikiclow)
- [CI and proof](/ci)
- [Browser](/tools/browser)
