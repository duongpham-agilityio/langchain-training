# Plan: ticket 18 (M-15)

1. `apps/ai/src/agui/index.ts`: add `ReleaseNotesAguiAgent` (incremental tool-call forwarding + result, history conversion, `threadId` pass-through); `createAguiAgent` returns it.
2. `apps/web/src/hooks/use-release-draft.tsx`: render nothing unless `status === 'complete'`.
3. Update `apps/ai/CLAUDE.md`, `apps/web/CLAUDE.md`.
4. Verify: `pnpm --filter @training/ai typecheck`, `pnpm --filter release-copilot build` and `lint`, fake-model run showing events (START/ARGS/END then RESULT).
