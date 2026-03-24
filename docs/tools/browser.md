---
summary: "Integrated browser control service + action commands"
read_when:
  - Adding agent-controlled browser automation
  - Debugging browser startup or profile routing
  - Working on browser settings, profiles, or lifecycle
title: "Browser"
---

# Browser

Viki Browser can run a dedicated Chromium profile that the agent controls. The
managed browser is isolated from a personal browser and is routed through the
Gateway loopback control service.

## Profiles

- `vikiclow`: isolated managed browser
- `chrome`: existing browser via the Viki Browser Relay extension

## What it supports

- Tab list, open, focus, close
- Click, type, drag, select
- Snapshot, screenshot, PDF, trace, cookies, storage
- Local and remote browser routing
- Extension relay for attached Chrome tabs

## Configuration

Browser settings live in `~/.vikiclow/vikiclow.json`.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "vikiclow",
    headless: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      vikiclow: { cdpPort: 18800, color: "#11847E" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

## Browser Relay

Use the relay when you want to control an existing Chrome tab.

```bash
vikiclow browser extension install
vikiclow browser extension path
```

Attach the extension to a tab, then use the `chrome` profile.

## Remote control

- Local control: Gateway starts the loopback control service.
- Node host: proxy browser actions to another machine.
- Remote CDP: attach to an explicit Chromium CDP endpoint.

## Security

- Keep browser control loopback-only whenever possible.
- Use Gateway auth and node pairing for remote setups.
- Treat remote CDP URLs and tokens as secrets.
