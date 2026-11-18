# Changelog share page on request (demo)

Status: draft v3 (storage changed to Postgres because the app runs on Vercel), waiting for approval. Size: small change.

## Intent and why

A "what shipped in <period>" question keeps working as it does today: the model answers with Markdown through `showChangelogAnswer` and the web client draws it. New: when the user then asks for something to share ("ok, build an artifact to send to the PM"), the AI builds one self-contained HTML page and replies with a link anyone can open. This is the Claude-artifact behaviour the mentor asked for, as a demo, so it stays small.

## Goals

- Default behaviour is unchanged: Markdown answer in the Live Preview.
- Only when the user explicitly asks for an artifact, page or link to share, the AI builds a single HTML document (HTML, CSS and JS inline, no external resources), stores it, and replies in chat with a link.
- Anyone with the link can open the page without signing in.
- The page is well designed (theme tokens, light and dark, readable at phone width) because the design rules come from a skill the model loads.

## Non-goals

- No change to `showChangelogAnswer`, its web rendering, its schema or its tests.
- No revoking, listing, expiring or editing of shared pages.
- No new guardrail beyond the existing chat-level `createPromptInjectionGuard` (the user's decision). No CSP header, no iframe in the web client.
- Release drafts (`renderReleaseNotesPreview`) are untouched.

## Anti-goals (would make it a failure)

- The model builds a page when the user only asked a question.
- The page names a version, date or change that `getChangelog` did not return. The "only real releases" rule from F-29 applies to the page as well.
- The model chooses the id or any path.

## Constraints

- Deployed on Vercel (`vercel.json`: `ai` is a Hono function, `web` a Vite site, a rewrite list sends only named paths to `ai`, everything else goes to `web`). A Vercel function has a read-only disk apart from `/tmp`, which is per instance and lost, so pages cannot be files. They live in the Supabase Postgres the app already uses.
- Hono server in `apps/ai`; tools follow the 3-piece pattern in `apps/ai/CLAUDE.md` (name in `TOOL_NAMES`, zod schema, `tool(...)` appended to `tools/index.ts`). `TOOL_NAMES` is in `@training/contracts`.
- Schema changes are SQL migrations in `supabase/migrations/`. The migration must be applied to the Supabase project before the feature works (it is not applied by the app at start).
- The page is served from the same public domain as the web app (through a `vercel.json` rewrite), so a page script shares an origin with the web app and could read the user's session in localStorage. This is accepted for the demo because the user chose chat-level guardrails only; it is the main risk to mention to the mentor.

## Approaches considered

1. **Model writes HTML on request, stored in Postgres, served by a public route (picked).** Works on Vercel, uses existing DB and migration pattern, closest to how Claude artifacts work.
2. Files in a folder on disk. Rejected: does not work on Vercel.
3. Vercel Blob or Supabase Storage. Works, but adds a new service, key and dependency for a demo.
4. Model returns JSON, a fixed template renders the page. Safer, but not "the AI builds an artifact".
5. Replace the Markdown answer with the HTML page for every question. Rejected by the user.

## Design

**Table `public.shared_pages`** (new migration `supabase/migrations/20261118000000_create_shared_pages.sql`): `id uuid primary key default gen_random_uuid()`, `owner_id uuid not null references auth.users(id) on delete cascade`, `title text not null`, `html text not null`, `created_at timestamptz not null default now()`. Row level security enabled with no policies: the server reads and writes through its own `pg` pool, the browser never queries the table. Table name in `constants/database.ts`.

**Tool `publishChangelogPage`** (`tools/publish-changelog-page.ts`), added next to `showChangelogAnswer`.
- Input: `{ title, html }`.
- Checks, in order: signed-in user in `userContext` (same message as `showChangelogAnswer`), `html` length at most `CHANGELOG_PAGE_MAX_LENGTH` (200 000 chars), `html` starts with `<!doctype html` (case-insensitive, after trim). Any failure returns `{ ok: false, error }`.
- On success: insert the row for the owner (`db/shared-pages.ts`, `insertSharedPage`), return `{ ok: true, title, url }` where `url = <config.publicBaseUrl>/shared/<id>.html`. A database error returns `{ ok: false, error }` with a fixed message and is logged server-side.
- The web client has no entry for this tool in `rendered-tools.ts`, so nothing renders for it. The link arrives in the model's chat reply.

**Serving.** Route `GET /shared/:file` (`routes/shared-pages.ts`), public and read-only, outside the `/api` guards. It accepts only `<uuid>.html`, anything else is 404 without touching the database. It reads the row (`getSharedPageHtml`) and returns the HTML; no row is 404; a database error is 500 with a fixed body. `vercel.json` gets a rewrite `{ "source": "/shared/(.*)", "destination": { "service": "ai" } }` before the catch-all, otherwise the web service answers the link.

**Config.** `config.publicBaseUrl` (`AI_PUBLIC_URL`, default `http://localhost:4000`). On Vercel set it to the production domain of the project. Add it to `apps/ai/.env.example`.

**Skill `changelog-page`** (`skills/changelog-page.ts`, added to `SKILLS`). Design rules taken from the Claude artifact-design guidance, cut down for this use:
- one self-contained document, inline CSS and JS only, no external scripts, fonts or images;
- colour tokens on `:root` with a dark override (`prefers-color-scheme`), explicit `body` background;
- readable at 400 px width, no horizontal page scroll, content visible at load (nothing hidden behind scripts);
- structure: title, period, one section per release (version and date, then its changes) grouped by type;
- real content only: nothing the tool result did not contain.

**Prompt rule.** Append a section to `CHANGELOG_QA_RULE`:
- Build a page only when the user explicitly asks for an artifact, a page, or a link to share or send. A plain question still ends with `showChangelogAnswer`.
- If the releases of the period are already in this thread's `getChangelog` result, use them; otherwise call `getChangelog` first (same period rules as steps 1 to 5).
- Call `load_skill` for `changelog-page`, build the HTML, call `publishChangelogPage` once, then reply with one short line plus the returned link. Never paste the HTML into the chat.
- If the result has `ok: false`, tell the user in one line, no retry with a guess.

## Tests

- Unit tests with a fake `pool` (`{ query: vi.fn() }`), like other db-facing code: the tool inserts the expected values and builds the URL; the route returns the stored html, 404 for unknown or malformed ids, 500 on a database error.
- Manual check after applying the migration: ask "what shipped last month" (Markdown as before), then "build an artifact to send to the PM", open the returned link in a private window on the Vercel domain.

## Left to the builder

- Exact skill wording and page layout.
- Names of constants and the schema file.
- Whether the migration adds an index (not needed: lookups are by primary key).

## Calls made by the assistant (not yet confirmed)

- Postgres table instead of Vercel Blob (no new service).
- `<uuid>.html` link shape, size cap 200 000 chars, `<!doctype html` check.
- `AI_PUBLIC_URL` env var for the link base.
- The "explicit request" trigger is enforced by the prompt, not by code (same as the other F-29 rules).
