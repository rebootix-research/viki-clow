# VikiClow Skills

VikiClow ships with a broad bundled skill surface so a fresh install is useful immediately instead of sending you off to hunt for integrations.

## What This Includes

- bundled local skills under [`skills/`](https://github.com/rebootix-research/viki-clow/tree/main/skills)
- auto-enabled product plugins for browser, voice, memory, workflow, phone control, diffs, and thread ownership
- capability inventory and proof output under `~/.vikiclow/capabilities/`
- provisioning-aware bootstrap through `vikiclow capabilities bundle` and `vikiclow capabilities bootstrap`

## Use It

```bash
vikiclow capabilities list
vikiclow capabilities bundle --json
vikiclow capabilities bootstrap
```

## Related Guides

- [Skills overview](/tools/skills)
- [Capability provisioning](/start/vikiclow)
- [Voice bootstrap proof](/help/faq)
