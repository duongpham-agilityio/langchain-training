# M-10 Day 1 check-in: verification

Issue #13. Done when: day 1 ends with sign-in working and the spike result recorded. Checked on 2026-11-09 against `practices` at merge commit `05d6b68` (PR #45, the latest merged PR; `git fetch` showed nothing newer).

**Verdict: spike result recorded and all day 1 tickets merged; sign-in is NOT confirmed live (needs Supabase credentials that this check did not have), so "sign-in working" stays open until check 4 below is run by hand.**

## 1. Checklist: tickets

| Ticket | Issue | Issue state | Merged PR | Evidence |
|--------|-------|-------------|-----------|----------|
| M-01 env, ports, paths, agent id | #4 | CLOSED | #37 `chore(runtime): align web and server url, path and agent id` | `gh issue view 4`; `RUNTIME_BASE_PATH = "/api/copilotkit"` and `RELEASE_COPILOT_AGENT_ID = "releaseCopilotAgent"` in `apps/ai/src/constants/server.ts`; web `COPILOTKIT_ROUTE_PATH = '/api/copilotkit'` in `apps/web/src/constants/endpoints.ts`. Port and path agree. |
| M-02 server deps and config shape | #5 | CLOSED | #38 `chore(ai): add server dependencies and config shape` | `apps/ai/src/config.ts` requires `OPENAI_API_KEY`, `SUPABASE_*`, `DATABASE_URL` at startup. |
| M-03 Supabase connection | #6 | CLOSED | #39 `feat(ai): connect server to supabase and add db check to health` | PR merged, issue closed. Live DB connection not re-run (no credentials). |
| M-04 spike A | #7 | CLOSED | #41 | `docs/spikes/ticket-7-tool-call-streaming.md` |
| M-05 spike B | #8 | CLOSED | #42 | `docs/spikes/m-05-hitl-confirmation.md` |
| M-06 spike C | #9 | CLOSED | #40 | `docs/spikes/spike-c-threads.md` |
| M-07 spike result | #10 | CLOSED | #44 `docs(spikes): record migration spike decision and remove throwaway code` | `docs/spikes/migration-spike.md` exists. |
| M-08 server verifies session | #11 | CLOSED | #43 `feat(ai): verify supabase session on /api routes` | `createRequireAuth` in `apps/ai/src/middlewares/auth.ts`, mounted on `/api/*` in `apps/ai/src/index.ts`. |
| M-09 web sign-in | #12 | CLOSED | #45 `fix(web): apply auth session change immediately` | `Authorization: Bearer` header set in `apps/web/src/providers/AppProviders.tsx`. Live run: see section 3. |

M-10 (#13) itself stays open: this doc is not commented on or closed from here.

## 2. Spike doc and throwaway code

- `docs/spikes/migration-spike.md` exists. Spikes A, B and C each have a result (works) and a decision. Every row of its "Unknowns" table has a status and a fallback; none is unmarked. Marked "works expected" (not proven): real `ChatOpenAI` chunk shape, `PostgresSaver`.
- Throwaway code gone: `apps/ai/src/spikes/`, `apps/web/src/spikes/`, `apps/web/hitl-spike.html`, `apps/web/spike-tool-stream.html` do not exist; no `spike` script in the root or app `package.json`.

## 3. Sign-in re-run on current `practices`

Not run. The worktree has no `apps/ai/.env` or `apps/web/.env`, and no Supabase project credentials were available to this check, so `pnpm dev` cannot start the server (`config.ts` throws on the missing variables). Sign-in with email and password was not entered by the checker.

Steps from `docs/verification/m-09-web-sign-in.md`; fill the Result column by hand:

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Open `http://localhost:5173/` signed out | Redirect to sign-in | UNVERIFIED |
| 2 | Sign in with email and password | Dashboard right away | UNVERIFIED |
| 3 | Sign out | Back to sign-in | UNVERIFIED |
| 4 | Sign in with GitHub | Dashboard | UNVERIFIED |
| 5 | Chat message, `/api/copilotkit` request headers | `Authorization: Bearer <token>` | UNVERIFIED (code sets it in `AppProviders.tsx`) |
| 6 | Signed out, open agent route | Redirect to `/sign-in` | UNVERIFIED |
| 7 | `curl -i -X POST <VITE_API_SERVER_URL>/api/copilotkit` with no token | `401` | UNVERIFIED (code returns 401 for a missing token; the `PENDING M-08` note in the M-09 checklist is stale, M-08 is merged) |

Static and build checks on current `practices` (all run in this worktree): `pnpm lint` exit 0, `pnpm typecheck` exit 0, `pnpm build` exit 0. There is no test runner (`pnpm test` has no script and exits 1).

## 4. Risks for day 2

Source: "Unknowns" in `docs/spikes/migration-spike.md`, plus the failed-to-verify sign-in.

| # | Risk | Affected day 2 ticket | Likelihood | Proposed change |
|---|------|-----------------------|------------|-----------------|
| 1 | Sign-in is unverified live; a broken auth or env setup blocks every authenticated call | M-11 onward (all agent calls go through `/api/*`); M-21 end-to-end check | Low-medium | Run section 3 by hand before starting M-11; if it fails, fix first and push M-11 back by that time. |
| 2 | Real `ChatOpenAI` chunk shape differs from the scripted model used in the spikes | M-15 (#18) stream preview card | Low-medium | Keep M-15 as the first real-model check; allow extra time and use `handleLLMNewToken` as the fallback. Do not schedule M-16 until M-15 streams with the real model. |
| 3 | Parallel tool calls arrive on indexes other than `[0]` | M-15 | Medium | Handle all chunk indexes in M-15 (already in the spike plan); otherwise disable parallel tool calls on the model. No schedule change. |
| 4 | `PostgresSaver` behaves differently from `MemorySaver`; runner replay on reload conflicts with the checkpointer | M-22 (#25) | Medium | Keep M-22 after M-17 (schema) and M-11; re-run thread checks against Postgres. Treat M-22 as the largest-variance ticket; start it early on day 2 or split into saver setup and reload checks. |
| 5 | Model does not reliably ask for confirmation before Slack publish | M-20 (#23) | Low | Server-side gate already specified; no schedule change. Test Reject explicitly. |
| 6 | Pending confirmation lost across reload, and middleware (summarization) with `streamMode: "messages"` untested | M-20, M-25 (#28) | Medium | Treat an unanswered confirmation as rejected (M-20); verify summarization in M-25 before M-26 to M-28 depend on it. |
| 7 | M-03 live DB connection not re-run here | M-17 (#20), M-22 | Low | Confirm `/health` db check at the start of M-17. |

No risk requires dropping a day 2 ticket. The two schedule-relevant items are risk 1 (run sign-in first) and risk 4 (M-22 variance).
