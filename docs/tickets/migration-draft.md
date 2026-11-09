# Tickets draft: Migration (Phase 1)

Source: [migration intent](../intents/migration.md), [practice plan](../practice-plan/README.md) Phase 1.
Status: draft. Not yet created as GitHub Issues.

## How to read this

- One ticket = one result a reviewer can check on its own. Target size: 1-3 hours, max half a day.
- `Depends on` lists tickets that must be merged first. Tickets with no dependency on each other can run in parallel.
- Old app = `copilotkit-training/release-copilot` (Mastra). It is the source to **port prompt wording, rules and API shapes from**, not a parity target. There is no parity check (intent decision).
- UI is already moved. Tickets touch `apps/web` only to fix endpoints, env and wiring. No UI redesign.
- Server work lives in `apps/ai` and follows `apps/ai/CLAUDE.md` (tool = constant + zod schema + `tool(...)`, `@/` alias, barrels, no magic values, env only in `config.ts`).
- Cut line (intent): if day 3 runs short, cut M-30 (answer-quality), then M-29 (tracing). Never cut M-26, M-27, M-28.

## Current state of the LangChain app (read before migrating)

What `apps/ai` has today, and what each gap means for the tickets. Checked against `apps/ai/src`, `apps/ai/package.json` and the web wiring.

| Area | Today | Gap | Ticket |
| :-- | :-- | :-- | :-- |
| Agent | `createAgent` + `ChatOpenAI({ model })`, one sample tool `get_current_time`, `systemPrompt` is the string "You are a helpful assistant." No middleware, no checkpointer, no structured output. | Factory takes no options; nothing to plug middleware, a checkpointer or a dynamic prompt into. Sample tool must go. | M-11, M-12, M-14 |
| AG-UI bridge | `@ag-ui/langchain` `LangChainAgent` with `chainFn` that streams **text chunks only**; server tool calls are dropped on purpose. | The preview card is a tool call the UI must see. Also `chainFn` ignores the `threadId` the bridge passes, so nothing is keyed by thread. | M-04, M-15, M-22 |
| Runtime | `CopilotRuntime` with one agent named `default` and `InMemoryAgentRunner`. | Web asks for agent id `releaseCopilotAgent` (`RELEASE_COPILOT_AGENT_ID`); server registers `default`. Conversation state is in memory and lost on restart. | M-01, M-22 |
| Ports and paths | Server: `:4000`, `/api/copilotkit`. Web `.env.example`: `:4111/copilotkit` and `VITE_API_SERVER_URL=:4111`. Web `COPILOTKIT_ROUTE_PATH` is `/copilotkit`. | Web and server disagree on port and path; the REST endpoints (History, Slack, threads) will live on the same server and use `VITE_API_SERVER_URL`. | M-01 |
| Config | `config.ts` holds port, CORS origin, model, runtime path. `dev` also loads `../web/.env`. | No Supabase, Slack, LangSmith or fallback-model settings. | M-02 |
| CORS | `cors: { origin }` set only on the CopilotKit endpoint. | The new REST routes need CORS and must allow the `Authorization` header. | M-02, M-08 |
| Dependencies | `langchain`, `@langchain/core`, `@langchain/langgraph`, `@langchain/openai`, `@ag-ui/*`, `@copilotkit/runtime`, `hono`, `zod`. | Missing: Supabase client, Postgres driver, LangGraph Postgres checkpointer, LangSmith. Middleware for summarization, fallback, PII ship inside `langchain` (check version). | M-02 |
| Auth | None. Web already sends `Authorization: Bearer <supabase access token>`. | Server must verify it. | M-08 |
| Threads | CopilotKit runtime has no thread list route. Web calls `GET /api/memory/threads` and validates with `ListThreadsResponseSchema`. | Own endpoint needed, same shape. | M-23 |
| Folders | `middlewares/` and `skills/` are empty (`.gitkeep`). | Where guards and ported skills go. | M-12, M-13, M-27, M-28 |
| Tooling | No test runner, no lint script in `apps/ai`; `typecheck` and `build` (tsup) exist. | Done-when checks use typecheck, build and manual runs. | all |

## Overview

| Day | Tickets | Day ends with |
| :-- | :-- | :-- |
| 1 | M-01 to M-10 | Sign-in works; spike result recorded |
| 2 | M-11 to M-21 | Paste a log, get a count summary and a preview card; History and Slack work |
| 3 | M-22 to M-32 | Threads and memory work; bad input blocked or redacted; Phase 1 done |

