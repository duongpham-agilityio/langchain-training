# Ticket (no id): Replace sidebar "New thread" with "New project"

## What it asks
Feature (UI). The sidebar offers "New thread" as the primary action, but chats now belong to a project and are started from the project's own "+" in `ProjectTree`. Replace the "New thread" button with "New project" so the sidebar no longer suggests a project-less chat.
Done when: not stated. Inferred: the sidebar has no "New thread" control (open and collapsed), "New project" is the primary create action and opens `CreateProjectDialog`, per-project "+" still starts a chat.

## What's ambiguous
- "thay thế nut new chat bằng new project": the open sidebar already has a secondary "New project" row below "New thread". It is unclear whether to promote that row to the primary button or keep it as a row and just delete the old button.
- The collapsed sidebar has a `+` icon button labelled "New thread". Not mentioned in the ticket.
- The History page "Go to Dashboard" button calls `startNewChat`; the ticket does not say whether it should change.

## First step
Edit `apps/web/src/layouts/AppSidebar.tsx`: remove `onNewThread`, make "New project" the primary button, then drop the matching prop in `apps/web/src/App.tsx`.

## Clarifying questions
1. Should "New project" become the primary (filled) button in the open sidebar, replacing the "New thread" button and removing the old secondary row?
   Default assumption: yes, promote it and remove the duplicate row. Correct?
   Answer: _(pending)_
2. Should the collapsed sidebar's `+` button become a "New project" button (folder-plus icon)?
   Default assumption: yes. Correct?
   Answer: _(pending)_
3. Should "Go to Dashboard" on the History page keep its current behaviour (opens a fresh draft chat)?
   Default assumption: yes, unchanged. Correct?
   Answer: _(pending)_
