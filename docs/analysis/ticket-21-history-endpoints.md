# Ticket 21: [M-18] History endpoints: list, search, filter, detail, save

## What it asks
Feature. Add `GET /release-history`, `GET /release-history/:id` and a save endpoint to `apps/ai`, with the request/response shape the web zod schemas validate (`ListReleaseHistoryResponseSchema`, `ReleaseHistoryRecordSchema`, `SaveReleaseHistoryRequestSchema`), behind the M-08 auth middleware.
Done when: the History page lists, searches, filters, opens detail and saves with no web code change beyond env; shape mismatch fails the existing `safeParse`.

## What's ambiguous
- "save endpoint" has no method/path. The web posts to `RELEASE_HISTORY_ROUTE_PATH` (`/release-history`), so it is `POST /release-history`.
- Depends on M-17 (issue #20, `release_history` table). Nothing from M-17 is on `practices` yet (no migration, no branch commits), so column names are unknown.
- The web only sends `GET /release-history` with no query; search and filter run client-side today. Server-side `q`, `status`, `cursor`, `limit` are extra and optional.
- Save request has no entries/counts, so `entries`, `featCount`, `fixCount` cannot be filled by save (M-16 count-only summary is separate).

## First step
Define the response mapping (db row to `ReleaseHistoryRecord`) in one place, so it can be re-aligned with M-17 columns in one edit.

## Clarifying questions
1. What are the `release_history` column names?
   Default assumption: snake_case of the web record (`owner_id`, `version`, `title`, `release_date`, `title_override`, `status`, `github`, `app_store`, `google_play`, `platforms` jsonb, `entries` jsonb, `feat_count`, `fix_count`, `created_at`, `id`). Correct?
   Answer: _(pending)_
2. Which status does a saved record get?
   Default assumption: `archived` (the web action is "Archive"); `published` is for sent releases. Correct?
   Answer: _(pending)_
