// Property id of the opening line in the release object; changes use their own `change.id`.
export const OPENING_LINE_ITEM_ID = 'openingLine';

// Attribute the Live Preview puts on every rendered item so a text selection can be traced back
// to its property in the release object.
export const PREVIEW_ITEM_ATTRIBUTE = 'data-item-id';

// Fixed prompt of an edit request. The model gets the item id, the selected text, the release
// object and the draft hash it was built from, so it can edit that one property of that draft.
export const EDIT_REQUEST_PROMPT = [
  'Edit one item of the release notes draft shown in the Live Preview.',
  'Change only the property named by the item id and keep every other property as it is.',
  'Use the release object below as the base and check the draft hash matches the draft on screen.',
].join(' ');
