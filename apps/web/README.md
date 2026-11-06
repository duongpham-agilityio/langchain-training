# Release Notes Builder (web)

Chat-driven frontend that turns raw `git log` output or pasted PR titles/descriptions into
release notes for any destination, then lets you copy, export, archive, or post them to
Slack.

This app is the UI only. The agent runs in [`apps/ai`](../ai) with
[LangChain](https://js.langchain.com/); the browser talks to it through
[CopilotKit](https://www.copilotkit.ai/).

## Features

- **Authentication** — Supabase email/password or GitHub OAuth (`/sign-in`). All other
  routes are gated, and the access token is sent with every request to the agent server.
- **Chat** — paste `git log` or PR text; the agent classifies entries
  (feature / fix / chore / breaking) and replies with a count summary.
- **Live Preview** — rendered and raw Markdown tabs, Copy, Export (`.md`), Archive, and a
  resizable split with the chat panel.
- **Publish to Slack** — send the current draft, or any History item, through the
  server's Slack webhook.
- **Release History** — `/history` with search, All / Sent / Not sent filters, and a
  detail view.
- **Multiple threads** — thread list in the sidebar, thread id in the URL
  (`/?thread=<id>`).

Not implemented yet: History "Open in new thread" and "Remove from history", and export
formats other than Markdown.

## How it works

```text
browser (Vite, :5173)                       agent server (apps/ai, :4111)
  Supabase sign-in ─── Bearer token ───▶    auth check
  CopilotKit chat  ──── /copilotkit ───▶    LangChain agent
  services/
    GET  /api/memory/threads          ───▶  thread list
    GET  /release-history[/:id]       ───▶  release history
    POST /release-history             ───▶  archive a draft
    POST /slack/publish               ───▶  Slack webhook
```

The agent server must be running for chat, History, and Slack to work.

## Tech Stack

- React 19, TypeScript, Vite
- React Router v8
- Tailwind CSS v4
- CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`)
- Supabase (`@supabase/supabase-js`) for auth
- Zustand (client state), TanStack Query (server state)
- Storybook 10, ESLint, Prettier
- pnpm workspace + Turborepo (managed from the repo root)

## Project Structure

```text
src/
  routes/       # router, auth gate, sign-in, dashboard, history
  layouts/      # app shell, sidebar, dashboard layout
  components/   # common UI kit, chat, release-notes, history (+ colocated stories)
  providers/    # CopilotKit + React Query providers
  hooks/        # auth, threads, draft, preview, history, toast, ...
  store/        # Zustand stores
  services/     # calls to the agent server
  lib/          # helpers, http client, Supabase client
  constants/    # tool ids, endpoints, routes, messages
  types/
```

## Getting Started

From the repo root:

```bash
pnpm install
cp apps/web/.env.example apps/web/.env   # then fill in the values
pnpm dev
```

Or only this app: `pnpm --filter release-copilot dev`.

## Scripts

Run from the repo root with `pnpm <script>` (Turborepo runs it in every app), or from this
folder.

| Script                                    | What it does                          |
| ----------------------------------------- | ------------------------------------- |
| `pnpm dev`                                | Vite dev server                       |
| `pnpm build`                              | `tsc -b` typecheck + production build |
| `pnpm lint`                               | ESLint                                |
| `pnpm format` / `pnpm format:check`       | Prettier write / check                |
| `pnpm preview`                            | Preview the built app                 |
| `pnpm storybook` / `pnpm build-storybook` | Storybook dev server / static build   |

## Environment Variables

All variables are `VITE_`-prefixed and exposed to the browser. Never put secrets here.

| Variable                        | Description                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `VITE_COPILOTKIT_RUNTIME_URL`   | CopilotKit runtime endpoint, e.g. `http://localhost:4111/copilotkit`            |
| `VITE_API_SERVER_URL`           | Agent server base URL, e.g. `http://localhost:4111`                             |
| `VITE_SUPABASE_URL`             | Supabase project URL                                                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (public by design; Row Level Security is the boundary) |

Model keys, Slack webhook, and database settings belong to the agent server (`apps/ai`),
not this app.
