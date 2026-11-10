# Plan: [M-24] Generated thread titles

## Steps
1. (Dropped) migration: the table comes from M-23 (#26), same filename.
2. Constants `constants/threads.ts`; db helpers `db/threads.ts` (`hasThread`, `createThread`).
3. `utils/thread-title.ts` (generate + clean), `utils/user-context.ts`, `middlewares/user-context.ts`, `utils/schedule-thread-title.ts`.
4. Wire `ReleaseNotesAguiAgent` (schedule after RUN_FINISHED when a reply was produced) and `index.ts`.
5. Document in `apps/ai/CLAUDE.md`.

## Done check
- `pnpm --filter @training/ai typecheck` and `build` pass.
- Not verified live: needs the `threads` table applied to Supabase and an OpenAI key.
