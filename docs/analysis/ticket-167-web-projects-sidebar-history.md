# Ticket 167: [IP-02c] Web: create project, project tree sidebar, History project name and filter

## What it asks
Feature (web only). Let the user create a project (required when none exists), show the sidebar as a project tree (project > its chats, collapse/expand, new chat inside the open project), send `project_id` with each run, and add project name plus a project filter to History. No rename or archive.
Done when: a user with no project is asked to create one; chats of two projects show under their own project in the sidebar; History items and preview show the project name and the filter narrows the list.

## What's ambiguous
- "The client sends `project_id` and `thread_id` with each run": the server reads the `X-Project-Id` header (`PROJECT_ID_HEADER`); `thread_id` is already sent by CopilotKit.
- "a new chat is created inside the open project": "open" is not defined (selected project vs. project of the open chat).
- "History ... project filter": client-side or via the `projectId` query param the list route already supports.

## First step
Add project service/query + a project store (active project id), and send `X-Project-Id` from `AppProviders`.

## Clarifying questions
1. What is the "open project"?
   Default assumption: the project of the open chat; clicking a project's "+" or a project row also makes it the active one. Correct?
   Answer: _(pending)_
2. Should the History project filter call the server (`?projectId=`)?
   Default assumption: yes, server-side, "All projects" sends no param. Correct?
   Answer: _(pending)_
