import { EDIT_REQUEST_PROMPT } from '@/constants/preview-edit.ts';

const SELECTED_TEXT_PREFIX = 'Selected text: ';
const REQUEST_MARKER = '\nRequest: ';

// The edit request is an ordinary chat message that carries the release object and the draft hash
// for the agent (see buildEditRequestMessage). Shown as is it would fill the chat with JSON, so the
// user turn is displayed as one short line instead. The stored and sent message is not changed.
// Returns null for any other message.
export const summarizeEditRequest = (content: string): string | null => {
  if (!content.startsWith(EDIT_REQUEST_PROMPT)) return null;

  const requestAt = content.lastIndexOf(REQUEST_MARKER);
  if (requestAt === -1) return null;
  const request = content.slice(requestAt + REQUEST_MARKER.length).trim();

  // JSON.stringify keeps the selected text on one line, so a line scan is enough.
  const selectedLine = content
    .split('\n')
    .find((line) => line.startsWith(SELECTED_TEXT_PREFIX));
  let selected = '';
  if (selectedLine) {
    try {
      const parsed: unknown = JSON.parse(
        selectedLine.slice(SELECTED_TEXT_PREFIX.length),
      );
      if (typeof parsed === 'string') selected = parsed;
    } catch {
      // Fall back to the request alone.
    }
  }

  return selected ? `Edit “${selected}”: ${request}` : `Edit: ${request}`;
};
