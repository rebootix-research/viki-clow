---
summary: "Viki Prose: .prose workflows, slash commands, and state in VikiClow"
read_when:
  - You want to run or write .prose workflows
  - You want to enable the Viki Prose plugin
  - You need to understand state storage
title: "Viki Prose"
---

# Viki Prose

Viki Prose is a portable, markdown-first workflow format for orchestrating AI sessions. In VikiClow it ships as a plugin that installs an Viki Prose skill pack plus a `/prose` slash command. Programs live in `.prose` files and can spawn multiple sub-agents with explicit control flow.

Official site: [https://www.prose.md](https://www.prose.md)

## What it can do

- Multi-agent research + synthesis with explicit parallelism.
- Repeatable approval-safe workflows (code review, incident triage, content pipelines).
- Reusable `.prose` programs you can run across supported agent runtimes.

## Install + enable

Bundled plugins are disabled by default. Enable Viki Prose:

```bash
vikiclow plugins enable open-prose
```

Restart the Gateway after enabling the plugin.

Dev/local checkout: `vikiclow plugins install ./extensions/open-prose`

Related docs: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## Slash command

Viki Prose registers `/prose` as a user-invocable skill command. It routes to the Viki Prose VM instructions and uses VikiClow tools under the hood.

Common commands:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Example: a simple `.prose` file

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## File locations

Viki Prose keeps state under `.prose/` in your workspace:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

User-level persistent agents live at:

```
~/.prose/agents/
```

## State modes

Viki Prose supports multiple state backends:

- **filesystem** (default): `.prose/runs/...`
- **in-context**: transient, for small programs
- **sqlite** (experimental): requires `sqlite3` binary
- **postgres** (experimental): requires `psql` and a connection string

Notes:

- sqlite/postgres are opt-in and experimental.
- postgres credentials flow into subagent logs; use a dedicated, least-privileged DB.

## Remote programs

`/prose run <handle/slug>` resolves to `https://p.prose.md/<handle>/<slug>`.
Direct URLs are fetched as-is. This uses the `web_fetch` tool (or `exec` for POST).

## VikiClow runtime mapping

Viki Prose programs map to VikiClow primitives:

| Viki Prose concept        | VikiClow tool    |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read/write           | `read` / `write` |
| Web fetch                 | `web_fetch`      |

If your tool allowlist blocks these tools, Viki Prose programs will fail. See [Skills config](/tools/skills-config).

## Security + approvals

Treat `.prose` files like code. Review before running. Use VikiClow tool allowlists and approval gates to control side effects.

For deterministic, approval-gated workflows, compare with [Viki Workflow](/tools/workflow).
