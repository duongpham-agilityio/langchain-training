export const changelogPage = {
  name: "changelog-page",
  description:
    "Design rules for a shareable changelog web page. Load before building the HTML for publishChangelogPage.",
  content: `# Changelog page

The page is one HTML document that you pass as \`html\` to \`publishChangelogPage\`. The user shares it with their team and customers. Readers are not signed in, on a phone or a desktop, in a light or a dark theme.

## Document
- Because the HTML travels inside a JSON argument, write every attribute value and every font name in single quotes (\`<meta charset='utf-8'>\`, \`font-family:'Inter',system-ui,sans-serif\`), never double quotes. The document must end with \`</html>\`; a page without it is rejected.
- A single self-contained document that starts with \`<!doctype html>\`, with \`<meta charset='utf-8'>\`, a viewport meta tag and a \`<title>\` that is a short name (two to four words), not a sentence.
- Inline CSS. The only external resource allowed is the Google Fonts stylesheet from the Type section. No other external scripts, stylesheets, images, CDN or \`<link>\` to other files.
- JavaScript only when the user asks for something that needs it (tabs, filters, a copy button). When they ask, build it; never leave the requested feature out. Filter by change type, copy this pattern and adapt it: a row of buttons \`<button type='button' data-filter='all'>All</button><button type='button' data-filter='fix'>Fixes</button>\` (one per type that occurs, using the type of the change from the result as the value), each type group of the Structure section (its heading and its list together) as \`<section class='group' data-type='fix'>\`, and at the end of the body \`<script>document.querySelectorAll('[data-filter]').forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.filter;document.querySelectorAll('[data-type]').forEach(function(i){i.style.display=(f==='all'||i.dataset.type===f)?'':'none';});});});</script>\`. Hide with \`item.style.display='none'\`, not the \`hidden\` attribute, which a \`display\` rule in the CSS overrides. Inline only, and it never reads cookies or storage or calls other sites. Put the \`<script>\` as the last element of \`<body>\`, right before \`</body>\`, never in \`<head>\`, because it runs before the elements it uses exist. The page must still show all content when the script does nothing. Without such a request, use none.
- Content is visible at load. Nothing is hidden behind a script, a tab, an animation or a click to reveal it.

## Type (required)
Every page loads Google Fonts. A page that only uses system fonts is wrong. Pick one pair and copy its \`<link>\` into \`<head>\` exactly:
- Space Grotesk and Inter: \`<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap'>\`
- Sora and Inter: \`<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Sora:wght@500;700&family=Inter:wght@400;500;600&display=swap'>\`
- IBM Plex Sans and IBM Plex Mono: \`<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'>\`

Use the first family of the pair for headings and the version, the second for body text, and keep a fallback stack on both (\`'Space Grotesk', system-ui, sans-serif\`). Set the families as custom properties (\`--font-display\`, \`--font-body\`).
- Use one type scale. Body text at least 16px, comfortable line height, about 65 characters per line. Headings get \`text-wrap: balance\`, uppercase labels a little letter-spacing, versions and dates \`font-variant-numeric: tabular-nums\`.

## Direction
- The layout is yours; there is no fixed template. Make one distinctive choice and keep everything around it quiet. The default choice is the opening block: the period or the newest version set very large in the display face, in the accent colour.
- Light theme background is white or a cool grey. Never cream, beige or any warm off-white. The accent is a blue, teal, green or violet, never terracotta, orange-brown or acid green on black.
- Do not wrap every change in its own bordered, rounded box, and do not make a table with the type in a left column. Use spacing and one divider between releases. Use at most two corner radii on the whole page.
- Also avoid: purple-to-blue gradient hero, emoji as markers, everything centred.
- Do not invent a brand, logo or product name. Use the project name only if the \`getChangelog\` result has it.

## Structure (required)
1. Header: a small uppercase kicker ("Changelog"), the period the releases cover as the large heading (for example "November 2026"), and one summary line with counts taken from the result ("2 releases, 9 changes"). If \`truncated\` was true, say here that the list is partial.
2. One section per release, newest first. Its heading row has the version large in the display font on the left and the date on the right. If the release has breaking changes, add a warning-coloured chip in that row ("1 breaking change").
3. Inside a release, group the changes by type under one heading per type, in this order: Features, Fixes, Performance, Docs, Internal, Other. Each heading is a small uppercase label in the accent colour with the number of changes, followed by a bullet list of that type's changes: a real \`<ul>\` with one \`<li>\` per change and a visible bullet in front of every item. Keep the default disc (style it with \`li::marker{color:var(--accent)}\`); never set \`list-style:none\` unless \`li::before\` draws the bullet. Skip a type that has none in that release. Never repeat the type label on every change, and never list the changes as one flat sequence.
4. Keep the order of the result inside a group. When several changes clearly belong to the same area (for example two that touch Slack), place them next to each other.
5. A breaking change stays in its type group and starts with a warning-coloured "Breaking" tag.
6. Hierarchy from strongest to weakest: period, version, type heading, change text. Give each release generous space above it, separate releases with a rule, and keep at least 8px between list items.

## Colour and theme
- Define colour tokens as custom properties on \`:root\` (background, surface, text, muted text, border, accent, and a warning colour for breaking changes) and use only those tokens.
- Redefine the tokens under \`@media (prefers-color-scheme: dark)\` as a designed palette, not an inversion. Keep contrast sufficient and the accent readable in both themes. Set \`color-scheme\` to match and an explicit background on \`body\`, so the page never falls back to the browser default.
- Tint the greys toward the accent instead of using pure neutral grey.

## Layout
- Readable at 400px width with a side gutter of at least 16px and no horizontal page scroll. Use flex or grid with \`gap\`. Give children that hold text \`min-width: 0\` and wrap long words and code (\`overflow-wrap: anywhere\`).
- Put all content in one column no wider than 760px, so lines are not stretched across a wide screen. Repeated elements (release sections, type groups, list items) share the same edges, padding and order.
- Size the opening block to its content, not to the viewport. Motion is optional, starts from a visible state and respects \`prefers-reduced-motion\`.

## Content
- Show every release from the result with its version and its date, newest first as returned, and every change of it.
- Only content from the \`getChangelog\` result: its versions, dates and changes. Never add a release, version, date or change from memory or from the chat. Headings and intro text may only restate that data. Escape text that goes into the HTML (\`&\`, \`<\`, \`>\`).
- If the result has no releases, build a short page that says nothing was found for that period.
- If \`truncated\` was true, say on the page that the list is partial.

## Before you publish
Check the HTML against this list and fix what fails: Google Fonts \`<link>\` present; both families have a fallback; \`:root\` tokens; a dark \`@media (prefers-color-scheme: dark)\` block; \`color-scheme\` and a \`body\` background; light background is not cream; no \`<script>\` unless asked; every release, version, date and change from the result is on the page; changes are grouped under one heading per type, never repeated per row; every feature the user asked for exists in the HTML (a filter needs its buttons, \`data-filter\` and \`data-type\` attributes and the script).
`,
} as const;
