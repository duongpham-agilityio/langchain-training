/** Long-term per-user memory (F-16): one store record per verified user id. */
export const USER_MEMORY_NAMESPACE_ROOT = "user-memory";
export const USER_MEMORY_KEY = "preferences";

/** The three fixed fields of the record. */
export const USER_MEMORY_FIELDS = ["tone", "writingStyle", "openingLine"] as const;

export const USER_MEMORY_TOOL_NAMES = {
  save: "saveUserPreferences",
  read: "getUserPreferences",
  clear: "clearUserPreferences",
} as const;

export const SAVE_USER_PREFERENCES_DESCRIPTION =
  "Save a LASTING preference of the user for release notes (tone, writing style, opening line). A new value overwrites the old one; fields not given stay as they are. Never call it for a one-off edit.";
export const GET_USER_PREFERENCES_DESCRIPTION =
  "Read the saved preferences (tone, writing style, opening line) of the current user.";
export const CLEAR_USER_PREFERENCES_DESCRIPTION =
  "Forget saved preferences of the current user. Pass `fields` to clear only those; omit it to clear all.";

export const USER_MEMORY_MESSAGES = {
  NO_USER: "No signed-in user, so preferences cannot be stored.",
  NOTHING_SAVED: "Nothing saved yet.",
  CLEARED: "Cleared.",
} as const;

/** Own section so it merges independently of the draft-tool prompt work (F-09). */
export const USER_MEMORY_RULE = `
# User Preferences (long-term memory)

You can remember three lasting preferences per user: tone, writing style and opening line.

- Call \`${USER_MEMORY_TOOL_NAMES.save}\` only when the user states a lasting preference ("from now on, always ...", "I always want ...").
- Never save for a one-off edit ("make this one shorter", "change this line"): just do the edit and save nothing.
- After saving, say in one line that it was saved, naming the preference.
- When asked what you remember, call \`${USER_MEMORY_TOOL_NAMES.read}\` and answer from it only.
- When asked to forget a preference, call \`${USER_MEMORY_TOOL_NAMES.clear}\` with that field (all fields if they ask to forget everything) and confirm in one line.
`;
