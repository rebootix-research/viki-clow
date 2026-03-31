---
title: CI Pipeline
description: How the VikiClow CI pipeline works
summary: "CI job graph, proof surfaces, and local command equivalents"
read_when:
  - You need to understand why a CI job did or did not run
  - You are debugging failing GitHub Actions checks
---

# CI Pipeline

The CI runs on every push to `main` and every pull request. It uses smart scoping to skip expensive jobs when only docs or native code changed.

## Job Overview

- `docs-scope`: detect docs-only changes.
- `changed-scope`: detect which areas changed (node, macOS, Android, Windows).
- `check`: TypeScript types, lint, and format.
- `check-docs`: Markdown lint and broken-link checks.
- `code-analysis`: LOC threshold check for pull requests.
- `secrets`: detect leaked secrets.
- `build-artifacts`: build `dist` once and share it with other jobs.
- `release-check`: validate npm pack contents.
- `release-proof`: emit a release proof report artifact.
- `capabilities-proof`: validate Capability Foundry inventory, routing, and proof artifacts.
- `checks`: Node/Bun tests and protocol checks.
- `checks-windows`: Windows-specific tests.
- `macos`: Swift lint, build, and tests plus TypeScript tests.
- `android`: Gradle build and tests.
- `browser-native-windows`: native Viki Browser packaging and proof.
- `Native Verification`: hosted-runner runtime, browser, voice, macOS, and Android closure lanes.

## Fail-Fast Order

Jobs are ordered so cheap checks fail before expensive ones run:

1. `docs-scope` + `code-analysis` + `check` (parallel, ~1-2 min)
2. `build-artifacts` (blocked on above)
3. `checks`, `checks-windows`, `macos`, `android` (blocked on build)
4. `release-check`, `release-proof`, `capabilities-proof`

Scope logic lives in `scripts/ci-changed-scope.mjs` and is covered by unit tests in `src/scripts/ci-changed-scope.test.ts`.

## Proof Surfaces

The repository treats proof as a first-class CI output:

- `corepack pnpm release:proof`
- `corepack pnpm capabilities:proof`
- `corepack pnpm runtime:stack:proof`
- `corepack pnpm execution:proof`
- `vikiclow browser verify-native --json`

Those proofs verify shipped artifacts, capability inventory, runtime stack wiring, browser packaging, and execution surfaces instead of only checking process exit codes.

## Runners

| Runner           | Jobs                                                   |
| ---------------- | ------------------------------------------------------ |
| `ubuntu-24.04`   | Most Linux jobs, release proof, runtime proof, Android |
| `windows-latest` | `checks-windows`, `browser-native-windows`             |
| `macos-latest`   | `macos`, `ios`, `macos-swift`                          |

## Local Equivalents

```bash
pnpm check                 # types + lint + format
pnpm test                  # vitest tests
pnpm check:docs            # docs format + lint + broken links
pnpm release:check         # validate npm pack
pnpm release:proof         # generate release proof report
pnpm capabilities:proof    # generate Capability Foundry proof bundle
pnpm runtime:stack:proof   # prove mission/runtime/memory stack where available
pnpm execution:proof       # prove execution-surface coverage
```
