---
summary: "CLI reference for `vikiclow logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `vikiclow logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
vikiclow logs
vikiclow logs --follow
vikiclow logs --json
vikiclow logs --limit 500
vikiclow logs --local-time
vikiclow logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.
