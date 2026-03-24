# Temporal + LangGraph Mission Backbone

## Persisted Boundary
- `backbone.temporal` stores the durable mission execution boundary.
- `backbone.langGraph` stores the bounded swarm graph with verifier and recovery routing.
- Both layers are derived from the same persisted mission record.

## Runtime Wiring
- `beginMissionRun()` now persists the backbone at mission start.
- Mission events, capability preflight, and terminal states refresh the backbone snapshot before save.
- The mission prompt prints both the Temporal boundary and the LangGraph boundary.
- The mission CLI `show` command prints the backbone summary.

## Validation
- `corepack pnpm exec vitest run --config vitest.unit.config.ts src/missions/runtime.test.ts`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false 2>&1 | Select-String 'src/missions/backbone.ts|src/missions/types.ts|src/missions/orchestration.ts|src/missions/runtime.ts|src/cli/mission-cli.ts|src/missions/runtime.test.ts|src/missions/index.ts'`