Dependency spine: M-01 -> M-02 -> M-03 -> M-08 (auth) -> M-18/M-19 (endpoints) -> M-22 (checkpointer) -> M-23..M-25 (threads, memory).
Spike (M-04..M-06, recorded in M-07) gates M-15, M-20, M-22, M-24.

---

## Day 1: Setup, spike, foundation

### M-01 Align env, ports, paths and agent id between web and server
- **Scope:** Pick one port and path for the runtime and use it in server defaults (`constants/server.ts`), web `.env.example` and web `endpoints.ts` (today `:4000/api/copilotkit` vs `:4111/copilotkit`). Point `VITE_API_SERVER_URL` at the same server. Make the registered agent id match `RELEASE_COPILOT_AGENT_ID` (`releaseCopilotAgent`) instead of `default`.
- **Depends on:** none
- **Done when:** `pnpm dev` starts both apps; the web client connects to the runtime (no connection error banner); a chat message reaches the agent under the id the web asks for.

### M-02 Add server dependencies and config shape
- **Scope:** Add packages the migration needs: Supabase client, Postgres driver, LangGraph Postgres checkpointer, LangSmith. Check the installed `langchain` version ships the summarization, model-fallback and PII middleware; if not, bump it. Extend `config.ts` (single `as const` object, constants for defaults) with Supabase URL and keys, database URL, Slack webhook, LangSmith key and project, fallback model name. Update `apps/ai/.env.example`. Allow CORS for the `Authorization` header and for non-CopilotKit routes.
- **Depends on:** M-01
- **Done when:** `pnpm typecheck` and `pnpm build` pass; a missing required variable fails at startup with a message naming it; no env var is read outside `config.ts`.

### M-03 Connect the server to the Supabase project
- **Scope:** Create or reuse the Supabase project; add a server-side Supabase client and a Postgres connection (used later by the checkpointer). Add a DB check to `/health`.
- **Depends on:** M-02
- **Done when:** `/health` reports DB reachable; wrong credentials make it report unreachable instead of crashing the server.

### M-04 Spike A: stream tool-call data to the UI, including the preview card while it is built
- **Scope:** Throwaway agent with one fake `renderReleaseNotesPreview`-style tool. Today `agui/index.ts` yields only text chunks and drops server tool calls on purpose. Find out how to let the UI receive tool-call start, argument deltas and result so the draft card fills in progressively. Try the frontend-tool route and the stream-forwarding route.
- **Depends on:** M-01
- **Done when:** UI shows a card that grows while the tool call streams, or the blocker and fallback (card appears only when the call completes) are written down with evidence.

### M-05 Spike B: agent confirmation request shows in the UI
- **Scope:** Throwaway tool that needs approval (human-in-the-loop). Check that the approval prompt appears in the UI, that Approve and Reject both resume the run, and that Reject stops the action.
- **Depends on:** M-01
- **Done when:** both paths work in the UI, or the blocker and fallback are written down.

### M-06 Spike C: client-made thread ids and generated thread titles
- **Scope:** Client sends its own thread id in the URL (`/?thread=<id>`). Check that the `threadId` the bridge passes to `chainFn` can key the conversation, that a reload reuses it, and that the server can generate a title after the first turn without blocking the run. Also check how AG-UI resends full history each run versus a checkpointer that already holds it (risk of duplicated messages).
- **Depends on:** M-01
- **Done when:** same id gives the same conversation after reload with no duplicated messages; title is generated and readable by the client; or fallback written down.

### M-07 Record spike result and decide
- **Scope:** One short doc `docs/spikes/migration-spike.md`: for A, B, C: works / needs fallback, how, and what it changes in M-15, M-20, M-22, M-24. Delete or isolate throwaway spike code.
- **Depends on:** M-04, M-05, M-06
- **Done when:** doc exists and every unknown is marked works or fallback; no throwaway code left on the main path. If a spike overruns the half-day box, extend it and move the schedule; do not drop the requirement (intent).

### M-08 Server verifies the Supabase session
- **Scope:** Hono middleware on `/api/*`, the REST routes and the CopilotKit route: read `Authorization: Bearer <token>`, verify with Supabase, put the user id on the request context. Reject missing or invalid token with 401. Port the owner-id idea from the old `require-owner-id`.
- **Depends on:** M-03
- **Done when:** request without token gets 401; with a valid token the handler sees the user id; `/health` stays public.

