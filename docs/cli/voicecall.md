---
summary: "CLI reference for `vikiclow voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `vikiclow voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
vikiclow voicecall status --call-id <id>
vikiclow voicecall call --to "+15555550123" --message "Hello" --mode notify
vikiclow voicecall continue --call-id <id> --message "Any questions?"
vikiclow voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
vikiclow voicecall expose --mode serve
vikiclow voicecall expose --mode funnel
vikiclow voicecall expose --mode off
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
