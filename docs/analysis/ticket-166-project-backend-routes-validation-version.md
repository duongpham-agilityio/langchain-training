# Ticket 166: [IP-02b] Project in the backend: routes, validation, per-project version

## What it asks
Make the server project-aware: project routes (create, list), validate that the project (and the thread) belong to the caller, put the project in the run context, store `project_id` on threads and releases, and compute version and History per project. Type: feature (backend).
Done when: "two projects have separate versions and separate History; a `project_id` or `thread_id` of another user or another project is rejected."

## What's ambiguous
- "The client sends `project_id` and `thread_id` with each run": the AG-UI run already carries `threadId`; `project_id` has no transport yet. Decided: header `X-Project-Id` (like `X-Time-Zone`), read from `this.headers` in `ReleaseNotesAguiAgent.run`, so it reaches the run context the same way as the time zone.
- "A `project_id` ... is rejected": no status code stated. Decided: REST routes answer 404 `{ error: "Project not found" }` for a missing or foreign project (no leak of existence); a run answers `RUN_ERROR` (same style as `THREAD_ACCESS_DENIED_MESSAGE`). A run without a project is rejected too (every chat belongs to one project).
- "`next-version` endpoint ... per project": `POST /release-history/next-version` is pure (the caller passes `previousVersion`), so it needs no project; per-project previous version comes from `latest-version?projectId=`.
- "thread list ... returns threads grouped data the web needs": taken as `ThreadSummary` gaining `projectId`, plus an optional `projectId` filter. No grouping in the API (web #167 groups).

## First step
Contracts: project request/response schemas, `PROJECT_ID_HEADER`, `projectId`/`projectName` on the History record, `projectId` on `ThreadSummary` and on the save request.

## Clarifying questions
No ambiguity: scope and decisions (no default project, no rename or archive) are stated by the ticket owner; the points above are defaults taken from them.
