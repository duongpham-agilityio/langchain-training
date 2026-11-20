# Ticket 164: [IP-05] User context from the agent runtime, not AsyncLocalStorage

## What it asks
Chore/refactor. Remove `AsyncLocalStorage` (`userContext`) from `apps/ai`; the agent gets an explicit LangChain runtime context (user id, time zone, optional project id) passed on each run. Tools and middlewares read it from the runtime; utils outside the agent run take user id and time zone as parameters.
Done when: no `AsyncLocalStorage` or `userContext` left in `apps/ai`; every tool gets the user from the context; `pnpm typecheck` and `pnpm test` pass; with two real accounts in the preview, user B sees none of user A's memory, History or threads.

## What's ambiguous
- "Pass it when the agent is invoked in `agui/index.ts`": the AG-UI agent receives only `RunAgentInput`, not the Hono context, so the ticket does not say where the verified user id comes from once ALS is gone.
- "Tools and middlewares read it from the runtime": `release-notes-preview` calls `formatReleaseDate()` with an implicit time zone; the ticket does not say it must now be passed.

## First step
Define the runtime context schema and wire it into `createAgent` (`contextSchema`) and the `agent.stream` call.

## Clarifying questions
1. The CopilotKit runtime copies `Authorization` and `X-Time-Zone` onto `agent.headers` for each run. Resolve the user in `ReleaseNotesAguiAgent.run` from those headers (same Supabase check as `createRequireAuth`)?
   Default assumption: yes. Correct?
   Answer: _(pending)_
2. Pass the time zone from the context into `formatReleaseDate` in `release-notes-preview`?
   Default assumption: yes.
   Answer: _(pending)_
