import type { Release } from '@training/contracts';
import { EDIT_REQUEST_PROMPT } from '@/constants/preview-edit.ts';

export interface EditRequestInput {
  itemId: string;
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
    `Item id: ${itemId}`,
    `Selected text: ${JSON.stringify(selectedText)}`,
    `Draft hash: ${hash}`,
    `Release object: ${JSON.stringify(release)}`,
    `Request: ${request}`,
  ].join('\n');
