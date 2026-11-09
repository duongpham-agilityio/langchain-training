# Intent: Migration (Epic, Phase 1)

Source: [practice plan](../practice-plan/README.md), Phase 1.

## Why

The Release Notes Builder agent was built earlier on Mastra. Rebuild it on LangChainJS (`createAgent` + prebuilt components) as a training exercise that also delivers a working app. Goal is to apply tool calling, structured output, dynamic prompts, middleware and human-in-the-loop, with responses streamed to the client over AG-UI.

No new features in this phase. Behavior stays the same so framework problems are not mixed with feature changes.

## From and to

| | From | To |
| :-- | :-- | :-- |
| AI framework | Mastra | LangChain |
| Chat connection | CopilotKit + Mastra server | CopilotKit + AG-UI + separate agent server |
| Storage | LibSQL / Turso | Supabase Postgres |

## Decisions

- **Old app is out of the loop.** Day 1 is a simple LangChain agent spike, unrelated to Mastra. No parity check against the old app; the "record parity input set" step and the day-3 parity check are dropped.
- **Spike is mandatory.** Three things must work: (1) UI receives streamed data, including the preview card while it is being built; (2) the agent's confirmation request shows in the UI; (3) client-made thread ids and generated thread titles. If stuck past the half-day box, extend the spike and shift the schedule; do not change the requirement.
- **UI unchanged**, only endpoints change. History and Slack APIs keep their current shape. The new server verifies the Supabase session itself.
- **Prompt wording and rules** are copied from the old app as the baseline.
- **Data:** start empty. Old Turso data is not migrated; losing it is accepted.
- **Threads and memory:** LangGraph checkpointer on Supabase Postgres. Recent messages kept, older ones summarized.
- **Guardrails** (middleware): prompt injection is blocked; PII is redacted. Model fallback uses prebuilt middleware.
- **Tracing and answer-quality checks:** LangSmith. Quality checks stay non-blocking.

## Scope (features to migrate)

Sign-in (email/password, GitHub); paste git log/PR, classify, count-only summary; draft for any destination; Live Preview and draft card; automatic title and date; Markdown export; Slack publish (chat and History); Release History (save, search, filter, detail); multiple threads with generated titles; conversation memory; injection and PII guardrails; model fallback; answer-quality checks; error and recovery UI.

## Out of scope

- New features (all of Phase 2).
- Submitting to the App Store or Google Play; publishing directly to GitHub (users copy the Markdown).
- Roles and multi-team workspaces.
- Custom LangGraph graphs: only `createAgent` and prebuilt components.
- Migrating old Turso data.

## Done when

Every feature listed above works end to end on the unchanged UI, with the new agent server. Phase 1 is done at the end of day 3.

## Cut line

If day 3 runs short, cut in this order: answer-quality checks, then tracing. Keep injection guard, PII guard and model fallback.

## Main risks

- Spike overrun (three unknowns) pushes work onto day 3, which is already full (threads and memory, safety, quality).
- CopilotKit / AG-UI / Supabase auth integration surprises.