### M-09 Web sign-in works against the new setup
- **Scope:** Set web env (`VITE_SUPABASE_*`), check email/password and GitHub sign-in, sign-out, and that the agent request carries the bearer token (`AppProviders`).
- **Depends on:** M-01, M-08
- **Done when:** both sign-in methods land on the Dashboard; a signed-out user cannot call the agent route (401, UI shows the sign-in page or error state).

### M-10 Day 1 check-in
- **Scope:** Confirm spike doc, sign-in and env all merged; list any risk that moves day 2.
- **Depends on:** M-07, M-09
- **Done when:** day 1 ends with sign-in working and spike result recorded.

---

## Day 2: Agent core, database, History and Slack

### M-11 Make the agent factory and AG-UI bridge extensible
- **Scope:** No behavior change. `createBaseAgent` accepts options (middleware list, checkpointer, system prompt source) and passes them to `createAgent`. The AG-UI `chainFn` forwards the `threadId` into the agent call config (`configurable.thread_id`). Keep the factory style, no module-level singletons.
- **Depends on:** M-02
- **Done when:** `pnpm typecheck` passes; chat still works exactly as before; a thread id reaches the agent call (visible in a log or trace).

### M-12 Port instructions as a dynamic system prompt
- **Scope:** Move old instruction text (base: reply language, ask-before-guessing, security; release-notes: intro, loop) into `constants/prompts.ts` as-is, replacing "You are a helpful assistant." Build the prompt through a dynamic-prompt middleware (file in `src/middlewares/`) so later phases can add per-user parts.
- **Depends on:** M-11
- **Done when:** the agent answers using the old wording; diff against the old text shows only mechanical changes.

### M-13 Port parsing, classification and formatting rules as on-demand skills
- **Scope:** Port `commit-pr-parsing`, `classification-rules`, `platform-formatting`, `release-reporting` into `src/skills/`. They load when needed, not on every turn.
- **Depends on:** M-12
- **Done when:** pasting a git log makes the agent load the parsing and classification rules; a plain greeting loads none.

### M-14 Preview tool `renderReleaseNotesPreview`
- **Scope:** Add the tool (name in `TOOL_NAMES`, zod v4 schema, `tool(...)`, register in `tools/index.ts`). Input shape is what the web `release-notes-draft` type expects. Include automatic title and date by reusing the existing helpers. Remove the sample `get_current_time` tool and its schema.
- **Depends on:** M-07, M-12
- **Done when:** the tool returns a valid draft; invalid input is rejected by the schema with a clear error; sample tool is gone.

### M-15 Stream the preview card to the UI
- **Scope:** Apply the spike A result in `agui/`: tool call data reaches the client, the draft card and Live Preview render, and draft state (`draft-slice`) updates per thread.
- **Depends on:** M-07, M-14
- **Done when:** paste a log, the draft card and Live Preview fill in the UI; Markdown export of the draft downloads as before.

### M-16 Count-only summary flow
- **Scope:** Wire instructions, skills and preview tool so a pasted git log or PR gets classified and answered with a count-only summary, then a draft for the destination the user names.
- **Depends on:** M-13, M-15
- **Done when:** paste a log, get counts per class, then ask for a destination and get a preview card in that format.

### M-17 Database schema for Release History
- **Scope:** SQL migration for the `release_history` table (owner id, fields the web `release-history-record` type needs, timestamps) and row-level security so a user sees only their rows. Start empty (no Turso data).
- **Depends on:** M-03
- **Done when:** migration applies cleanly on a fresh project; a query as user A returns none of user B's rows.

### M-18 History endpoints: list, search, filter, detail, save
- **Scope:** `GET /release-history`, `GET /release-history/:id`, save endpoint, with the same request and response shape the web zod schemas validate. Behind the M-08 middleware.
- **Depends on:** M-08, M-17
- **Done when:** the History page lists, searches, filters, opens detail and saves with no web code change beyond env; shape mismatch fails the existing `safeParse`.

### M-19 Slack publish endpoint and webhook client
- **Scope:** Port `post-to-slack-webhook` and `POST /slack/publish` with the same request shape; webhook URL from config only.
- **Depends on:** M-08
- **Done when:** publish from History posts to Slack; a failing webhook returns an error the UI shows through `network-error-message`.

### M-20 Slack tool `publishReleaseNotesToSlack` with confirmation
- **Scope:** Agent tool for "publish from chat", reusing the M-19 client. Ask the user to confirm before sending, using the spike B result.
- **Depends on:** M-07, M-19
- **Done when:** chat asks for confirmation; Approve posts once; Reject posts nothing.

