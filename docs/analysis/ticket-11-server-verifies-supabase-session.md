# Ticket 11: [M-08] Server verifies the Supabase session

## What it asks
Feature in `apps/ai`: a Hono auth middleware on `/api/*` (REST routes and the CopilotKit route). It reads `Authorization: Bearer <token>`, verifies the token with Supabase, and puts the user id on the request context. Missing or invalid token gets 401. Port the owner-id idea from the old `require-owner-id`.
Done when: "request without token gets 401; with a valid token the handler sees the user id; `/health` stays public."

## What's ambiguous
- "Port the owner-id idea from the old `require-owner-id`": that code is not in this repo (no match in `apps/` or `docs/`). Unclear what the idea is exactly (a typed `userId` on the context? a guard that every handler reads it?).
- "verify with Supabase": two ways. `supabase.auth.getUser(token)` (network call, catches revoked sessions) or local JWT verification (no call, needs the JWT secret / JWKS).
- "the REST routes": none exist yet (M-18/M-19/M-23 add them). Only `/api/copilotkit/*` exists today, so the middleware is verified on that route only.
- "put the user id on the request context": key name and typing are not given.
- 401 body shape is not given.
- CORS preflight (`OPTIONS`) carries no `Authorization` header; it must not get 401.

## First step
Add `requireAuth` middleware under `apps/ai/src/middlewares/` using `supabaseAdmin.auth.getUser(token)`, typed Hono `Variables` with `userId`, mount it with `app.use("/api/*", ...)` after CORS and before the CopilotKit route; `/health` is outside `/api`.

## Clarifying questions
1. Where is the old `require-owner-id`, and what must be ported from it?
   Default assumption: nothing to copy; the "owner id" idea is a `userId` context variable set by the middleware, which handlers use to scope data to its owner. Correct?
   Answer: _(pending)_

2. How is the token verified?
   Default assumption: `supabase.auth.getUser(token)` with the existing server Supabase client (no new env vars, revoked sessions rejected). Correct?
   Answer: _(pending)_

3. What does a 401 look like?
   Default assumption: JSON `{ "error": "Unauthorized" }` with status 401 and the same body for missing and invalid tokens. Correct?
   Answer: _(pending)_

4. Should CORS preflight stay unauthenticated?
   Default assumption: yes, `OPTIONS` requests pass through (CORS middleware answers them first). Correct?
   Answer: _(pending)_
