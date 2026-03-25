# Mission Runtime Proof

## Scope

Durable mission primitives wired into the existing agent execution spine.

## What Is Wired

- `beginMissionRun()` creates or resumes a mission record before the live agent run starts.
- Mission context is attached to agent events so lifecycle updates can be persisted with the run.
- Terminal completion writes back `completed` evidence, checkpoint state, and session transcript pointers.
- Terminal failure writes back a classified mission state through `finalizeFailed()`.
- Mission events are unsubscribed in `finally` so runs do not leak listeners.

## Validation

- `corepack pnpm exec vitest run --config vitest.unit.config.ts src/missions/runtime.test.ts`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit --pretty false 2>&1 | Select-String 'src/commands/agent.ts|src/missions/runtime.ts|src/missions/store.ts|src/infra/agent-events.ts|src/missions/types.ts|src/missions/orchestration.ts'`

## Result

- Mission runtime tests passed.
- Filtered type-check output for touched mission files was clean.
