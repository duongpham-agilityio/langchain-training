# Bug: any signed-in user can continue another user's thread, and the thread row is never created early or touched (GF-13 #119, GF-14 #120)
Status: REPRODUCED

Reproduced with a script against a fake in-memory database, not with the running app (see Setup notes).

## Environment
- Branch / commit (before): detached worktree at `github/practices` @ c89c3d5
- Branch / commit (after): `fix/thread-owner-and-row-lifecycle` @ 57436b3
- Versions: Node 22, tsx via npx, `@copilotkit/runtime` 1.84.1; OS: macOS (Darwin 23.6.0)
- Source: GitHub issues #119 and #120

## Setup
1. `git worktree add --detach <dir> github/practices` then `pnpm install --frozen-lockfile` (the "before" code).
2. Copy `docs/bug-reports/ticket-119-120-thread-owner-and-row-lifecycle.repro.ts` to `apps/ai/repro-bug.tmp.ts` (it must sit inside `apps/ai` to resolve `@langchain/core`).
3. From `apps/ai`: `SRC=$PWD/src npx tsx --tsconfig tsconfig.json repro-bug.tmp.ts`. Delete the copy afterwards.
4. Repeat in the fixed checkout for the "after" run.

Setup notes: no real Postgres or Supabase is reachable (`.env*` unreadable), so `preview_start` / a live two-account run was not possible. The script drives the real `ReleaseNotesAguiAgent`, `createThreadTitleScheduler` and (when present) `createThreadGate`, with a stub `BaseAgent`, a stub title model and a fake `Pool` that interprets the thread queries by shape. The real SQL and the `identifyUser` / runtime HTTP path are not exercised.

## Steps to reproduce
1. User A runs a turn on thread `t1`; wait for the detached title step. User B (a different id) runs a turn on `t1`.
2. User A starts a first turn on `t2` that is still streaming; user B runs a turn on `t2` meanwhile.
3. User A runs two turns on `t3`; compare `updated_at` with `created_at`.
4. Make the title model throw; user A runs a first turn on `t4`.

Reproduced: always (2 consecutive runs gave the same output).

## Expected
- B is refused on A's thread (#119), including during A's first turn.
- Using a thread moves `updated_at`; a failed title call leaves a row with an empty title (#120).

## Actual (before the fix)
- B's run finishes normally and reads A's graph state (`RESULT: BUG - B continued A's thread`).
- During A's first turn there is no row at all, so B also continues (`first turn unprotected`).
- `updated_at` equals `created_at` after reuse.
- After a failed title call there is no row (`no row at all after a completed turn`).

## Evidence
Before (`github/practices` @ c89c3d5):
```
code under test: thread gate ABSENT

== #119 case 1: B opens A's existing thread ==
A run t1: RUN_STARTED,TEXT_MESSAGE_START,TEXT_MESSAGE_CONTENT,TEXT_MESSAGE_END,RUN_FINISHED
after A: row{owner=a, title="A title", updated>created=false}
B run t1: RUN_STARTED,TEXT_MESSAGE_START,TEXT_MESSAGE_CONTENT,TEXT_MESSAGE_END,RUN_FINISHED | graph state read by B: true
RESULT: BUG - B continued A's thread

== #119 case 2: B joins A's thread during A's first turn (before any title) ==
while A's first turn is running: no row
B run t2: RUN_STARTED,TEXT_MESSAGE_START,TEXT_MESSAGE_CONTENT,TEXT_MESSAGE_END,RUN_FINISHED
RESULT: BUG - first turn unprotected, B continued

== #120 case 3: A uses an old thread again ==
after turn 1: row{owner=a, title="A title", updated>created=false} | after turn 2: row{owner=a, title="A title", updated>created=false}
RESULT: BUG - updated_at === created_at after reuse (thread never moves)

== #120 case 4: title call fails on the first turn ==
[ai] thread title failed for t4: Error: title model down
A run t4: RUN_STARTED,TEXT_MESSAGE_START,TEXT_MESSAGE_CONTENT,TEXT_MESSAGE_END,RUN_FINISHED | no row
RESULT: BUG - no row at all after a completed turn
next turn, title works: row{owner=a, title="A title", updated>created=false}
```
After (fix branch):
```
code under test: thread gate present

== #119 case 1: B opens A's existing thread ==
A run t1: RUN_STARTED,TEXT_MESSAGE_START,TEXT_MESSAGE_CONTENT,TEXT_MESSAGE_END,RUN_FINISHED
after A: row{owner=a, title="A title", updated>created=true}
B run t1: RUN_STARTED,RUN_ERROR | graph state read by B: false
RESULT: refused

== #119 case 2: B joins A's thread during A's first turn (before any title) ==
while A's first turn is running: row{owner=a, title="", updated>created=false}
B run t2: RUN_STARTED,RUN_ERROR
RESULT: refused

== #120 case 3: A uses an old thread again ==
after turn 1: row{owner=a, title="A title", updated>created=true} | after turn 2: row{owner=a, title="A title", updated>created=true}
RESULT: updated_at moved

== #120 case 4: title call fails on the first turn ==
[ai] thread title failed for t4: Error: title model down
A run t4: RUN_STARTED,TEXT_MESSAGE_START,TEXT_MESSAGE_CONTENT,TEXT_MESSAGE_END,RUN_FINISHED | row{owner=a, title="", updated>created=true}
RESULT: row exists (titled later)
next turn, title works: row{owner=a, title="A title", updated>created=true}
```

## Suspected area
Failing steps: 1 and 2 (#119), 3 and 4 (#120).
Files (pre-fix code):
```ts
// apps/ai/src/index.ts: CopilotRuntime({ agents, runner })  -> no identifyUser
// apps/ai/src/agui/index.ts run(): no owner check before this.agent.getState(config)
// apps/ai/src/utils/schedule-thread-title.ts: the row is only written by the title step (createThread)
// apps/ai/src/db/threads.ts: no function updates updated_at
```
Why: the pre-fix output shows no row until the title step, B reading state, and `updated_at` unchanged. This is a suspicion, not a proven root cause.

## Not covered
- The real Postgres SQL and the runtime scoping through HTTP (`identifyUser`): not run, no database or credentials here. The first pre-fix check of #119 part (1) (`identifyUser`) therefore rests on the code reading above, not on a run.
- An earlier 24-check repro used for the first PR description had a vacuous "updated_at moved" check (the fake pool gave `created_at` and `updated_at` different timestamps at insert). This script fixes that: both start equal.

## Questions for the reporter
- Is a live two-account run on staging available to confirm? Assumption: the script result is representative.
