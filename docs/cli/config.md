---
summary: "CLI reference for `vikiclow config` (get/set/unset/file/validate)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `vikiclow config`

Config helpers: get/set/unset/validate values by path and print the active
config file. Run without a subcommand to open
the configure wizard (same as `vikiclow configure`).

## Examples

```bash
vikiclow config file
vikiclow config get browser.executablePath
vikiclow config set browser.executablePath "/usr/bin/google-chrome"
vikiclow config set agents.defaults.heartbeat.every "2h"
vikiclow config set agents.list[0].tools.exec.node "node-id-or-name"
vikiclow config unset tools.web.search.apiKey
vikiclow config validate
vikiclow config validate --json
```

## Paths

Paths use dot or bracket notation:

```bash
vikiclow config get agents.defaults.workspace
vikiclow config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
vikiclow config get agents.list
vikiclow config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
vikiclow config set agents.defaults.heartbeat.every "0m"
vikiclow config set gateway.port 19001 --strict-json
vikiclow config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: Print the active config file path (resolved from `VIKICLOW_CONFIG_PATH` or default location).

Restart the gateway after edits.

## Validate

Validate the current config against the active schema without starting the
gateway.

```bash
vikiclow config validate
vikiclow config validate --json
```
