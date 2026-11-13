# Bug: Draft tool throws on a failed version read instead of returning a result
Status: REPRODUCED

## Environment
- Branch / commit: fix/draft-tool-version-read-failure @ c89c3d5
- Versions: Node 22.22.2, pnpm 10.33.0, OS: macOS (Darwin 23.6.0)
- Source: GitHub issue #115 ([GF-02])

## Setup
1. `pnpm install --frozen-lockfile`
2. Scratch script (not committed) calls `createRenderReleaseNotesPreview(pool).invoke(...)` inside `userContext.run({ userId })`, with a stub `pool.query`. Dummy env vars set only to satisfy `config.ts`.
Setup notes: no database or LLM key was used; the failing read is simulated by the stub pool. The full chat flow (model reply) was not run, so the "Please fix your mistakes" text is not observed here.

## Steps to reproduce
1. Create the tool with a pool whose `query` rejects with `relation "release_history" does not exist`.
2. Invoke `renderReleaseNotesPreview` with `format: "slack"`, one feature change.
3. Repeat with a pool returning `rows: [{ version: "v2.1" }]`.

Reproduced: always (2 of 2 cases).

## Expected
Tool returns `{ ok: false, error: "Could not work out the next version" }`; real error is logged on the server; no SQL text reaches the model or chat.

## Actual
- Missing table: tool throws `Error: relation "release_history" does not exist`.
- Stored `v2.1`: tool throws `Error: Invalid previous version: v2.1`.

## Evidence
```
missing table THROWS: Error: relation "release_history" does not exist
stored v2.1 THROWS: Error: Invalid previous version: v2.1
```

## Suspected area
Failing step: 2
Files:
```ts
// apps/ai/src/tools/release-notes-preview.ts:51
const previousVersion = userId ? await getLatestReleaseVersion(pool, userId) : null;
// apps/ai/src/tools/release-notes-preview.ts:54
version: nextVersion(previousVersion, input.changes, input.version),
```
Why: both calls sit outside any try/catch, so the error escapes the tool. `nextVersion` already throws on a non-`MAJOR.MINOR.PATCH` stored value (`apps/ai/src/utils/version-bump.ts`). This is a suspicion, not a proven root cause.

## Questions for the reporter
- Issue's open question (fallback vs `ok: false`): assumed `ok: false`, no `1.0.0` fallback, no render without save (as the issue Scope says).
