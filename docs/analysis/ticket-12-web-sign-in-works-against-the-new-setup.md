# Ticket 12: [M-09] Web sign-in works against the new setup

## What it asks
Chore/verification: with `VITE_SUPABASE_*` set, check that email/password and GitHub sign-in both reach the Dashboard, sign-out works, and the agent request carries the bearer token (`AppProviders`). A signed-out user must not be able to call the agent route.
Done when: "both sign-in methods land on the Dashboard; a signed-out user cannot call the agent route (401, UI shows the sign-in page or error state)."

## What's ambiguous
- "Depends on: M-01, M-08". M-01 (#37) is merged. M-08 (#11, "Server verifies the Supabase session") is OPEN and `apps/ai/src/middlewares/` is still empty, so the server returns no 401 today. The 401 half of "Done when" cannot be proven until M-08 lands.
- "Set web env (`VITE_SUPABASE_*`)": needs a real Supabase project URL and publishable key, and the GitHub OAuth provider enabled there. `.env*` files are denied to Claude and no credentials are in the repo, so a live sign-in cannot be run by the agent.
- Scope says "check", not "fix". Code read shows one likely defect on the sign-in path: `hooks/use-auth.ts` delays every `setSession` by a random 1-4 s (`setTimeout(..., 1000 * randomNumber)`), which looks like a leftover demo of the loading state. It slows landing on the Dashboard and can apply a stale session after sign-out (out-of-order timers).
- "UI shows the sign-in page or error state" for a signed-out call: the web has no 401 handling for agent calls; only the router redirect to `/sign-in` when status is `SignedOut`.

## First step
Read the existing auth path end to end (`AppBootstrap`, `use-auth`, `supabase-auth-service`, `AppProviders`, `auth-store`) and list what is verifiable offline (typecheck/build/lint, token header wiring) versus what needs live Supabase and M-08.

## Clarifying questions
1. Is the random 1-4 s delay in `use-auth.ts` intentional?
   Default assumption: No, it is a debug leftover; remove it so `setSession` runs immediately. Correct?
   Answer: _(pending)_

2. Should M-09 wait for M-08 to merge before it is closed?
   Default assumption: No. Ship what is verifiable now (web wiring, delay fix, a written verification checklist for live sign-in and the 401 check), and state in the PR that the 401 check and live Supabase runs are pending M-08 and credentials. Correct?
   Answer: _(pending)_

3. Is a 401 error state in the web UI required, or is the redirect to the sign-in page enough?
   Default assumption: Redirect is enough; no new 401 UI in this ticket (M-31 covers error and recovery UI). Correct?
   Answer: _(pending)_
