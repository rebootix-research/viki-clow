---
title: "TOOLS.md Template"
summary: "Workspace template for TOOLS.md"
read_when:
  - Bootstrapping a workspace manually
---

# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Browser profiles and login expectations
- Cursor/mouse preferences or monitor layout notes
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Local model/API conventions
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### Browser / Cursor

- Preferred browser profile: "Work Chrome"
- Main display: 27in center monitor
- Cursor actions: move deliberately, click only after confirming risky actions

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod

### Models / Autonomy

- Primary model: openai/gpt-5.4
- Preferred fallback: anthropic/claude-sonnet-4-6
- Background work: okay for docs/memory cleanup, ask before destructive actions
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
