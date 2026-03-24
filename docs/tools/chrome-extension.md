---
summary: "Chrome extension: let VikiClow drive your existing Chrome tab"
read_when:
  - You want the agent to drive an existing Chrome tab
  - You need remote Gateway + local browser automation
  - You want to understand browser takeover security
title: "Chrome Extension"
---

# Chrome extension

The Viki Browser Relay extension lets the agent control your existing Chrome
tabs instead of launching a separate managed profile.

## How it works

- Browser service: the API the agent/tool calls
- Local relay server: loopback CDP bridge
- Chrome MV3 extension: attaches to the active tab with `chrome.debugger`

## Install

```bash
vikiclow browser extension install
vikiclow browser extension path
```

Then open `chrome://extensions`, enable Developer mode, and load the printed
folder.

## Use

- Open the tab you want VikiClow to control
- Click the extension icon to attach
- Use the `chrome` browser profile

## Security

- Prefer a dedicated browser profile for extension relay usage
- Keep the relay loopback-only when possible
- Use Gateway auth and node pairing for remote setups
