---
name: cursor-control
description: Inspect screens and control the mouse cursor, clicks, drags, scrolling, and typing through VikiClow's desktop automation stack. Use when a user asks VikiClow to move the mouse, click something, drag an item, scroll, or drive a macOS app visually.
---

# Cursor Control

VikiClow already ships with the automation path needed for cursor-driven tasks. This skill makes that workflow explicit and safe.

## Primary toolchain

- Use `peekaboo see --annotate` before interacting so targets are identified visually.
- Use `peekaboo move`, `peekaboo click`, `peekaboo drag`, `peekaboo scroll`, `peekaboo hotkey`, and `peekaboo type` for execution.
- If a task is browser-only, prefer the browser action stack when it is more direct than full desktop automation.

## Operating pattern

1. Inspect the current screen or app window first.
2. Confirm the target label, coordinates, or window identity.
3. Execute one high-confidence action at a time.
4. Re-inspect after important transitions.
5. Report what changed and where the cursor workflow ended.

## Safety rules

- Do not blindly click from stale screenshots.
- Prefer app and window scoping when available.
- If the target is ambiguous, inspect again instead of guessing.
- When text entry is sensitive, warn before typing secrets.

## Handy commands

```bash
peekaboo see --annotate --path /tmp/vikiclow-peek.png
peekaboo move 500,300 --smooth
peekaboo click --on B3
peekaboo drag --from B1 --to T2
peekaboo scroll --direction down --amount 6 --smooth
peekaboo type "Hello from VikiClow" --return
```
