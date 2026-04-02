---
summary: "Grounded comparison of VikiClow against public clow/operator repos using repo-visible dimensions."
read_when:
  - Evaluating VikiClow against other public clow/operator systems
  - Explaining why VikiClow emphasizes missions, proof, and capability growth
title: "Category Benchmark"
---

# Category Benchmark

This benchmark compares VikiClow with the most direct public clow/operator repos
that materially overlap with it today:

- [OpenClaw](https://github.com/openclaw/openclaw)
- [NemoClaw](https://github.com/NVIDIA/NemoClaw)
- [Clawith](https://github.com/dataelement/Clawith)

It is grounded in public repository surfaces, README positioning, published docs,
and visible OSS workflow posture as of 2026-04-02.

It does **not** invent synthetic performance scores.
It compares what those repos clearly present to operators evaluating the category.

![VikiClow category benchmark](/assets/vikiclow-category-benchmark.svg)

## Comparison table

| Dimension | VikiClow | OpenClaw | NemoClaw | Clawith |
| --- | --- | --- | --- | --- |
| Core product story | Execution-grade clow/operator system | Personal AI assistant | Hardened OpenShell reference stack for OpenClaw | Multi-agent collaboration platform |
| Durable work model | Mission runtime with checkpoints, retries, and terminal states | Broad assistant surface, not a mission-first public story | Stateful hardened stack, but not mission-first | Agent triggers and workspaces, not a mission backbone |
| Visible execution | Browser, shell, file, voice, device, and web surfaces | Channels plus a live Canvas | Sandbox and runtime surface | Multi-agent workspace and control UI |
| Proof posture | Release proof, runtime-stack proof, execution-surface proof, mission proof | CI and release surface visible | Security and architecture emphasis, alpha posture | Audit and enterprise controls are visible |
| Capability growth | Capability Foundry with curated discovery, testing, promotion, bundling, and routing | Skills ecosystem is visible | Runtime hardening is the focus | Runtime tool discovery and install are visible |
| Persistent memory | Mission writeback and graph-memory proof paths | Always-on assistant framing | Stateful stack around deployment | Persistent memory and workspace-per-agent model |
| Governance | Protected main, green CI, release-proof discipline | OSS release and CI posture | Security-first sandboxing | RBAC, approvals, quotas, and audit logs |

## What each project optimizes for

### OpenClaw

OpenClaw is optimized for broad assistant reach.
Its public surface emphasizes channels, device coverage, onboarding, and a
personal-assistant identity.

### NemoClaw

NemoClaw is optimized for security boundaries around OpenClaw.
Its public repo emphasizes sandboxing, hardened blueprints, onboarding, and a
reference-stack posture.

### Clawith

Clawith is optimized for team and organization workflows.
Its public repo emphasizes multi-agent collaboration, long-term identity, tool
installation, triggers, approvals, and auditability.

### VikiClow

VikiClow is optimized for finished work with operator discipline.
Its repo emphasizes:

- durable missions instead of chat-only state
- proof and evidence instead of vague completion
- a visible browser product instead of invisible browsing
- capability growth through a controlled supply chain
- runtime writeback and graph-memory proof
- release and branch discipline as part of the shipped operating model

## Why this matters

The category is getting crowded with assistant shells, agent sandboxes, and
multi-agent workspaces.

VikiClow's bet is that operators eventually need all of these properties
together:

- durable state
- visible execution
- controlled expansion
- evidence
- repeatable release discipline

That is the design center this repo is built around.
