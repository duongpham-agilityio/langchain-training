# Ticket 33: [M-30] Answer-quality checks (non-blocking)

## What it asks
Feature (cut-line item, first to cut): port the old Mastra scorers as LangSmith evaluators that run after the answer and never block or delay the reply.
Done when: "scores appear in LangSmith for a sample run; a failing score does not change what the user sees."

## What's ambiguous
- "Port the old scorers": the old app (`copilotkit-training/release-copilot`, Mastra) is not in this checkout, and no ticket or doc lists the scorers, so which checks to port is unknown.
- "Depends on: M-16, M-29": M-16 (count-only summary flow) is merged, but M-29 (tracing, issue #32) is still open. `apps/ai` has `langsmith` in `package.json` and `config.langsmith` (key, project) but no tracing or LangSmith client code. Scores need a LangSmith run to attach to.
- "run after the answer": the hook point is not stated. The natural place is `ReleaseNotesAguiAgent.run` in `apps/ai/src/agui/index.ts`, after `RUN_FINISHED` and next to the title scheduler. The ticket does not say whether to score every turn or only turns that produce a draft or count summary.
- "a failing score does not change what the user sees": unclear whether "failing" means a low score or an evaluator that throws. Assumed both, and neither reaches the user.

## First step
Confirm that M-29 tracing exists, or include a minimal version in this ticket. Then add an evaluator module (`apps/ai/src/evaluators/`), plus a fire-and-forget scheduler wired after `RUN_FINISHED` like `scheduleTitle`. It must swallow errors and do nothing when `LANGSMITH_API_KEY` is empty.

## Clarifying questions
1. Which old scorers should be ported? The Mastra source is not in this repo.
   Default assumption: a small set derived from the current prompt and skills: (a) count-only summary correct format, (b) draft is valid for the destination named (structure/length), (c) no invented commits (items trace to the pasted input). Correct?
   Answer: _(pending)_
2. M-29 is still open. May this ticket add the minimal LangSmith wiring (client plus run id capture) it needs, or must it wait for M-29?
   Default assumption: add only the minimal wiring needed to attach feedback to a run, and leave full tracing (tags with thread/user id) to M-29. Correct?
   Answer: _(pending)_
3. Should every completed turn be scored, or only turns with a preview draft or count summary?
   Default assumption: score only completed turns that produced an assistant reply; skip guard-blocked and interrupted turns. Correct?
   Answer: _(pending)_
