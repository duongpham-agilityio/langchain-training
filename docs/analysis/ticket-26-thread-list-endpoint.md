# Ticket 26: [M-23] Thread list endpoint

## What it asks
Feature. `GET /api/memory/threads` returns the current user's threads as `{ threads: [{ id, title, resourceId, createdAt, updatedAt }] }` (web `ListThreadsResponseSchema`), scoped by user id.
Done when: the sidebar lists past threads; a second user's list is separate.

## What's ambiguous
- The checkpointer (M-22, issue #25) stores messages by `thread_id` with no owner, so there is nothing to list per user. Nothing from M-22 is on this branch.
- Who writes the thread rows and titles is M-24 (issue #27).
- "grouped by date" is a web concern (sidebar); the endpoint only returns `createdAt`/`updatedAt`.

## Decision
Add a `public.threads` table (`id text` = client thread id, `owner_id`, `title`, timestamps, RLS) as the ownership record. This ticket only reads it; M-24 upserts rows (`owner_id` from the session, `title` when generated). `resourceId` = `owner_id`. Order: `updated_at desc`.
