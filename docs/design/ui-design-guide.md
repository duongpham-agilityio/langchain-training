# UI design guide

Guide for designing pages and screens in this app. It covers how to decide the treatment, the base principles, typography, color, layout, copy, and how to design dashboards and tools. It is not tied to any publishing system.

## 1. Decide the treatment first

- **Documents, reports, plans, demos:** polished but restrained. Clear typographic hierarchy, considered spacing, a deliberate palette. Skip oversized heroes and decorative effects.
- **Landing pages, games, apps or tools people will keep or share:** editorial treatment. Make a clear point of view, open with the most characteristic thing about the subject, and take one aesthetic risk where it serves the work.
- **Unsure:** a well-composed, quiet page is always acceptable. Over-designing is not always acceptable.

## 2. Base principles (every page)

- **Respect the existing system.** Apply the project's tokens, theme or component styles first. Fill gaps with the rules below; never override the existing system. Precedence: the user's explicit words, then the project's system, then your own choices.
- **Ground it in the subject.** Define one concrete subject, its audience, and the page's single job. Pull distinctive choices from the subject's own world: its units, scales, document conventions and terms of art. Include at least one such detail as real content. Use real content, never lorem ipsum.
- **Choose neutrals deliberately.** A pure mid-grey looks unconsidered. A grey with a slight hue leaning toward the accent looks intentional. Pure white or near-black is fine when it suits the subject.
- **Make the page complete at rest.** Everything meant to be read is visible on load, with no scroll needed to reveal it. A section may animate in, but only from a visible resting state, never from `opacity: 0` waiting for an observer.
- **Size heroes to content,** not to `100vh`. A full-viewport opener pushes the rest of the page out of the first screen.
- **Show a working state.** A tool opens with real data where it exists, otherwise clearly labelled examples. An empty shell waiting for input shows nothing useful.
- **Structure is information.** Numbering, eyebrows, dividers and labels must encode something true (a real sequence, a real category). Do not add them as decoration.
- **Avoid generic AI-looking design.** Common defaults to avoid unless the user asks for them: warm cream background with a serif display and terracotta accent; near-black with one neon or acid accent; broadsheet hairline rules with dense columns; purple-to-blue gradient hero on white; emoji as section markers; everything centered; the same large radius on every block; an accent bar on the side of rounded cards. If the user specifies a visual direction, follow it exactly, even if it matches one of these.

## 3. Typography

- **Pair faces deliberately.** A display face with character, used sparingly, plus a complementary body face. Optionally a utility face for captions or data.
- **Default when nothing else is specified:** Inter for text, Space Grotesk for headings.
- **Use a type scale** and stick to it. Do not invent sizes per component.
- **Line length:** keep running text near 65 characters.
- **Headings:** `text-wrap: balance`.
- **Body text:** comfortable line height.
- **Uppercase labels:** a little letter-spacing.
- **Numbers in columns:** `font-variant-numeric: tabular-nums`.
- **Fallbacks:** always declare a real fallback stack for every font.

## 4. Color and themes

- Define every color as a named token (4 to 6 core colors). Build components only from tokens.
- Declare the complete light palette on the root, then define a dark palette. Both must be designed, not inverted mechanically. Keep contrast legible and keep the accent working on both backgrounds.
- Every surface sets its own text color from the same token set. No component should use a literal color that only reads in one theme.
- Set an explicit background on the page body. Never leave it transparent.
- Set the native color scheme (`color-scheme`) to match the active palette, so form controls and scrollbars follow the theme.
- A design that commits to one look may be single-theme, but it must still set every color explicitly.
- **Accent discipline:** put the boldness in one place. Keep the rest quiet. If the accent clashes with the background, shift it toward an analogous hue or desaturate it.
- **Semantic colors** (success, warning, critical) are separate from the accent.

Example token shape:

