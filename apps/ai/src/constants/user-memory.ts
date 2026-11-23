/** Long-term per-user memory (F-16): one store record per verified user id. */
export const USER_MEMORY_NAMESPACE_ROOT = "user-memory";
export const USER_MEMORY_KEY = "preferences";

/** Two levels with the same three fields: global (all projects) and project (the current one). */
export const USER_MEMORY_SCOPES = ["global", "project"] as const;

/** The three fixed fields of the record. */
export const USER_MEMORY_FIELDS = ["tone", "writingStyle", "openingLine"] as const;

export const USER_MEMORY_TOOL_NAMES = {
  save: "saveUserPreferences",
  read: "getUserPreferences",
  clear: "clearUserPreferences",
} as const;

export const SAVE_USER_PREFERENCES_DESCRIPTION =
  "Save a LASTING preference of the user for release notes (tone, writing style, opening line). Use scope 'project' when the user says \"for this project\", otherwise 'global'. A new value overwrites the old one; fields not given stay as they are. Never call it for a one-off edit.";
export const GET_USER_PREFERENCES_DESCRIPTION =
  "Read the saved preferences (tone, writing style, opening line) of the current user. Pass scope to read one level; omit it to read both global and the current project.";
export const CLEAR_USER_PREFERENCES_DESCRIPTION =
  "Forget saved preferences of the current user. Use scope 'project' to forget the current project's preferences, 'global' (default) for the global ones. Pass `fields` to clear only those; omit it to clear all of that level.";

export const USER_MEMORY_MESSAGES = {
  NO_USER: "No signed-in user, so preferences cannot be stored.",
  NO_PROJECT: "No project in this chat, so project preferences cannot be used.",
  NOTHING_SAVED: "Nothing saved yet.",
  CLEARED: "Cleared.",
} as const;

/** Own section so it merges independently of the draft-tool prompt work (F-09). */
export const USER_MEMORY_RULE = `
# User Preferences (long-term memory)

You can remember three lasting preferences: tone, writing style and opening line, at two levels: \`global\` (all projects) and \`project\` (only the current project). A project value overrides the global one on the same field.

- Use scope \`project\` when the user says "for this project" (or similar); otherwise use \`global\`.
- Call \`${USER_MEMORY_TOOL_NAMES.save}\` only when the user states a lasting preference ("from now on, always ...", "I always want ...").
- Never save for a one-off edit ("make this one shorter", "change this line"): just do the edit and save nothing.
- After saving, say in one line that it was saved, naming the preference.
- When asked what you remember, call \`${USER_MEMORY_TOOL_NAMES.read}\` and answer from it only.
- When asked to forget a preference, call \`${USER_MEMORY_TOOL_NAMES.clear}\` with that field (all fields if they ask to forget everything) and confirm in one line.
`;

/** F-17 + IP-06: the saved template is appended to the system prompt after the static part, so the static part (and its provider cache prefix) never changes. */
export const USER_TEMPLATE_HEADER =
  "# User Template\nApply these saved preferences of the current user to every release-notes draft:";
export const USER_PROJECT_TEMPLATE_HEADER =
  "# Project Template\nSaved preferences for the current project. A value here overrides the User Template value on the same field:";
export const USER_TEMPLATE_LABELS = {
  tone: "Tone",
  writingStyle: "Writing style",
  openingLine: "Opening line (start the notes with exactly this line)",
} as const;
