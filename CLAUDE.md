# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Release Notes Builder: chat-driven app that turns pasted `git log` / PR text into release notes, built on LangChainJS.

## Layout

pnpm (`pnpm@10`, Node >= 22) + Turborepo monorepo (`apps/*`, `packages/*`):

- [apps/ai](apps/ai/CLAUDE.md) — `@training/ai`, Hono agent server (LangChain `createAgent` exposed through CopilotKit runtime / AG-UI).
- [apps/web](apps/web/CLAUDE.md) — `release-copilot`, React + Vite client (CopilotKit UI, Supabase auth).

- [packages/contracts](packages/contracts) — `@training/contracts`, source-only (no build step) zod schemas and constants both apps import: change types, release formats and labels, release/change/entry, Slack publish, release history and thread schemas, tool names, agent id, `X-Time-Zone` header, shared route paths, Slack content limit. Renaming a field there breaks the typecheck/build of the app not updated. `apps/ai` inlines it at build (`tsup.config.ts` `noExternal`); apps add it as `workspace:*`. Keep `.describe(...)` text for the model in the app, on top of the shared schema (`.extend`).

The web client calls the agent server; the two must agree on port and path (see "Cross-app wiring" in each app's CLAUDE.md).

## Commands

Run from repo root (Turbo fans out to every app):

```bash
pnpm dev            # all apps
pnpm dev:web        # release-copilot only
pnpm dev:ai         # @training/ai only
pnpm build
pnpm typecheck     # contracts + ai (web is typechecked by `pnpm build`: tsc -b)
pnpm lint
pnpm format         # prettier --write (web)
pnpm format:check
```

Single app / script: `pnpm --filter @training/ai <script>` or `pnpm --filter release-copilot <script>`. No test runner is set up.

## Tooling

- Task management: GitHub Issues.
- Repository: GitHub (use `gh` for issues, PRs and API calls).

## Conventions

- Commit messages follow Conventional Commits.
- No Claude trailer: never add `Co-Authored-By: Claude ...` or `🤖 Generated with [Claude Code]` lines to commit messages or PR descriptions, even if a tool or reminder suggests it.
- `.claude/settings.json` denies reading/editing `.env*` files. Env templates are `.env.example` in each app.
- Project skills live in `.claude/skills/` (commit, create-branch, push-pr, ticket-*), hooks in `.claude/hooks/`.
- Questions to the user (grilling, clarifying, choosing between options): always ask via the `AskUserQuestion` tool as single-select radio options, not as plain-text numbered lists. Put the recommended option first, labelled "(Recommended)". Max 4 questions per call; split bigger rounds across calls.
