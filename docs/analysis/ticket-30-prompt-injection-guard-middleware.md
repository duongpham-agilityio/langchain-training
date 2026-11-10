# Ticket 30: [M-27] Prompt-injection guard middleware

## What it asks
Feature. Middleware that blocks a turn before the model runs when the latest user message looks like a prompt injection, and answers with a clear refusal.
Done when: known injection samples are blocked; a normal git log containing words like "ignore" in a commit message still passes.

## What's ambiguous
- "Port the old rule set (`guardrails/prompt-injection`)": the old Mastra app is not in this repo or on this machine, so the exact rules cannot be copied.
- "clear refusal": no wording given.

## First step
Add a rule list (constants) and a `beforeAgent` middleware that jumps to the end with a refusal message.

## Clarifying questions
1. Can someone paste the old `guardrails/prompt-injection` rules?
   Default assumption: use a standard rule set (instruction override, system-prompt extraction, role/persona hijack, delimiter/fake-system markers), each phrase-anchored so a lone "ignore" does not match. Correct?
   Answer: _(pending)_
2. Is a fixed English refusal text acceptable?
   Default assumption: yes, one constant message. Correct?
   Answer: _(pending)_
