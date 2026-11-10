# Ticket 31: [M-28] PII redaction middleware

## What it asks
Feature. Redact PII (email, phone) in the pasted input before the model sees it, and in the stored messages.
Done when: an email or phone in the pasted text is redacted in what the model receives; non-PII commit text is unchanged.

## What's ambiguous
- "Port `guardrails/pii`": the old Mastra code is not in this repo, so the exact PII types are unknown.
- Phone detection is not built into `langchain`'s `piiMiddleware`; commit text holds many digit runs (SHAs, dates, versions, PR numbers) that must stay unchanged.

## First step
Add `src/middlewares/pii.ts` built on prebuilt `piiMiddleware` (email built-in, phone as custom detector) and register it in `createBaseAgent`.

## Clarifying questions
1. Which PII types besides email and phone should be redacted?
   Default assumption: only email and phone (URLs and IPs are common in commit/PR text and stay). Correct?
   Answer: _(pending)_
