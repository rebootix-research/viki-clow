## VikiClow Vision

VikiClow is the execution system that should have existed before AI became a UI trend.

The product thesis is direct:

- an AI should be able to operate, not only converse
- missions should survive time, retries, and restarts
- browser, local-computer, device, channel, and memory surfaces should feel like one system
- proof should be built into the runtime instead of added as a marketing screenshot after the fact

## The standard we are building toward

VikiClow should feel like a serious operator product:

- mission-first instead of message-first
- execution-first instead of suggestion-first
- durable instead of stateless
- verifiable instead of optimistic

## Product priorities

Current priorities:

- execution reliability
- safe defaults and explicit approvals
- browser, voice, and memory readiness
- first-run setup that leaves the system immediately usable

Next priorities:

- stronger cross-platform native surfaces
- richer mission replay and recovery
- deeper self-evolution benchmarks and promotion logic
- broader hardware and device control coverage

## Architecture stance

We prefer:

- clear orchestration boundaries
- typed plugin surfaces
- durable state and inspectable artifacts
- local-first operator control where practical

We avoid:

- chat-only product design
- hidden magic that cannot be audited
- fragile agent loops with no verifier or recovery boundary

## Plugins, skills, and memory

Core should stay opinionated about the runtime while letting optional capability ship through plugins and skills.

Memory is not treated as prompt decoration. It is treated as infrastructure:

- mission writeback
- graph memory proof
- search and retrieval that survive provider changes

## Contribution posture

The bar for merging into core is high because VikiClow is trying to be a dependable runtime, not a feature landfill.

We want:

- focused changes
- strong tests and proof
- product-facing clarity
- compatibility when it matters
- deliberate breaking changes when the product is better for it

## The long-term goal

VikiClow should become the system people reach for when they want AI to actually finish work:

- on their machine
- in their browser
- through their channels
- with their memory and policy
- with a clear trail of what happened
