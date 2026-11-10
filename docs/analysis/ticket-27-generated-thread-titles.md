# Analysis: [M-24] Generated thread titles (issue #27)

- Goal: after a thread's first reply, store a short generated title so the sidebar (web polling) shows it; a guard-blocked turn leaves no row.
- Depends on M-22 (checkpointer) and M-23 (thread list), developed in parallel (issues #25/#26). Neither is merged, so this ticket adds the `public.threads` table (`id`, `owner_id`, `title`, timestamps, owner-only select RLS) with `create if not exists`; reconcile with M-23 at merge.
- Producer design from spike C (`docs/spikes/spike-c-threads.md`): fire-and-forget promise after the stream ends; trigger on "no row for this thread" so a failed attempt retries.
- Owner id: the CopilotKit runtime gives the agent only AG-UI input, so the id travels via AsyncLocalStorage from an auth-following middleware.
- Blocked turn: no reply was streamed -> no title, no row. Interrupted (approval pending) turns also skip.
- Out of scope: list route (M-23), checkpointer (M-22).
