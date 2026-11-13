# Bug: the draft shown in the Live Preview never reaches the model (GF-10 #117, gap G-06)
Status: REPRODUCED

Reproduced at the AG-UI agent boundary with a fake graph (see Setup notes), not through the UI.

## Environment
- Branch / commit: `fix/draft-context-reaches-model` @ 4d316a3 (`github/practices`, includes #110)
- Versions: Node 22.22.2, tsx from `apps/ai`; OS: macOS (Darwin 23.6.0)
- Source: GitHub issue #117

## Setup
1. `pnpm install --frozen-lockfile`.
2. Copy `docs/bug-reports/ticket-117-draft-context-reaches-model.repro.ts` to `apps/ai/repro.tmp.ts`.
3. From `apps/ai`, run it with dummy env (command in the script header). Delete the copy afterwards.

Setup notes: the app was not run live. The shell has no Supabase / OpenAI / `DATABASE_URL` values and `.env*` is unreadable by rule, so the sign-in gate and the model cannot work; `.claude/launch.json` has no AI server entry. The script calls `createAguiAgent(fake).run(input)` with a graph stub that records the `stream` input. `docs/reports/` (G-06 repro / `ai-contract`) does not exist in this checkout.

## Steps to reproduce
1. Build a `RunAgentInput` for a thread with one user message `make this shorter` and `context: [{ description, value }]` where `value` is an OLDER draft (`OLDER-DRAFT-TEXT`).
2. Run `ReleaseNotesAguiAgent.run` and read what is passed to `agent.stream`.

Reproduced: always (2 of 2 runs).

## Expected
The latest human message handed to the graph carries the shown draft (read-only block, this turn only), so a "make this shorter" request is built from the reopened draft.

## Actual
```
agent input: {"messages":[{... "HumanMessage", "kwargs":{"content":"make this shorter","id":"m1", ...}}]}
model sees on-screen draft: false
```
Only the bare user text reaches the model; `input.context` is dropped.

## Evidence
See Actual. Read from code: `toLangChainMessages` comment says "System/developer/context are owned by the server prompt"; `grep context apps/ai/src/agui/index.ts` finds no use of `input.context`. Web side sends `{ draft: view.draft }` (old shape), not `{ release, format, text, hash }`. Not observed: a live two-draft chat run.

## Suspected area
Failing step: 2
```ts
// apps/ai/src/agui/index.ts:57
/** AG-UI history -> LangChain messages. System/developer/context are owned by the server prompt. */
// apps/ai/src/agui/index.ts:~190
const agentInput = ... { messages: hasState ? trimToNewMessages(messages) : messages };
// apps/web/src/hooks/use-agent-context.ts:18
value: { draft: view.draft },
```
Why: `run` never reads `input.context`, and `RELEASE_FLOW` (`constants/prompts.ts:319`) says nothing about an edit applying to the shown draft; the model only has its own thread history, so "newest draft" wins. This is a suspicion, not a proven root cause.

## Questions for the reporter
- Value shape when no draft is shown? Assumption: web sends `null` value; server adds no block.
- Is the context entry matched by description or by position? Assumption: the server uses the entry whose `description` equals a shared constant.
