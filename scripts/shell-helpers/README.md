# vikidock <!-- omit in toc -->

Stop typing `docker-compose` commands. Just type `vikidock-start`.

Inspired by Simon Willison's [Running VikiClow in Docker](https://til.simonwillison.net/llms/vikiclow-docker).

- [Quickstart](#quickstart)
- [Available Commands](#available-commands)
  - [Basic Operations](#basic-operations)
  - [Container Access](#container-access)
  - [Web UI \& Devices](#web-ui--devices)
  - [Setup \& Configuration](#setup--configuration)
  - [Maintenance](#maintenance)
  - [Utilities](#utilities)
- [Common Workflows](#common-workflows)
  - [Check Status and Logs](#check-status-and-logs)
  - [Set Up WhatsApp Bot](#set-up-whatsapp-bot)
  - [Troubleshooting Device Pairing](#troubleshooting-device-pairing)
  - [Fix Token Mismatch Issues](#fix-token-mismatch-issues)
  - [Permission Denied](#permission-denied)
- [Requirements](#requirements)

## Quickstart

**Install:**

```bash
mkdir -p ~/.vikidock && curl -sL https://raw.githubusercontent.com/rebootix-research/viki-clow/main/scripts/shell-helpers/vikidock-helpers.sh -o ~/.vikidock/vikidock-helpers.sh
```

```bash
echo 'source ~/.vikidock/vikidock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

**See what you get:**

```bash
vikidock-help
```

On first command, vikidock auto-detects your VikiClow directory:

- Checks common paths (`~/vikiclow`, `~/workspace/vikiclow`, etc.)
- If found, asks you to confirm
- Saves to `~/.vikidock/config`

**First time setup:**

```bash
vikidock-start
```

```bash
vikidock-fix-token
```

```bash
vikidock-dashboard
```

If you see "pairing required":

```bash
vikidock-devices
```

And approve the request for the specific device:

```bash
vikidock-approve <request-id>
```

## Available Commands

### Basic Operations

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `vikidock-start`   | Start the gateway               |
| `vikidock-stop`    | Stop the gateway                |
| `vikidock-restart` | Restart the gateway             |
| `vikidock-status`  | Check container status          |
| `vikidock-logs`    | View live logs (follows output) |

### Container Access

| Command                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `vikidock-shell`          | Interactive shell inside the gateway container |
| `vikidock-cli <command>`  | Run VikiClow CLI commands                      |
| `vikidock-exec <command>` | Execute arbitrary commands in the container    |

### Web UI & Devices

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `vikidock-dashboard`    | Open web UI in browser with authentication |
| `vikidock-devices`      | List device pairing requests               |
| `vikidock-approve <id>` | Approve a device pairing request           |

### Setup & Configuration

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `vikidock-fix-token` | Configure gateway authentication token (run once) |

### Maintenance

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `vikidock-rebuild` | Rebuild the Docker image                         |
| `vikidock-clean`   | Remove all containers and volumes (destructive!) |

### Utilities

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `vikidock-health`    | Run gateway health check                  |
| `vikidock-token`     | Display the gateway authentication token  |
| `vikidock-cd`        | Jump to the VikiClow project directory    |
| `vikidock-config`    | Open the VikiClow config directory        |
| `vikidock-workspace` | Open the workspace directory              |
| `vikidock-help`      | Show all available commands with examples |

## Common Workflows

### Check Status and Logs

**Restart the gateway:**

```bash
vikidock-restart
```

**Check container status:**

```bash
vikidock-status
```

**View live logs:**

```bash
vikidock-logs
```

### Set Up WhatsApp Bot

**Shell into the container:**

```bash
vikidock-shell
```

**Inside the container, login to WhatsApp:**

```bash
vikiclow channels login --channel whatsapp --verbose
```

Scan the QR code with WhatsApp on your phone.

**Verify connection:**

```bash
vikiclow status
```

### Troubleshooting Device Pairing

**Check for pending pairing requests:**

```bash
vikidock-devices
```

**Copy the Request ID from the "Pending" table, then approve:**

```bash
vikidock-approve <request-id>
```

Then refresh your browser.

### Fix Token Mismatch Issues

If you see "gateway token mismatch" errors:

```bash
vikidock-fix-token
```

This will:

1. Read the token from your `.env` file
2. Configure it in the VikiClow config
3. Restart the gateway
4. Verify the configuration

### Permission Denied

**Ensure Docker is running and you have permission:**

```bash
docker ps
```

## Requirements

- Docker and Docker Compose installed
- Bash or Zsh shell
- VikiClow project (from `docker-setup.sh`)

## Development

**Test with fresh config (mimics first-time install):**

```bash
unset VIKIDOCK_DIR && rm -f ~/.vikidock/config && source scripts/shell-helpers/vikidock-helpers.sh
```

Then run any command to trigger auto-detect:

```bash
vikidock-start
```
