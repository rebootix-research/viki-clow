---
summary: "CLI reference for `vikiclow reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `vikiclow reset`

Reset local config/state (keeps the CLI installed).

```bash
vikiclow backup create
vikiclow reset
vikiclow reset --dry-run
vikiclow reset --scope config+creds+sessions --yes --non-interactive
```

Run `vikiclow backup create` first if you want a restorable snapshot before removing local state.