```css
:root {
  /* light values */
  --bg: #fafaf7;
  --fg: #1c1d1f;
  --muted: #6b6e75;
  --accent: #2f5bd3;
  --surface: #ffffff;
  --border: #e3e3dd;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #111214;
    --fg: #ecedef;
    --muted: #9a9ea6;
    --accent: #7c9cff;
    --surface: #181a1d;
    --border: #2a2c31;
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
  --bg: #111214;
  --fg: #ecedef;
  --muted: #9a9ea6;
  --accent: #7c9cff;
  --surface: #181a1d;
  --border: #2a2c31;
  color-scheme: dark;
}

body {
  background: var(--bg);
  color: var(--fg);
}
```

## 5. Layout and spacing

- Use flex or grid with `gap` for sibling groups. Avoid per-element margins, which collapse or double.
- Keep a side gutter of at least 16px at every width.
- At narrow widths (about 400px), let rows wrap or stack to one column.
- Give images and any `aspect-ratio` box `max-width: 100%`.
- No element should have a `min-width` wider than the screen.
- Only wide tables, code blocks and diagrams may exceed the screen. Put each one in its own `overflow-x: auto` container so the page body never scrolls sideways.
- Give flex or grid children that hold running text, code or tables `min-width: 0`, so long content wraps or scrolls inside them.
- **Repeated elements:** cards and list rows share edges, baselines and inner padding. Put any recurring element in the same position on each one.
- **Let content set height.** Pick a column count the items fill, so nothing stretches over empty space or sits alone in a row.
- **Clipped text is a bug.** Wrap it or scroll it in its own container.
- **Specificity:** watch for classes that cancel each other out (for example, a type selector and a class both setting section padding). Structure the cascade so spacing is not undone by accident.

## 6. Cards and surfaces

- Border, fill, radius and shadow each mark an element as a separate object. Apply them by role, to the one element that needs to stand out.
- Applying the same radius and shadow to every block flattens the hierarchy.
- Use big-number tiles only when those figures are the point of the page.

## 7. Charts

- Place marks, ticks and labels on one scale.
- Every label must name a value the chart actually reaches.
- Color chart text from theme tokens so it reads in both themes.
- Keep marks, labels and edges clear of each other and inside the drawing bounds. In SVG, leave room in the viewBox for the outermost labels, and give every shape an explicit fill.
- Use an area fill, a faint grid and an emphasized endpoint for trend lines.

## 8. Copy

- Treat words as design material, not decoration.
- Write from the user's side: name things by what people recognize, not by how the system is built.
- Use active voice. A control states exactly what happens ("Publish", then a confirmation that says "Published").
- Errors say what went wrong and how to fix it. No apologies, no vagueness.
- Prefer specific to clever. Write plainly, short sentences.
- Avoid em-dash asides, "not X, but Y" framing, colon-then-reveal sentences, scare quotes around invented labels, and filler phrases like "worth noting".
- **Titles** are a name, typically two to four words, specific enough to identify the page among many. Do not append an explanation after a dash or colon. Put the explanation in a subtitle or description line.

## 9. Dashboards and tools

These are scanned and operated, not read top to bottom. The craft is information design.

- Put the summary before the detail.
- Show state in form as well as in numbers: a pill, a chip, a severity stripe. Anything needing attention must be visible at a glance.
- Interactive elements must look interactive: clear hover, focus and pressed states.
- Give every form control a stable `id` and a visible focus state.

## 10. Process

1. Write the question the page must answer and the viewer's job.
2. Settle a short design plan: 4 to 6 color tokens, 2 to 3 font roles, one line describing the layout. Keep it in the code as tokens, not in prose.
3. Check the plan against the subject. If any part looks like the default you would produce for any similar page, revise that part before building.
4. Build from the tokens only.
5. Review at phone width and in both themes. Check for overflow, unreadable text, and colors that ignore the theme.
6. Respect `prefers-reduced-motion` for any animation. Use motion sparingly: one orchestrated moment usually beats many scattered effects.
