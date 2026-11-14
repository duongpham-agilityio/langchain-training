import { CHANGE_TYPES, type Release } from '@training/contracts';
import { OPENING_LINE_ITEM_ID } from '@/constants/preview-edit.ts';

// Maps source line (1-based, as react-markdown reports positions) of the GitHub Markdown render to
// the property id shown on it. The server renders the opening line as its own line and each change
// as one `- ` bullet, grouped by type in CHANGE_TYPES order, so the nth bullet is the nth change
// of that order. A mismatch (an older or edited text) yields no ids rather than wrong ones.
export const mapMarkdownItemIds = (
  markdown: string,
  release: Release,
): Map<number, string> => {
  const ids = new Map<number, string>();
  const ordered = CHANGE_TYPES.flatMap((type) =>
    release.changes.filter((change) => change.type === type),
  );
  const lines = markdown.split('\n');

  const bulletLines = lines.flatMap((line, index) =>
    line.startsWith('- ') ? [index + 1] : [],
  );
  const openingLine = lines.findIndex(
    (line) => line.trim() === release.openingLine.trim(),
  );
  if (bulletLines.length !== ordered.length) return ids;

  if (openingLine >= 0) ids.set(openingLine + 1, OPENING_LINE_ITEM_ID);
  bulletLines.forEach((line, index) => ids.set(line, ordered[index].id));
  return ids;
};
