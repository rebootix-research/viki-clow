---
summary: "Fix Chrome/Brave/Edge/Chromium CDP startup issues for Viki Browser on Linux"
read_when: "Browser control fails on Linux, especially with snap Chromium"
title: "Browser Troubleshooting"
---

# Browser Troubleshooting (Linux)

## Problem

Viki Browser control may fail to launch Chrome, Brave, Edge, or Chromium with
an error like:

```text
Failed to start Chrome CDP on port 18800 for profile "vikiclow".
```

## Common cause

On Ubuntu and some other distros, Chromium is often installed as a snap package.
Snap confinement can interfere with how VikiClow starts and monitors the
browser process.

## Recommended fix

Install the official Google Chrome package:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y
```

Then point your VikiClow config at the browser binary:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

## Alternative

If you must use snap Chromium, configure `attachOnly: true` and launch it
manually with a remote debugging port before starting VikiClow.
