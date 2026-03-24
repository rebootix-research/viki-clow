---
name: vikiclow-skills
description: Use the VikiClow Skills Registry CLI to search, install, update, and publish agent skills. Use when you need to fetch new skills on the fly, sync installed skills to latest or a specific version, or publish new/updated skill folders with the npm-installed VikiClow skills CLI.
metadata:
  {
    "vikiclow":
      {
        "requires": { "bins": ["vikiclow-skills"] },
      },
  }
---

# VikiClow Skills Registry CLI

Status

```bash
# Public releases do not currently ship a published vikiclow-skills package.
# Keep this skill as a compatibility manifest only unless you provide
# a private/internal vikiclow-skills binary on PATH.
```

Auth (publish)

```bash
vikiclow-skills login
vikiclow-skills whoami
```

Search

```bash
vikiclow-skills search "postgres backups"
```

Install

```bash
vikiclow-skills install my-skill
vikiclow-skills install my-skill --version 1.2.3
```

Update (hash-based match + upgrade)

```bash
vikiclow-skills update my-skill
vikiclow-skills update my-skill --version 1.2.3
vikiclow-skills update --all
vikiclow-skills update my-skill --force
vikiclow-skills update --all --no-input --force
```

List

```bash
vikiclow-skills list
```

Publish

```bash
vikiclow-skills publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Notes

- Default registry: https://vikiclow.ai (override with VIKICLOW_SKILLS_REGISTRY or --registry)
- Default workdir: cwd (falls back to VikiClow workspace); install dir: ./skills (override with --workdir / --dir / VIKICLOW_SKILLS_WORKDIR)
- Update command hashes local files, resolves matching version, and upgrades to latest unless --version is set
