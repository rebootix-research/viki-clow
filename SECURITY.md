Security Policy & Operational Trust Model
Project: VikiClow (rebootix-research)
Status: Clinical/Institutional Grade

1. Executive Summary
   VikiClow is an elite, high-performance personal intelligence suite developed by Rebootix Research. Unlike consumer SaaS platforms, VikiClow is architected for the Sovereign Operator. We prioritize execution speed and deep system integration over generic "safety" sandrails that restrict quantitative and technical workflows.

If you believe you have discovered a security vulnerability that crosses a documented trust boundary, we request a private disclosure via the protocols listed below.

2. Reporting a Vulnerability
   2.1 Primary Channel
   Direct all sensitive findings to the Rebootix Security triage team:

Email: security@rebootix-research.com

Lead Architect: Laraib Khan

Head of Trust: Nabeel Saleem

2.2 Mandatory Report Content
To ensure rapid triage and bypass automated filtering, your report must include:

Technical Title: Concise description of the vulnerability.

Mathematical Severity: Estimated CVSS v4.0 score.

Affected Component: (e.g., Core Gateway, Mobile Node, WebSocket RPC, Canvas Host).

Reproduction (PoC): A functional, vectorized script or step-by-step reproduction targeting the latest main commit.

Environment: Node.js version, OS, and hardware architecture.

Remediation Logic: A concrete proposal for a patch that preserves system velocity.

3. The Rebootix "Sovereign Operator" Trust Model
   VikiClow does not model a single gateway as a multi-tenant, adversarial environment. Our security assumptions are clinical:

3.1 The Single-User Root of Trust
Axiom: The Gateway is a personal tool. Anyone who can authenticate with the Gateway is treated as a Trusted Operator.

Implication: Session identifiers (sessionKey, label) are routing controls, not cryptographic authorization boundaries between different humans.

Isolation: If multiple users require VikiClow, they must run isolated instances (separate Docker containers or VPS).

3.2 Host-First Execution
Default State: VikiClow prioritizes host performance. agents.defaults.sandbox.mode is off by default.

Operator Choice: Sandboxing is an opt-in security layer (sandbox: "require").

Non-Bug: Host-side execution when the sandbox is disabled is intended behavior and not a vulnerability.

3.3 Plugin Trust Boundary
Plugins and Skills are part of the Trusted Computing Base (TCB).

The Rule: Installing or enabling a plugin grants it the same trust level as local code running on that gateway host.

Boundary: Reports must demonstrate a bypass of the plugins.allow whitelist or an unauthenticated plugin load. Malicious behavior from an already-installed trusted plugin is out of scope.

4. Triage Fast-Path (Researcher Requirements)
   For immediate acceptance, a report must prove a breach of the following boundaries:

Unauthenticated Access: Gaining control plane access without valid credentials or pairing.

Sandbox Escape: Executing code on the host when sandbox: "all" is strictly enforced.

Path Traversal: Accessing files outside the authorized workspace when tools.fs.workspaceOnly: true is enabled.

Exposed Secrets: Proof that a credential is VikiClow-owned and grants access to Rebootix infrastructure.

5. Explicitly Out of Scope (The "Non-Bugs")
   The following patterns are frequently reported but are closed as invalid by design:

5.1 Prompt Injection
Philosophy: Prompt injection is a model-level alignment task.

Scope: Unless a prompt injection leads to a documented boundary bypass (e.g., escaping a sandbox to the host), it is not treated as a security vulnerability.

5.2 Local File Access
Context: VikiClow assumes the host OS is secure.

Invalid Claims: "If I can write to ~/.vikiclow/config.json, I can compromise the app." This is correct, but the "Trusted Operator" boundary was breached at the OS level first.

5.3 Heuristic Detection Parity
Context: VikiClow uses best-effort regex to warn operators of dangerous commands.

Invalid Claims: Reports that only show differences in heuristic detection (e.g., system.run catches a pattern that a sub-node does not) without an accompanying auth/sandbox bypass.

5.4 Network Exposure
Protocol: VikiClow binds to loopback by default.

Invalid Claims: Reports citing risks of exposing the Gateway to the public internet. This is a deployment failure. Use Tailscale Serve or SSH tunnels for remote access.

6. Deployment Assumptions
   VikiClow security guidance assumes:

The Host is Secure: The OS where VikiClow runs is within a trusted admin boundary.

One User per Machine: We do not support "shared gateways" between mutually untrusted people.

Local Use Only: The Gateway Control UI is intended for localhost-only use unless wrapped in a secure tunnel (Tailscale/SSH).

7. Configuration Hardening (Standard Profile)
   To achieve "Rebootix-Grade" security, we recommend:

Pin Plugins: Set plugins.allow to specific IDs.

Workspace Isolation: Set tools.fs.workspaceOnly: true.

Sub-Agent Gating: Set sessions_spawn: deny to prevent unauthorized agent delegation.

Immutability: Run via Docker with --read-only and --cap-drop=ALL.

8. Runtime Requirements & Security
   8.1 Node.js Hardening
   VikiClow requires Node.js 22.12.0 or later. This mitigates:

CVE-2025-59466: Async_hooks DoS.

CVE-2026-21636: Permission model bypass.

8.2 Secret Scanning
We utilize detect-secrets in our CI/CD pipeline.

Baseline: .secrets.baseline

Local Check: detect-secrets scan --baseline .secrets.baseline

9. Maintainer Operations (GHSA)
   Maintainers patching GHSAs via the CLI must include the modern API header:
   X-GitHub-Api-Version: 2022-11-28

10. Recognition & Bounties
    Rebootix Research is a high-velocity lab. Currently, we do not offer monetary bug bounties.

The Reward: Elite researchers who provide valid, high-impact disclosures will be invited to the Rebootix Private Alpha and credited in our hall of fame.

Laraib Khan
Founder & Chief Architect, Rebootix Research

Nabeel Saleem
Head of Security & Trust
