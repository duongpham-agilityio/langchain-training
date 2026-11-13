# Plan: the draft on screen reaches the model (GF-10 #117, gap G-06)

## Goal
The server reads `input.context` and gives the model the draft shown in the Live Preview for that turn only, as a delimited read-only block on the latest human message. After reopening an older draft card and asking "make this shorter", the new tool call is built from the reopened draft's `release`, not the newest one.

## Assumptions
- Unconfirmed: the web `ReleaseNotesDraft` has no `release` or `hash` today (`types/release-notes-draft.ts`), only `platform/label/content/version/...`. Assumed: add optional `release` (`ReleaseSchema`) and `hash` to the draft, filled in `parseReleasePreviewResult`; the context value becomes `{ release, format, text, hash }` taken from them (`format` = `platform`, `text` = `content`). The draft key (`toDraftKey`) then also covers them, which is harmless.
- Unconfirmed: `value: null` (no draft yet) means the server adds no block.
- Unconfirmed: the server picks the entry by a shared `description` constant? Assumed no: it takes every context entry whose `value` parses as that shape and uses the last one, and ignores the rest (CopilotKit also sends other entries).
- The block is appended to the latest human message only in the copy passed to `agent.stream`. It is not in the system prompt (static for the prompt cache) and not stored: the checkpointer keeps the message as it was sent, so the appended text must not reach the checkpoint. Assumed approach: keep the id on the augmented message is not enough (the reducer would replace the stored message with the augmented one); instead add the block as a separate, non-persisted input (see Step 3). If no clean way exists with `createAgent` state, fall back to appending to the message and documenting that the stored message then carries the block.
- No test runner exists: tests are tsx scripts (precedent: tickets 116, 121). The `ai-contract` G-06 block is not in this checkout; the repro script plays that role.
- Live check with two drafts needs Supabase/OpenAI env that this shell lacks; recorded as not run if still missing.

## Steps
1. Test: promote `docs/bug-reports/ticket-117-draft-context-reaches-model.repro.ts` into a check that fails today: with an older draft in `input.context`, the human message handed to `agent.stream` contains `OLDER-DRAFT-TEXT` inside a delimited block; with `value: null` or no context it is unchanged; the system prompt is untouched. Prints `true`/`false`.
   Files: `docs/bug-reports/ticket-117-draft-context-reaches-model.repro.ts` - Change: add assertions for the three cases.
2. Code (server, pure helper): add a helper that turns `input.context` into the draft block text (delimiters + "read-only, the draft the user is looking at") and a zod schema for `{ release, format, text, hash }`.
   Files: `apps/ai/src/agui/draft-context.ts`, `apps/ai/src/agui/index.ts` (barrel), `apps/ai/src/constants/` (delimiter / label constants) - Change: new helper, no inline magic strings.
3. Code (server, wiring): in `ReleaseNotesAguiAgent.run`, after `trimToNewMessages`, append the block to the latest human message for this turn only, without it being stored in the checkpoint. Update the `toLangChainMessages` doc comment (context is now read).
   Files: `apps/ai/src/agui/index.ts` - Change: build the augmented latest message for `agentInput`.
4. Code (prompt): in `RELEASE_FLOW` say an edit request applies to the draft in the context, and to call the tool with that draft's `release` copied unchanged except for the requested change.
   Files: `apps/ai/src/constants/prompts.ts` - Change: new short section or bullet; no other wording changed.
5. Code (web): carry `release` and `hash` in the draft, and change `useAgentContext` description and value to `{ release, format, text, hash }` (null when no draft).
   Files: `apps/web/src/types/release-notes-draft.ts`, `apps/web/src/types/release-preview-result.ts`, `apps/web/src/hooks/use-agent-context.ts` - Change: as described; update the description text.
6. Docs: update the `src/agui/` line in `apps/ai/CLAUDE.md` and the `use-agent-context.ts` line in `apps/web/CLAUDE.md`.
   Files: both CLAUDE.md files - Change: one sentence each.

## Done check
- `pnpm lint`, `pnpm build` (typecheck) exit 0; no `pnpm test` exists in this repo, so the Step 1 script is the test and prints `true`.
- The "Done when" behaviour (tool call built from the reopened draft) is covered by the Step 1 script at the model-input level; the live two-draft check is run if env allows, otherwise reported as not run.
- UI touched only through the hook (no component change): no storybook check needed.

## Deviations
- Step 1: the check runs the real `ReleaseNotesAguiAgent` over a real `createAgent` graph (MemorySaver, fake model, a recorder middleware) instead of a fake `agent.stream`. Reason: the block is added inside the graph (see Step 3), so only a real graph shows what the model receives and what the checkpoint holds. It has 8 assertions (older draft wins, block delimited/read-only, system prompt untouched, checkpoint state and metadata free of the draft, next turn clean, `value: null` and no context unchanged). Before the code it failed (middleware module missing).
- Step 2: besides `agui/draft-context.ts` (schema `DraftContextSchema`, `findDraftContext`, `buildDraftBlock`), constants are in the new `apps/ai/src/constants/draft-context.ts` (+ barrel export). `agui/index.ts` re-exports the helper.
- Step 3: the block is NOT appended to the message in `agui/index.ts` (the messages reducer would store the augmented message). Instead `run` puts the parsed draft in `configurable.draftContext` and a new middleware `apps/ai/src/middlewares/draft-context.ts` (`createDraftContextMiddleware`, `wrapModelCall`) appends the block to the latest human message in the model request only. It is registered in `createBaseAgent` (`apps/ai/src/agent/index.ts`, after `memoryMiddleware`), and exported from `middlewares/index.ts`. The value is an object on purpose: LangGraph copies string/number/boolean `configurable` values into checkpoint metadata, objects are not copied. The block is added only when the request ends on the human message (not on later model calls in the same turn after tool results). This is the plan's "state-free" approach, so the fallback (draft in the stored message) was not needed.
- Step 4: added as item 6 of "Once the user names a format" in `RELEASE_FLOW`.
- Step 5: `release-notes-draft.ts` imports `ReleaseSchema`; `release`/`hash` are optional so older stored drafts still parse, and the context value is `null` for a draft without them.
