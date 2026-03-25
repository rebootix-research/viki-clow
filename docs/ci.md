---
title: CI Pipeline
description: How the VikiClow CI pipeline works
summary: "CI job graph, scope gates, and local command equivalents"
read_when:
  - You need to understand why a CI job did or did not run
  - You are debugging failing GitHub Actions checks
---

# CI Pipeline

The CI runs on every push to `main` and every pull request. It uses smart scoping to skip expensive jobs when only docs or native code changed.

## Job Overview

| Job                      | Purpose                                                                 | When it runs                                      |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------- |
| `docs-scope`             | Detect docs-only changes                                                | Always                                            |
| `changed-scope`          | Detect which areas changed (node/macos/android/windows)                 | Non-docs PRs                                      |
| `check`                  | TypeScript types, lint, format                                          | Push to `main`, or PRs with Node-relevant changes |
| `check-docs`             | Markdown lint + broken link check                                       | Docs changed                                      |
| `code-analysis`          | LOC threshold check (1000 lines)                                        | PRs only                                          |
| `secrets`                | Detect leaked secrets                                                   | Always                                            |
| `build-artifacts`        | Build dist once, share with other jobs                                  | Non-docs, node changes                            |
| `release-check`          | Validate npm pack contents                                              | After build                                       |
| `release-proof`          | Emit a release proof report artifact                                    | After release-check                               |
| `checks`                 | Node/Bun tests + protocol check                                         | Non-docs, node changes                            |
| `checks-windows`         | Windows-specific tests                                                  | Non-docs, windows-relevant changes                |
| `macos`                  | Swift lint/build/test + TS tests                                        | Push to `main`, or PRs with macOS changes         |
| `android`                | Gradle build + tests                                                    | Push to `main`, or PRs with Android changes       |
| `browser-native-windows` | Native Viki Browser packaging and proof                                 | Push to `main`, or PRs with Windows changes       |
| `Native Verification`    | Hosted-runner runtime, browser, voice, macOS, and Android closure lanes | Every push to `main`, every pull request          |

## Fail-Fast Order

Jobs are ordered so cheap checks fail before expensive ones run:

1. `docs-scope` + `code-analysis` + `check` (parallel, ~1-2 min)
2. `build-artifacts` (blocked on above)
3. `checks`, `checks-windows`, `macos`, `android` (blocked on build)

Scope logic lives in `scripts/ci-changed-scope.mjs` and is covered by unit tests in `src/scripts/ci-changed-scope.test.ts`.

## Runners

| Runner           | Jobs                                                   |
| ---------------- | ------------------------------------------------------ |
| `ubuntu-24.04`   | Most Linux jobs, release proof, runtime proof, Android |
| `windows-latest` | `checks-windows`, `browser-native-windows`             |
| `macos-latest`   | `macos`, `ios`, `macos-swift`                          |

## Local Equivalents

```bash
pnpm check          # types + lint + format
pnpm test           # vitest tests
pnpm check:docs     # docs format + lint + broken links
pnpm release:check  # validate npm pack
pnpm release:proof  # generate release proof report
```