### M-21 Day 2 end-to-end check
- **Scope:** Run: sign in, paste log, count summary, preview card, save to History, publish to Slack from chat and from History. Fix small gaps; log bigger ones as new tickets.
- **Depends on:** M-16, M-18, M-20
- **Done when:** the whole run passes on the unchanged UI.

---

## Day 3: Threads, memory, safety, quality

### M-22 Checkpointer on Supabase Postgres
- **Scope:** Add the LangGraph Postgres checkpointer to the agent; one-time setup of its tables; the `threadId` from the client is the checkpoint key. Replace `InMemoryAgentRunner` use where it keeps conversation state. Apply the spike C answer on duplicated history.
- **Depends on:** M-03, M-07, M-11
- **Done when:** restart the server, reload the thread in the browser, and continue the same conversation with no repeated messages.

### M-23 Thread list endpoint
- **Scope:** `GET /api/memory/threads` returns the current user's threads in the shape `ListThreadsResponseSchema` expects. Scoped by user id; a user never sees another user's threads.
- **Depends on:** M-08, M-22
- **Done when:** sidebar lists past threads grouped by date; second user's list is separate.

### M-24 Generated thread titles
- **Scope:** After the first turn, generate a short title without blocking the run; store it with the thread. Skip when a guard blocked the turn (no row, matches the `THREAD_ROW_GRACE_MS` note in the web).
- **Depends on:** M-07, M-23
- **Done when:** new thread gets a title that appears in the sidebar via the existing polling; a blocked turn leaves no thread row.

### M-25 Conversation memory: recent kept, older summarized
- **Scope:** Add prebuilt summarization middleware: keep the last N messages, summarize older ones. N and the trigger size go in `constants/`.
- **Depends on:** M-22
- **Done when:** a long thread still answers questions about early content through the summary; context sent to the model stays under the limit.

### M-26 Model fallback middleware
- **Scope:** Prebuilt model-fallback middleware with a second model from config.
- **Depends on:** M-02, M-11
- **Done when:** with the primary model forced to fail, the reply still arrives from the fallback; both model names come from config.

### M-27 Prompt-injection guard middleware
- **Scope:** Port the old rule set (`guardrails/prompt-injection`) into middleware that blocks the turn before the model runs and returns a clear refusal.
- **Depends on:** M-12
- **Done when:** known injection samples are blocked; a normal git log containing words like "ignore" in a commit message still passes.

### M-28 PII redaction middleware
- **Scope:** Port `guardrails/pii` into middleware that redacts PII in input before the model sees it (and in stored messages).
- **Depends on:** M-12
- **Done when:** an email or phone in the pasted text is redacted in what the model receives; non-PII commit text is unchanged.

### M-29 Tracing with LangSmith
- **Scope:** Enable tracing from config (key and project), tag runs with thread id and user id.
- **Depends on:** M-02
- **Done when:** one chat turn shows a trace with tool calls and model calls; tracing off when the key is empty. *Cut-line item (second to cut).*

### M-30 Answer-quality checks (non-blocking)
- **Scope:** Port the old scorers as LangSmith evaluators; they run after the answer and never block or delay the reply.
- **Depends on:** M-16, M-29
- **Done when:** scores appear in LangSmith for a sample run; a failing score does not change what the user sees. *Cut-line item (first to cut).*

### M-31 Error and recovery UI against the new server
- **Scope:** Check `ToolErrorCard`, chat send-failure, runtime-connection and error boundaries against real server errors: 401, 5xx, server down, guard block, tool failure.
- **Depends on:** M-21
- **Done when:** each failure shows its message and a retry or recovery action; none leaves the UI stuck.

### M-32 Final run-through against the intent
- **Scope:** Walk the intent's feature list end to end on the unchanged UI; note anything failing; fix or ticket it.
- **Depends on:** all above (minus any cut)
- **Done when:** every feature in the intent scope works end to end; cut items are named in the PR.

---

## Open questions

- Should the checkpointer use the same Supabase Postgres connection as the History table, or its own schema? (Default: same database, own schema.)
- Does the server read History through the Supabase client with the user's token (RLS enforces owner) or through a service connection with an owner filter in code? (Default: user token and RLS.)
- Which second model is the fallback, and is a second provider key available? (Default: a second OpenAI model.)
- Is `docs/spikes/` an acceptable place for the spike result, or should it go in the GitHub issue? (Default: `docs/spikes/`.)
- Which port wins in M-01: server's `:4000` or web's `:4111`? (Default: `:4000`, `/api/copilotkit`, since the server already runs there.)
