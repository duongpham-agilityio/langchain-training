# Plan: Long-term memory: global and per-project

## Goal
Preferences saved globally apply everywhere; preferences saved in a project apply only there and override the global value on the same field.

## Assumptions
- Omitted `scope` on get returns both levels; on save/clear it means `global`.
- Project scope without a project in the run context writes nothing and answers `NO_PROJECT`.
- Two blocks in the system message (global, then project) with an override line.
- Preview proof needs a Supabase session token; if it cannot be done, say so in the PR.

## Steps
1. Test + Code: `db/user-memory.ts` `namespaceFor(userId, projectId?)`; `get/save/clear` take optional `projectId`. Test with `InMemoryStore`: levels separate, two projects separate.
2. Code: `constants/user-memory.ts` scope enum, messages, descriptions, prompt rule, project header/override line; `schemas/user-memory.ts` scope on save/clear/get.
3. Test + Code: `utils/user-template.ts` project block builder; middleware loads both levels.
4. Code: `tools/user-memory.ts` scope handling, project id from `readAgentContext`.
5. Docs: `apps/ai/CLAUDE.md` memory paragraph.
6. Preview proof: set global tone, other tone in project A, check A, B and a new chat; post on #170.

## Done check
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` exit 0
- Verified in the real preview (no new test files)
