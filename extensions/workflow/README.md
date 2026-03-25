# Viki Workflow (plugin)

Adds the `workflow` agent tool as an **optional** plugin tool.

## What this is

- Viki Workflow is a standalone workflow shell (typed JSON-first pipelines + approvals/resume).
- This plugin integrates Viki Workflow with VikiClow _without core changes_.

## Enable

Because this tool can trigger side effects (via workflows), it is registered with `optional: true`.

Enable it in an agent allowlist:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["workflow"]
        }
      }
    ]
  }
}
```

## Using `vikiclow.invoke` (workflow runtime -> VikiClow tools)

Some Viki Workflow pipelines may include a `vikiclow.invoke` step to call back into VikiClow tools/plugins (for example: `gog` for Google Workspace, `gh` for GitHub, `message.send`, etc.).

For this to work, the VikiClow Gateway must expose the tool bridge endpoint and the target tool must be allowed by policy:

- VikiClow provides an HTTP endpoint: `POST /tools/invoke`.
- The request is gated by **gateway auth** (e.g. `Authorization: Bearer …` when token auth is enabled).
- The invoked tool is gated by **tool policy** (global + per-agent + provider + group policy). If the tool is not allowed, VikiClow returns `404 Tool not available`.

### Allowlisting recommended

To avoid letting workflows call arbitrary tools, set a tight allowlist on the agent that will be used by `vikiclow.invoke`.

Example (allow only a small set of tools):

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "allow": ["workflow", "web_fetch", "web_search", "gog", "gh"],
          "deny": ["gateway"],
        },
      },
    ],
  },
}
```

Notes:

- If `tools.allow` is omitted or empty, it behaves like "allow everything (except denied)". For a real allowlist, set a **non-empty** `allow`.
- Tool names depend on which plugins you have installed/enabled.

## Security

- Runs the `viki-workflow` executable as a local subprocess.
- Does not manage OAuth/tokens.
- Uses timeouts, stdout caps, and strict JSON envelope parsing.
- Ensure `viki-workflow` is available on `PATH` for the gateway process.
