export interface ReleaseNoteItem {
  text: string;
  hash: string | null;
}

export interface ReleaseNoteSection {
  title: string;
  items: ReleaseNoteItem[];
}

const DEFAULT_SECTION_TITLE = 'What’s New';
const HEADING_PATTERN = /^#{1,6}\s+(.+)$/;
const BULLET_PATTERN = /^[-*•]\s+(.+)$/;
// A trailing commit hash, written as inline code or in parentheses:
// "Cache resolved tags `e08f3a7`" / "Cache resolved tags (e08f3a7)".
const TRAILING_HASH_PATTERN = /\s*(?:`([0-9a-f]{7,40})`|\(([0-9a-f]{7,40})\))\s*$/i;

const toItem = (line: string): ReleaseNoteItem => {
  const match = TRAILING_HASH_PATTERN.exec(line);
  if (!match) return { text: line, hash: null };
  return {
    text: line.slice(0, match.index),
    hash: match[1] ?? match[2] ?? null,
  };
};

// Turns archived release-note markdown into the design's flat sections
// (heading + bulleted items + optional commit hash). Returns an empty array
// when the body has no bullets — plain-text store notes — so the caller can
// fall back to rendering the markdown as-is.
export const parseReleaseNoteSections = (
  markdown: string,
): ReleaseNoteSection[] => {
  const sections: ReleaseNoteSection[] = [];

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    const heading = HEADING_PATTERN.exec(line);
    if (heading) {
      sections.push({ title: heading[1], items: [] });
      continue;
    }

    const bullet = BULLET_PATTERN.exec(line);
    if (!bullet) continue;

    if (sections.length === 0) {
      sections.push({ title: DEFAULT_SECTION_TITLE, items: [] });
    }
    sections.at(-1)?.items.push(toItem(bullet[1]));
  }

  return sections.filter((section) => section.items.length > 0);
};
