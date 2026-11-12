# Ticket 77: [F-08] Renderer: HTML email

## What it asks
Feature (pure function in `apps/ai`): take a release object and return an HTML email body plus a subject line. Inline styles only, because email clients ignore stylesheets. All text from the object is HTML-escaped.
Done when: a unit test renders the fixture object; a description containing `<script>` comes out escaped; the HTML opens correctly in a browser.

Depends on: F-01 (#70, test runner, still open) and F-04 (#73, release object schema, closed; its schema is not on the current base `practices`, see question 1).

## What's ambiguous
- "the fixture object": no fixture file or shape is named. Done-when depends on it.
- "the HTML opens correctly in a browser": no check is defined (manual open, screenshot, or automated markup check).
- "All text from the object is HTML-escaped": which fields count (`version`, `date`, opening line, each change description, `refs`) is not listed.
- Subject line: the ticket asks for one but gives no format.
- Module path and export name for the function are not stated.

## First step
Wait for F-04 (schema) to land on `practices`, then write the endpoint test for the `<script>` escape case.

## Clarifying questions
1. The release object schema (F-04, #73) is not on the current base `practices` (3e55e1b): `apps/ai/src/schemas/release.ts` is missing. Should #77 build on the F-04 schema from PR #101 (merge `6eba461`), or wait for it to land on `practices`?
   Default assumption: build on the F-04 schema from `6eba461`, and keep the ticket's module on `apps/ai`. Correct?
   Answer: Chờ F-04 vào `practices` (user, qua AskUserQuestion).
2. Done-when requires a unit test, but F-01 (#70, test runner) is still open and no test script exists in `apps/ai/package.json`. Should #77 wait for F-01, or add the runner itself?
   Default assumption: wait for F-01 to merge first. Correct?
   Answer: Không phụ thuộc F-01, không viết unit test; test trực tiếp endpoint renderer (user, qua AskUserQuestion).
3. What subject line format should the renderer return?
   Default assumption: `Release <version> (<date>)`. Correct?
   Answer: `Release <version> (<date>)` (user).
4. Which fields are HTML-escaped?
   Default assumption: every string from the object (`version`, `date`, opening line, each change description, each `refs` entry). Correct?
   Answer: Mọi chuỗi trong object (user).
5. How should "the HTML opens correctly in a browser" be checked?
   Default assumption: a manual open of the rendered file in a browser, with no automated check beyond the unit test. Correct?
   Answer: Kiểm tra tự động trong test endpoint (user, qua AskUserQuestion).
