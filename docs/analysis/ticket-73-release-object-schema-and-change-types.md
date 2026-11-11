# Ticket 73: [F-04] Release object schema and change types

## What it asks
Feature (schema in `apps/ai`, mirrored type in `apps/web`, two skill text updates). One zod schema for a release (`version`, `date`, opening line, `changes[]`), six change types, `breaking` as a flag instead of a class.
Done when: the schema rejects an unknown type and a change without a description; the skill text lists six types plus the breaking flag; a pasted log with one breaking feature gives a summary where Features counts it and `Breaking: 1` is shown outside the Total; web and server types match.

## What's ambiguous
- "date": the repo already uses `yyyymmdd` (`RELEASE_NOTES_DATE_PATTERN`) for release dates.
- "stable `id`": format not stated.
- "one description sentence": no length rule stated.
- `COUNT_SUMMARY_CLASSES` in `constants/evaluators.ts` still counts `Breaking` as a class in the sum, so the non-blocking `count-summary-format` check would score the new summary wrong.

## First step
Add the schema and the shared change-type constant in `apps/ai`, then mirror in `apps/web`.

## Clarifying questions
1. Is `date` the existing `yyyymmdd` string?
   Default assumption: yes. Correct?
   Answer: _(pending)_
2. Is `id` any non-empty string (e.g. `c1`, derived from input order or the PR/commit ref)?
   Default assumption: yes, only non-empty is enforced; stability is a rule for the producer (#74/#75), not the schema. Correct?
   Answer: _(pending)_
3. Should the count-summary evaluator follow the new summary shape?
   Default assumption: yes, small change so it does not score the new format as a failure. Correct?
   Answer: _(pending)_
