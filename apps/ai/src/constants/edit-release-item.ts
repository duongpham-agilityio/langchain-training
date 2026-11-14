export { OPENING_LINE_ITEM_ID } from "@training/contracts";

export const EDIT_RELEASE_ITEM_DESCRIPTION =
  "Replace the description of one item (the opening line or one change) of the release notes draft. The user is asked to accept or reject the old and the new sentence before it runs. Only the description changes; type, breaking and version stay.";

/** Shown on the approval card for `editReleaseItem`. */
export const EDIT_APPROVAL_DESCRIPTION = "Replace this sentence in the release notes?";

export const EDIT_RELEASE_ITEM_MESSAGES = {
  STALE_DRAFT:
    "This edit was made against an older draft, so nothing was changed. Ask again from the draft that is on screen.",
  UNKNOWN_ITEM: (itemId: string) => `There is no item "${itemId}" in this draft, so nothing was changed.`,
  NOT_SIGNED_IN: "You need to be signed in to edit release notes.",
} as const;

/** Appended to the system prompt: how an edit request is handled. */
export const EDIT_RELEASE_ITEM_RULE = `
# Editing one item

When a message starts with "Edit one item of the release notes draft" it carries an item id, the selected text, a draft hash, the release object and the user's request:

1. Call \`editReleaseItem\` once with \`itemId\`, \`hash\` and \`release\` copied unchanged from the message, and \`description\`: the new one-sentence text for that item only. Do not call \`renderReleaseNotesPreview\` for it.
2. The system asks the user to accept or reject; do not ask yourself. If the tool says the draft is outdated or the item is unknown, tell the user in one line and do not retry.
3. After an accepted edit reply with one short line. After a rejection say nothing was changed.
`;
