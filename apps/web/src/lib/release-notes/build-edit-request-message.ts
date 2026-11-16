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

// What the chat bubble shows for an edit request message: the selection and the user's request,
// not the internal prompt, hash and release JSON. Any other message returns null (shown as is).
export const summarizeEditRequestMessage = (content: string): string | null => {
  if (!content.startsWith(EDIT_REQUEST_PROMPT)) return null;
  const selected = /^Selected text: (".*")$/m.exec(content)?.[1];
  const request = /^Request: (.*)$/m.exec(content)?.[1];
  if (!request) return null;
  let quote: string;
  try {
    quote = selected ? `“${String(JSON.parse(selected))}”` : '';
  } catch {
    quote = '';
  }
  return quote ? `Edit ${quote}: ${request}` : `Edit: ${request}`;
};
