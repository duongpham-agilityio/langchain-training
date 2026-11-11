# Plan: Release object schema and change types

## Goal
Server exports a zod `ReleaseSchema` (with `ChangeSchema`, `ChangeType`), web mirrors it, and the two skills describe six types plus a `breaking` flag with a separate `Breaking: N` line.

## Assumptions
- `date` is `yyyymmdd` (unconfirmed).
- `id` is any non-empty string; description must be non-blank and a single line (unconfirmed).
- The count-summary evaluator is updated to the new shape (unconfirmed).
- `platform-formatting` (draft sections) is out of scope; follow-up.

## Steps
1. Test: no test runner exists; verify with a throwaway script against the schema (unknown type rejected, missing description rejected, valid release accepted).
   Files: none committed.
2. Code: `constants/release-changes.ts` (`CHANGE_TYPES`), `schemas/release.ts` (`ChangeTypeSchema`, `ChangeSchema`, `ReleaseSchema` + types), barrel exports.
   Files: apps/ai/src/constants, apps/ai/src/schemas
3. Code: web mirror `types/release-change.ts`, `types/release-object.ts`.
   Files: apps/web/src/types
4. Code: skills `classification-rules` (six types, breaking flag) and `release-reporting` (six lines sum to Total, `Breaking: N` outside, only when N > 0); evaluator constants and check follow.
   Files: apps/ai/src/skills, apps/ai/src/constants/evaluators.ts, apps/ai/src/evaluators/count-summary-format.ts

## Done check
- `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0
- Script check of the three schema cases passes
