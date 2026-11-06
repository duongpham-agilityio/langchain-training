# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`release-copilot` — React 19 SPA (Vite, TypeScript, Tailwind v4). Chat via CopilotKit, auth via Supabase, server state via TanStack Query, client state via Zustand, routing via React Router v8. Talks to the agent server in [../ai](../ai/CLAUDE.md). Fuller feature notes in [README.md](README.md).

## Commands

```bash
pnpm --filter release-copilot dev            # vite, :5173  (root: pnpm dev:web)
pnpm --filter release-copilot build          # tsc -b && vite build
pnpm --filter release-copilot lint           # eslint .
pnpm --filter release-copilot format         # prettier --write .
pnpm --filter release-copilot format:check
pnpm --filter release-copilot storybook      # :6006
```

No test runner. `pnpm build` is the typecheck (strict tsc incl. `noUnusedLocals/Parameters`).

## Architecture

- `main.tsx` → `routes/router.ts` (`createBrowserRouter`; `AppBootstrap` auth gate → `SignInPage` | `App` with `DashboardPage` / `HistoryPage`). Route paths are constants in `constants/routings.ts`.
- `providers/AppProviders.tsx` mounts `CopilotKit` (v2) with `Authorization: Bearer <supabase access token>` on every agent request; `QueryProvider` wraps the whole tree.
- Auth: `lib/auth/auth-service.ts` is the interface, `supabase-auth-service.ts` the implementation; session lives in `store/auth-store.ts` (`AuthStatus`).
- HTTP to the agent server: `lib/http/http-client.ts` (`HttpClient`) → `services/http-client.ts` (configured instance with auth header + timeout) → one file per call in `services/` (`list-release-history.ts`, `publish-to-slack.ts`, ...). Endpoint paths in `constants/endpoints.ts`. Responses are validated with zod `safeParse` and throw a descriptive error on shape mismatch.
- Chat → UI: agent tool calls (`constants/agent-tools/`, e.g. `renderReleaseNotesPreview`) render the draft card / Live Preview; `store/draft-slice.ts` holds per-thread draft state, `use-agent-context.ts` feeds the current draft back to the agent.
- Thread id lives in the URL (`/?thread=<id>`, `use-thread-url-sync`); History selection also lives in URL search params.

## Code style and structure

Follow existing patterns. Prettier: single quotes, semicolons, trailing commas, 2-space indent, tailwind class sorting.

- Path alias `@/*` → `src/*` (kept in sync in `tsconfig.app.json` and `vite.config.ts`). Use `@/...` for cross-folder imports; **imports include the file extension** (`.ts`/`.tsx`) in most files — match the surrounding file. `verbatimModuleSyntax` is on: use `import type` for types.
- Folder roles: `routes/` pages + router, `layouts/` shell chrome, `components/{common,chat,history,release-notes,platform-selector}/`, `hooks/`, `store/`, `services/`, `lib/` (pure helpers, grouped by domain), `constants/`, `types/`, `providers/`, `styles/`.
- Components: arrow function, default export, file named `PascalCase.tsx`, props typed with a local `interface XProps`. Shared UI kit in `components/common/` (Button, Input, Dialog, Toast, ...); reuse before adding new primitives. Compose classes with `cn()` (`lib/cn.ts`, clsx + tailwind-merge). Tailwind semantic tokens from `styles/theme.css` (`bg-primary`, `text-on-surface`, `text-body-md`, `text-label-sm`), not raw colors.
- Fixed sets of values use **`const enum`** (e.g. `ButtonVariant`, `AuthStatus`, `KnownPlatformId`), then `Record<Enum, string>` maps for variants. `erasableSyntaxOnly` is deliberately off for this.
- Hooks: `hooks/use-kebab-case.ts`, named export `useX`; return a typed `UseXResult` interface. Server data via `useQuery` with exported query-key constants (`constants/query-keys.ts`, or exported next to the hook); keep read and write sides on the same key.
- Zustand: `store/*-store.ts` with `create<State>()(...)`; reusable parts as slices (`createDraftSlice`) typed with `StateCreator`. Select narrow state (`useStore((s) => s.x)`).
- Types: one concept per file in `types/`, kebab-case filename; zod schema + inferred type colocated when it validates a server response.
- Files in `lib/`, `hooks/`, `services/`, `store/`, `types/`, `constants/` are kebab-case; components and layouts are PascalCase.
- Constants (routes, endpoints, tool names, messages, time zones) live in `constants/`; no inline strings for those.
- Comments explain *why* (URL-vs-state decisions, deliberate workarounds), often multi-line above the declaration.
- Errors: wrap risky UI in `ErrorBoundary` (`ErrorBoundaryVariant`); user-facing network text goes through `lib/network-error-message.ts`.
- Storybook is installed but no stories or `.storybook/` config are committed yet.
