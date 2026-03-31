# Capability Foundry

VikiClow ships with a controlled capability supply chain so a fresh install is useful immediately instead of sending you off to hunt for integrations.

Capability Foundry is how VikiClow discovers, classifies, inspects, tests, and promotes capabilities before they become part of the runtime.

## What It Includes

- bundled local skills under [`skills/`](https://github.com/rebootix-research/viki-clow/tree/main/skills)
- auto-enabled product plugins for browser, voice, memory, workflow, phone control, diffs, and thread ownership
- curated MCP server candidates and selected repo integrations
- capability inventory under `~/.vikiclow/capabilities/`
- Capability Foundry proof artifacts under `.artifacts/capability-bundle/`
- provisioning-aware bootstrap through `vikiclow capabilities bundle`, `vikiclow capabilities bootstrap`, and `vikiclow capabilities plan`

## How It Works

Capability Foundry follows a controlled promotion pipeline:

```text
discover
  -> classify
  -> fetch / inspect
  -> sandbox
  -> test
  -> score
  -> promote or reject
  -> register for runtime routing
  -> remember successful usage
```

That means a capability is not treated as "available" just because it was downloaded.

It must be:

- recognized as the right kind of asset
- compatible with the current workspace and platform
- safe enough to sandbox
- testable enough to prove value
- promotable into the registry
- routable at runtime when the mission needs it

## Capability Types

Capability Foundry understands several capability shapes:

- `skill`
- `plugin`
- `mcp_server`
- `repo_integration`
- `asset_dependency`

Each candidate keeps source metadata, provenance, compatibility, test status, promotion status, and runtime registration hints.

## Use It

```bash
vikiclow capabilities list
vikiclow capabilities discover "publish a browser workflow"
vikiclow capabilities fetch playwright browser_profiles
vikiclow capabilities inspect
vikiclow capabilities bundle
vikiclow capabilities bootstrap
vikiclow capabilities plan "create a reusable automation skill"
corepack pnpm capabilities:proof
```

## What the Proof Shows

The proof bundle records:

- discovered candidates
- bundled capabilities
- provenance and source origin
- sandbox/test/promotion state
- runtime routing hints
- bundled inventory and voice/browser readiness

This is the evidence trail the repo uses to show that Capability Foundry is real, not aspirational.

## Bundling Notes

Fresh installs automatically bundle the strongest safe capabilities that are already proven in the repo.

The shipped inventory typically includes:

- browser and web automation capabilities
- voice bootstrap and TTS/runtime helpers
- workflow and memory surfaces
- commonly used operator skills such as browser control, summarization, and capability creation

Capabilities that require missing credentials, unsupported platforms, or unavailable external services are recorded explicitly as skipped or rejected instead of pretending to work.

## Related Guides

- [Running VikiClow as your execution system](/start/vikiclow)
- [CI and proof](/ci)
- [Browser](/tools/browser)
