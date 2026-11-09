# Plan: On-demand skills (parsing, classification, formatting, reporting)

## Goal
Agent sees only a short skill catalog each turn and loads a skill's full rules through a `load_skill` tool when the task needs it.

## Assumptions
- Old rule text unavailable (unconfirmed); skill content is authored from the ticket names and domain.
- Independent of M-12 (unconfirmed): a self-contained middleware appends the catalog to the system message.
- Skills are TS modules (not `.md` files) so `tsup` bundles them into `dist/index.js`.
- No test runner exists; checks are `typecheck`, `build`, and a small tsx smoke script run once (not committed).

## Steps
1. `src/skills/*.ts`: one module per skill (`name`, `description`, `content`); `src/skills/index.ts` exports `SKILLS` registry.
2. `constants/skills.ts` (tool name, catalog header) + `schemas/skills.ts` (zod enum of skill names) + barrels.
3. `tools/load-skill.ts`: `tool(...)` returning skill content, or an error string listing valid names.
4. `middlewares/skills.ts`: `createMiddleware` with `tools: [loadSkill]` and `wrapModelCall` appending the catalog + "load before use" instruction. Export from barrel; wire into `createBaseAgent` (`middleware: [skillsMiddleware]`).
5. Update `apps/ai/CLAUDE.md` (`src/skills/` line, middleware).

## Done check
- `pnpm --filter @training/ai typecheck` and `build` exit 0
- Smoke: a model request for greeting vs git log shows catalog only, and `load_skill` returns content for valid names, error for invalid.
