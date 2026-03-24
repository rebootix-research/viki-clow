---
summary: "CLI reference for `vikiclow backup` (create local backup archives)"
read_when:
  - You want a first-class backup archive for local VikiClow state
  - You want to preview which paths would be included before reset or uninstall
title: "backup"
---

# `vikiclow backup`

Create a local backup archive for VikiClow state, config, credentials, sessions, and optionally workspaces.

```bash
vikiclow backup create
vikiclow backup create --output ~/Backups
vikiclow backup create --dry-run --json
vikiclow backup create --verify
vikiclow backup create --no-include-workspace
vikiclow backup create --only-config
vikiclow backup verify ./2026-03-09T00-00-00.000Z-vikiclow-backup.tar.gz
```

## Notes

- The archive includes a `manifest.json` file with the resolved source paths and archive layout.
- Default output is a timestamped `.tar.gz` archive in the current working directory.
- If the current working directory is inside a backed-up source tree, VikiClow falls back to your home directory for the default archive location.
- Existing archive files are never overwritten.
- Output paths inside the source state/workspace trees are rejected to avoid self-inclusion.
- `vikiclow backup verify <archive>` validates that the archive contains exactly one root manifest, rejects traversal-style archive paths, and checks that every manifest-declared payload exists in the tarball.
- `vikiclow backup create --verify` runs that validation immediately after writing the archive.
- `vikiclow backup create --only-config` backs up just the active JSON config file.

## What gets backed up

`vikiclow backup create` plans backup sources from your local VikiClow install:

- The state directory returned by VikiClow's local state resolver, usually `~/.vikiclow`
- The active config file path
- The OAuth / credentials directory
- Workspace directories discovered from the current config, unless you pass `--no-include-workspace`

If you use `--only-config`, VikiClow skips state, credentials, and workspace discovery and archives only the active config file path.

VikiClow canonicalizes paths before building the archive. If config, credentials, or a workspace already live inside the state directory, they are not duplicated as separate top-level backup sources. Missing paths are skipped.

The archive payload stores file contents from those source trees, and the embedded `manifest.json` records the resolved absolute source paths plus the archive layout used for each asset.

## Invalid config behavior

`vikiclow backup` intentionally bypasses the normal config preflight so it can still help during recovery. Because workspace discovery depends on a valid config, `vikiclow backup create` now fails fast when the config file exists but is invalid and workspace backup is still enabled.

If you still want a partial backup in that situation, rerun:

```bash
vikiclow backup create --no-include-workspace
```

That keeps state, config, and credentials in scope while skipping workspace discovery entirely.

If you only need a copy of the config file itself, `--only-config` also works when the config is malformed because it does not rely on parsing the config for workspace discovery.

## Size and performance

VikiClow does not enforce a built-in maximum backup size or per-file size limit.

Practical limits come from the local machine and destination filesystem:

- Available space for the temporary archive write plus the final archive
- Time to walk large workspace trees and compress them into a `.tar.gz`
- Time to rescan the archive if you use `vikiclow backup create --verify` or run `vikiclow backup verify`
- Filesystem behavior at the destination path. VikiClow prefers a no-overwrite hard-link publish step and falls back to exclusive copy when hard links are unsupported

Large workspaces are usually the main driver of archive size. If you want a smaller or faster backup, use `--no-include-workspace`.

For the smallest archive, use `--only-config`.
