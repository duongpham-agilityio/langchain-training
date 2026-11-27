# Plan: Replace sidebar "New thread" with "New project"

## Goal
The sidebar (open and collapsed) no longer has a "New thread" control. "New project" is the primary create action and opens `CreateProjectDialog`. Chats are still started from the "+" next to each project in `ProjectTree`.

## Assumptions
- Unconfirmed: "New project" becomes the primary (filled) button in the open sidebar and the old secondary row is removed.
- Unconfirmed: the collapsed sidebar's `+` button becomes a "New project" button with the `FolderPlus` icon.
- Unconfirmed: the History page "Go to Dashboard" keeps calling `startNewChat`, so `startNewChat` stays in `use-thread-session.ts`.
- `apps/web` has no test runner (see `apps/web/CLAUDE.md`), so there is no test step; `pnpm build` (`tsc -b`) is the typecheck and catches unused props and imports.
- No `.stories.tsx` files are committed, so the UI check uses the web dev server instead of storybook.

## Steps
1. Code: sidebar markup
   Files: `apps/web/src/layouts/AppSidebar.tsx` - Change: remove the `onNewThread` prop (type and destructuring). In the open sidebar delete the "New thread" `Button` and the secondary "New project" row; render one primary `Button` (same classes as the old one) with the `FolderPlus` icon and label "New project" that calls `onNewProject`. In the collapsed sidebar swap the `+` button for a `FolderPlus` button with `aria-label="New project"` that calls `onNewProject`. Remove the `Plus` import if nothing else uses it.
2. Code: wiring
   Files: `apps/web/src/App.tsx` - Change: drop `onNewThread={startNewChat}` and remove `startNewChat` from the `useThreadSession()` destructuring (keeps `noUnusedLocals` happy). Leave `startNewChatInProject` and `onNewProject` as they are.

## Done check
- `pnpm lint` and `pnpm build` exit 0 (`pnpm test` only covers `apps/ai`, unaffected).
- Open sidebar shows one primary "New project" button and no "New thread"; clicking it opens the create-project dialog and the new project appears in `ProjectTree`.
- Collapsed sidebar shows a folder-plus button labelled "New project" with the same behaviour.
- The "+" beside a project still opens a fresh chat in that project; History "Go to Dashboard" still works.
- UI touched: `preview_start` the web dev server, no console errors, screenshot taken.
