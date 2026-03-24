---
summary: "CLI reference for `vikiclow browser`"
read_when:
  - You want to control browser profiles, tabs, and automation actions
  - You want to use the Viki Browser Relay extension on an existing Chrome tab
  - You want to route browser actions through a node host on another machine
title: "browser"
---

# `vikiclow browser`

Use this command to manage Viki Browser profiles and run browser actions such as
tab listing, opening URLs, navigation, snapshots, screenshots, clicks, and typing.

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL
- `--token <token>`: Gateway token, if required
- `--timeout <ms>`: request timeout in milliseconds
- `--browser-profile <name>`: choose a browser profile
- `--json`: machine-readable output, where supported

## Quick start

```bash
vikiclow browser --browser-profile vikiclow start
vikiclow browser --browser-profile vikiclow open https://example.com
vikiclow browser --browser-profile vikiclow snapshot
vikiclow browser --browser-profile chrome tabs
```

## Profiles

- `vikiclow`: isolated managed browser profile
- `chrome`: your existing browser controlled through the Viki Browser Relay

```bash
vikiclow browser profiles
vikiclow browser create-profile --name work --color "#11847E"
vikiclow browser delete-profile --name work
```

## Tabs and actions

```bash
vikiclow browser tabs
vikiclow browser open https://docs.vikiclow.ai
vikiclow browser focus <targetId>
vikiclow browser close <targetId>
vikiclow browser navigate https://example.com
vikiclow browser click <ref>
vikiclow browser type <ref> "hello"
```

## Viki Browser Relay

The relay lets VikiClow control an existing Chrome tab after you attach it with
the toolbar button.

```bash
vikiclow browser extension install
vikiclow browser extension path
```

Open Chrome, enable Developer mode, load the printed folder, and click the
extension icon on the tab you want to control.

## Remote browser control

If the Gateway runs on a different machine than the browser, run a node host on
the browser machine so the Gateway can proxy browser actions to it.

Use `gateway.nodes.browser.mode` to control auto-routing and
`gateway.nodes.browser.node` to pin a specific node.
