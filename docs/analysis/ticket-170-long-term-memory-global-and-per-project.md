# Ticket 170: [IP-06] Long-term memory: global and per-project

## What it asks
Split the per-user memory (tone, writingStyle, openingLine) into two levels: global (`["user-memory", userId]`) and project (`["user-memory", userId, projectId]`). The three memory tools take `scope=global|project`; the project id comes from the run context. The user-template middleware loads global always and the project block when in a project; project overrides global on the same field. Type: feature (backend).
Done when: both levels save and load correctly; two projects never share project memory; a project value overrides the global one.

## What's ambiguous
- `getUserPreferences` without a scope: not stated. Decided: omitted scope returns both levels.
- Save/clear without a scope: decided default `global`; the prompt tells the agent to pick `project` when the user says "for this project".
- Project scope with no project in the context: tool answers a plain message and writes nothing.
- "Overrides": decided to show two blocks (global, then project) with a line saying the project value wins on the same field, as the ticket words it, rather than merging in code.

## First step
Add `scope` to the schemas and a `projectId` argument to the three `db/user-memory.ts` functions.

## Clarifying questions
No ambiguity worth asking: the points above are defaults.
