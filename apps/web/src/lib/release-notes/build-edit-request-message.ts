import type { Release } from '@training/contracts';
import {
  EDIT_REQUEST_PROMPT,
  UNKNOWN_ITEM_LINE,
} from '@/constants/preview-edit.ts';

export interface EditRequestInput {
  // null when the selection is not tied to one known property.
  itemId: string | null;
  selectedText: string;
  release: Release;
  hash: string;
  request: string;
}

// The ordinary chat message an edit request is sent as: the fixed prompt, then the facts the agent
// needs, one labelled line each. No new endpoint: this goes through the normal agent run.
export const buildEditRequestMessage = ({
  itemId,
  selectedText,
  release,
  hash,
  request,
}: EditRequestInput): string =>
  [
    EDIT_REQUEST_PROMPT,
    itemId ? `Item id: ${itemId}` : UNKNOWN_ITEM_LINE,
    `Selected text: ${JSON.stringify(selectedText)}`,
    `Draft hash: ${hash}`,
    `Release object: ${JSON.stringify(release)}`,
    `Request: ${request}`,
  ].join('\n');
