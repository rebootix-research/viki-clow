---
summary: "Uninstall VikiClow completely (CLI, service, state, workspace)"
read_when:
  - You want to remove VikiClow from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `vikiclow` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
vikiclow uninstall
```

Non-interactive (automation / npx):

```bash
vikiclow uninstall --all --yes --non-interactive
npx -y vikiclow uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
vikiclow gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
vikiclow gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${VIKICLOW_STATE_DIR:-$HOME/.vikiclow}"
```

If you set `VIKICLOW_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.vikiclow/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g vikiclow
pnpm remove -g vikiclow
bun remove -g vikiclow
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/VikiClow.app
```

Notes:

- If you used profiles (`--profile` / `VIKICLOW_PROFILE`), repeat step 3 for each state dir (defaults are `~/.vikiclow-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `vikiclow` is missing.

### macOS (launchd)

Default label is `ai.vikiclow.gateway` (or `ai.vikiclow.<profile>`; legacy `com.vikiclow.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.vikiclow.gateway
rm -f ~/Library/LaunchAgents/ai.vikiclow.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.vikiclow.<profile>`. Remove any legacy `com.vikiclow.*` plists if present.

### Linux (systemd user unit)

Default unit name is `vikiclow-gateway.service` (or `vikiclow-gateway-<profile>.service`):

```bash
systemctl --user disable --now vikiclow-gateway.service
rm -f ~/.config/systemd/user/vikiclow-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `VikiClow Gateway` (or `VikiClow Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "VikiClow Gateway"
Remove-Item -Force "$env:USERPROFILE\.vikiclow\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.vikiclow-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://vikiclow.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g vikiclow@latest`.
Remove it with `npm rm -g vikiclow` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `vikiclow ...` / `bun run vikiclow ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.
