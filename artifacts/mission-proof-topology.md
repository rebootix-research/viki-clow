# Mission Proof Topology

## Persisted Proof Contract
- `proof.topology` records the swarm-of-swarms shape.
- `proof.swarmCount` records how many bounded domain swarms were assembled.
- `proof.domains` records the active mission domains.
- `proof.lastEvidenceSummary` records the latest checkpoint or terminal note.
- `proof.terminalState` and `proof.terminalMessage` persist the final mission outcome.

## Runtime Visibility
- The mission execution prompt now prints a `Swarm-of-Swarms Topology` section.
- The mission CLI `show` command now prints a proof summary block when proof exists.
- Mission records persist proof alongside checkpoint, evidence, artifacts, resume data, and approvals.

## Focused Validation
- `corepack pnpm exec vitest run --config vitest.unit.config.ts src/missions/runtime.test.ts`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false 2>&1 | Select-String 'src/missions/types.ts|src/missions/orchestration.ts|src/missions/runtime.ts|src/cli/mission-cli.ts|src/missions/runtime.test.ts'`

