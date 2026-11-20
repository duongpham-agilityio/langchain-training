# LangChainJS Improvement Plan

Nov 20, 2026

# OVERVIEW

Follows the Practice Plan (Phase 1 and Phase 2 are done and demoed). Six improvements from the internal review of the demo. Built with Claude Code. Rough estimates; a detailed estimate comes after approval.

# INTERNAL REVIEW FEEDBACK

| # | Feedback |
| :---- | :---- |
| 1 | One request takes too long: 18-25 s for a single turn |
| 2 | The app should create one chat group per project, to manage releases and versions properly. Today a user builds several projects, so versions and long/short-term memory get mixed |
| 3 | `ag-ui/langchain` does not return tool call results, so we wrote custom logic that re-implements the library's handling. Consider fixing the library with `patch-package` |
| 4 | Consider CopilotKit Intelligence instead of reading the checkpoint and relaying messages by hand |
| 5 | The user context design is not right: the backend uses `AsyncLocalStorage` (`apps/ai/src/utils/user-context.ts`) |
| 6 | Update the long-term memory schema |

Each feedback has the same number in the table below.

# IMPROVEMENTS

Time in working days, including coding agent work and human review.

| # | Improvement | What we do | Done when | Time |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Reduce turn time | Measure each stage, fix the biggest cause, measure again | Before/after numbers drop; guard, PII, approval tests pass | ¾ day |
| 2 | Manage by project | One chat group per project; version and History per project; Changelog keeps all releases, add a project filter; default project for old data | Two projects have separate versions and History; Changelog filters by project | 2 days |
| 3 | Tool results in `@ag-ui/langchain` | Consider `patch-package` and removing custom logic if the patch is small; otherwise keep it | Decision with reasons | ¼ day |
| 4 | CopilotKit Intelligence | Check if it can replace our checkpoint replay; decision only, no build | Decision with reasons | ¼ day |
| 5 | User context | Replace `AsyncLocalStorage` with agent context (user, time zone, project) | Tools get the user from context; two-user isolation tests pass | ½ day |
| 6 | Long-term memory schema | Support global (per user) and per-project memory | Both levels save and load correctly, no mixing between projects | ¼ day |
| | **Total** | | | **4 days** |

To fit 4 days: two parallel agent sessions for item 2 (backend and web), no buffer.

# NOT IN THIS PLAN

* Building the Intelligence change (only if the decision says yes).

# SCHEDULE: 4 DAYS

| Day | Work | Day ends with |
| :---- | :---- | :---- |
| 1 | 1 measure and fix; 4; 3 | Timing numbers; decisions for 3 and 4 |
| 2 | 5 User context; 2 start (project table, migration) | Tools get the user from context; migration runs |
| 3 | 2 backend and web in parallel | Version and History per project; switcher works |
| 4 | 2 finish; 6; 1 re-measure | All "Done when" items pass |

If late, cut in this order: 6, 3, then rename and archive projects.
