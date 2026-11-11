# Plan: [M-30] Answer-quality checks (non-blocking)

## Goal
After a completed chat turn, run a small set of answer-quality evaluators and record their scores in LangSmith. They run detached, so the reply is never delayed and no evaluator failure reaches the user.

## Assumptions
- Unconfirmed: the old Mastra scorers are not in this repo. We port three checks derived from the current prompt and skills: count-only summary format, draft structure for the named destination, no invented commits (items trace to the pasted input).
- Unconfirmed: M-29 (tracing, issue #32) is still open. This ticket adds only the minimal LangSmith wiring to record a score (client plus feedback on the turn's run). Full tracing with thread and user id tags stays with M-29.
- Unconfirmed: score every completed turn that produced a reply. Skip guard-blocked turns and interrupted (pending approval) turns.
- "Failing" means a low score or an evaluator that throws. Both are logged server-side only.
- The repo has no test runner (see `CLAUDE.md`), so there is no unit-test step. Verification is typecheck, lint, build and a manual LangSmith check. Per recent history, no manual verify script is committed.
- `config.langsmith` (`apiKey`, `project`) and the `langsmith` dependency already exist; no new dependency is needed. With an empty `LANGSMITH_API_KEY` the scheduler is a no-op, matching "tracing off when the key is empty".

## Steps
1. Constants: add evaluator names, score keys and thresholds, with no magic values.
   Files: `apps/ai/src/constants/evaluators.ts` (new), `apps/ai/src/constants/index.ts` - Change: export the evaluator keys (for example `EVALUATOR_KEYS`) and the feedback source name.
2. Evaluators: pure functions `(turn) => { key, score, comment }`.
   Files: `apps/ai/src/evaluators/` (new: one file per check, plus an `index.ts` barrel) - Change: implement count-summary-format, draft-structure and grounded-items checks as deterministic checks over the user input and the final answer. The preview tool result gives the draft.
3. Scheduler: fire-and-forget hook modelled on `createThreadTitleScheduler`.
   Files: `apps/ai/src/utils/schedule-answer-evaluation.ts` (new), `apps/ai/src/utils/index.ts` - Change: `createAnswerEvaluationScheduler(client)` returns `(turn) => void`. It does nothing without an API key or run id. Otherwise it runs the evaluators detached, posts each score with `client.createFeedback`, and catches and logs every error. It never awaits in the caller.
4. Capture the turn data and hook it up.
   Files: `apps/ai/src/agui/index.ts` - Change: collect the final assistant text and any preview tool result during the stream. After `RUN_FINISHED` (next to `scheduleTitle`), call the scheduler only when `producedReply` is true and there are no interrupts. Add it as an optional constructor arg, also passed through `clone()` and `createAguiAgent`.
5. Wire up the server.
   Files: `apps/ai/src/index.ts`, `apps/ai/src/config.ts` (only if a feedback-enable flag is needed), `apps/ai/.env.example` - Change: build the LangSmith client when `config.langsmith.apiKey` is set and pass the scheduler into `createAguiAgent`. Pass the run id to the evaluators through the agent run config; this is the minimal tracing needed.
6. Docs.
   Files: `apps/ai/CLAUDE.md` - Change: short note on the evaluators folder and the non-blocking rule.

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0 (no `pnpm test`: no runner exists)
- Manual: with `LANGSMITH_API_KEY` set, one sample turn (paste a git log, ask for a destination) shows the three scores as feedback on its run in LangSmith
- Manual: make an evaluator throw, or lower a score. The chat reply and `RUN_FINISHED` are unchanged and only a server log line appears. With the key empty, nothing is sent and no error appears.
