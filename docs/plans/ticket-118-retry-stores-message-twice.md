# Plan: A retry does not store the message twice

## Goal
After a failed attempt and a retry, the thread holds the user message once and the model sees it once. `toLangChainMessages` keeps the AG-UI message id on each `HumanMessage`.

## Assumptions
- Only user messages get the AG-UI id; assistant and tool messages are unchanged (issue scope).
- `trimToNewMessages` stays as is.
- The repo has no test runner (CLAUDE.md), so the check is a headless script run with `tsx`, not a committed test. Placeholder env vars are set for `config.ts`.
- A client message without an id (`id` empty) falls back to no id, i.e. today's behaviour.

## Steps
1. Test: a script (kept in the scratchpad, not committed) with a real `createAgent`, `MemorySaver`, and a model that fails once; send the same user message twice, then check the thread. It fails today with two human messages. Also send a longer resent history (user, assistant, user with the same ids) to check earlier turns do not duplicate.
   Files: none in the repo - Change: none
2. Code: pass `id: message.id` to the `HumanMessage` built for a user message, with a comment on why (the reducer dedupes by id). Update the stale doc comment on `trimToNewMessages` that says the bridge drops ids.
   Files: `apps/ai/src/agui/index.ts` - Change: `new HumanMessage({ content: toText(message.content), id: message.id })`; comment update.

## Done check
- `pnpm lint`, `pnpm typecheck`, `pnpm build` all exit 0 (no `pnpm test`: no runner exists)
- the script from step 1 shows one human message after the retry
