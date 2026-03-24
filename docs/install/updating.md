---
summary: "How to update VikiClow safely, verify the runtime, and roll back if needed."
read_when:
  - Updating VikiClow
  - Something breaks after an update
title: "Updating"
---

# Updating

Treat VikiClow updates like shipping runtime infrastructure:

1. update
2. verify proof surfaces
3. restart
4. confirm the mission, browser, and voice layers are healthy

## Recommended upgrade path

### Global install

```bash
npm install -g vikiclow@latest
```

or

```bash
pnpm add -g vikiclow@latest
```

Then run:

```bash
vikiclow doctor
vikiclow browser verify-native --json
vikiclow health
vikiclow gateway restart
```

### Source install

```bash
git pull --rebase
corepack pnpm install
corepack pnpm build
corepack pnpm release:proof
```

Then:

```bash
vikiclow doctor
vikiclow gateway restart
```

## Strong verification path

If you want the strongest local verification path after an update:

```bash
corepack pnpm execution:proof
corepack pnpm runtime:stack:up
corepack pnpm runtime:stack:proof
corepack pnpm runtime:stack:down
```

## Before you update

Know where your durable state lives:

- config: `~/.vikiclow/vikiclow.json`
- credentials: `~/.vikiclow/credentials/`
- workspace: `~/.vikiclow/workspace`
- mission/browser/memory state: `~/.vikiclow/`

## Gateway control

```bash
vikiclow gateway status
vikiclow gateway stop
vikiclow gateway restart
vikiclow logs --follow
```

If the gateway is supervised, prefer `vikiclow gateway restart` over killing the process manually.

## Rollback

### Global install rollback

```bash
npm install -g vikiclow@<version>
vikiclow doctor
vikiclow gateway restart
```

### Source rollback

```bash
git checkout <known-good-commit-or-tag>
corepack pnpm install
corepack pnpm build
vikiclow gateway restart
```

## If an update looks wrong

- inspect `~/.vikiclow/browserd/native-proof.json`
- inspect the latest mission backbone under `~/.vikiclow/missions/backbone/`
- inspect graph memory proof under `~/.vikiclow/memory/graphiti/`
- rerun `vikiclow doctor`

The goal is not just to update the binary. The goal is to keep the execution system healthy.
