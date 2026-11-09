# M-09 Web sign-in: live verification checklist

Needs a Supabase project with the GitHub provider enabled. Run this by hand; it cannot be done without live credentials.

## Setup

1. In `apps/web/.env` (copy from `apps/web/.env.example`) set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_API_SERVER_URL`
2. In the Supabase dashboard, GitHub provider: enable it and add redirect URL `http://localhost:5173/`.
3. Start both apps: `pnpm dev`.

## Checks

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 1 | Open `http://localhost:5173/` signed out | Redirected to the sign-in page | [ ] |
| 2 | Sign in with a valid email and password | Lands on the Dashboard right away (no multi-second wait) | [ ] |
| 3 | Sign out | Returns to the sign-in page | [ ] |
| 4 | Sign in with GitHub | Returns to the app and lands on the Dashboard | [ ] |
| 5 | Signed in, send a chat message; DevTools > Network, select the `/api/copilotkit` request | Request headers contain `Authorization: Bearer <access token>` | [ ] |
| 6 | Signed out, open the agent route directly | Kept off it, redirected to `/sign-in` | [ ] |
| 7 | `curl -i -X POST <VITE_API_SERVER_URL>/api/copilotkit` without a token | `401` (PENDING M-08, the auth middleware in `apps/ai/src/middlewares/` is not built yet) | [ ] |
