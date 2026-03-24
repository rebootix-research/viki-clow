---
summary: "CLI reference for `vikiclow uninstall` (remove gateway service + local data)"
read_when:
  - You want to remove the gateway service and/or local state
  - You want a dry-run first
title: "uninstall"
---

# `vikiclow uninstall`

Uninstall the gateway service + local data (CLI remains).

```bash
vikiclow backup create
vikiclow uninstall
vikiclow uninstall --all --yes
vikiclow uninstall --dry-run
```

Run `vikiclow backup create` first if you want a restorable snapshot before removing state or workspaces.
