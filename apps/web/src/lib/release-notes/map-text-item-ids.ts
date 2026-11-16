import type { Release } from '@training/contracts';
import { OPENING_LINE_ITEM_ID } from '@/constants/preview-edit.ts';

// Maps the line (1-based) of a plain-text render (Slack, App Store, Google Play, JSON) to the
// property shown on it. These formats keep a property's text on one line, so a line belongs to the
// item whose text it contains. A line that contains several items' text, or a text shared by two
// items, is left out rather than guessed, so an edit never lands on the wrong property.
export const mapTextItemIds = (
  text: string,
  release: Release,
): Map<number, string> => {
  const items = [
    { id: OPENING_LINE_ITEM_ID, text: release.openingLine.trim() },
    ...release.changes.map((change) => ({
      id: change.id,
      text: change.description.trim(),
    })),
  ];
  const ids = new Map<number, string>();
  text.split('\n').forEach((line, index) => {
    const matches = items.filter((item) => line.includes(item.text));
    if (matches.length === 1) ids.set(index + 1, matches[0].id);
  });
  return ids;
};
