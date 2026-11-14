import { OPENING_LINE_ITEM_ID, type Release } from '@training/contracts';

// The current sentence of one item of the release object, or undefined for an unknown id.
export const findItemDescription = (
  release: Release,
  itemId: string,
): string | undefined =>
  itemId === OPENING_LINE_ITEM_ID
    ? release.openingLine
    : release.changes.find((change) => change.id === itemId)?.description;
