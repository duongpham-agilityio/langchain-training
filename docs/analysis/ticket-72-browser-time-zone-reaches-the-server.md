# Ticket 72: [F-03] Browser time zone reaches the server

## What it asks
Feature. The web sends its IANA time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) with every CopilotKit and REST request. The server validates the name, keeps it next to the user id in `userContext`, falls back to `America/New_York` when it is missing or invalid, and uses it for the default release date instead of the fixed `RELEASE_NOTES_TIME_ZONE`.
Done when: with the browser set to `Asia/Ho_Chi_Minh`, a draft made just after local midnight gets the local date, not the New York date; an invalid zone name falls back without an error.

## What's ambiguous
- "with every CopilotKit and REST request": the ticket names no transport. A request header is the only option that covers both (CopilotKit `headers` prop and `HttpClient.getAuthHeader`).
- "the default release date uses it": the server has two default-date sites (`tools/release-notes-preview.ts`, `db/release-history.ts` save). Both are read as in scope.

## First step
Add the zone to `userContext` and a validating resolver on the server, then send the header from the web.

## Clarifying questions
1. Header name for the zone?
   Default assumption: `X-Time-Zone`. Correct?
   Answer: _(pending)_
2. Should the web's own default-date display also switch to the browser zone?
   Default assumption: No. Server-side date only; web display keeps its constant (UTC-noon parsing breaks for zones beyond +12).
   Answer: _(pending)_
