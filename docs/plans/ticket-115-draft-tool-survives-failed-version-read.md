# Plan: Draft tool survives a failed version read

## Goal
When reading the previous version or computing the next one fails, `renderReleaseNotesPreview` returns `{ ok: false, error: "Could not work out the next version" }` (no SQL text), logs the real error on the server, and the model tells the user instead of retrying.

## Assumptions
- Open question resolved as `ok: false`: no `1.0.0` fallback, no render-without-save (issue Scope).
- Error text is exactly `Could not work out the next version`; extracted to a constant next to the tool description.
- A user-stated version (`input.version`) still skips the read failure only if the read is not needed; to keep it simple, the try block wraps both the read and `nextVersion`, as the issue says.
- `nextVersion` already throws `Invalid previous version: <value>` for non-`MAJOR.MINOR.PATCH`; kept, only caught by the tool.
- Repo has no test runner (`pnpm test` does not exist) and no new dependency is allowed: the "test" step is a scratch script run with `tsx` (not committed) that stubs the pool, per bug report.
- Log format follows existing `console.error("[ai] ...")` lines.

## Steps
1. Test: scratch script (outside the repo, scratchpad) that invokes the tool with a pool rejecting `relation "release_history" does not exist` and with a stored version `v2.1`; today both throw (see bug report).
   Files: none committed - Change: run before and after the fix.
2. Code: wrap `getLatestReleaseVersion` and `nextVersion` in try/catch; on failure `console.error("[ai] next release version failed: ...")` and return the `ok: false` JSON.
   Files: apps/ai/src/tools/release-notes-preview.ts, apps/ai/src/constants/release-notes.ts - Change: catch block, new constant for the message.
3. Code: document the new case in the tool description and in `RELEASE_FLOW` step 3 (tell the user the version could not be determined, do not retry the tool).
   Files: apps/ai/src/constants/release-notes.ts, apps/ai/src/constants/prompts.ts - Change: text only.

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0 (no `pnpm test` script exists)
- Scratch script shows `ok: false` for both failing cases and a normal `ok: true` for a healthy read
