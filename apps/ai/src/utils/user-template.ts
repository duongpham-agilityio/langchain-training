// Constants
import { USER_TEMPLATE_HEADER, USER_TEMPLATE_LABELS } from "@/constants";

// Schemas
import type { UserPreferences } from "@/schemas";

/**
 * Pure prompt part for F-17: turns the saved record into a delimited block, or `null` when there is
 * nothing to apply. Fixed field order, so the same record always yields the same text. Values are
 * collapsed to one line so a stored value cannot start a new prompt section.
 */
export const buildUserTemplateBlock = (preferences: Partial<UserPreferences> | undefined) => {
  const lines = (Object.keys(USER_TEMPLATE_LABELS) as (keyof UserPreferences)[]).flatMap((field) => {
    const value = preferences?.[field]?.replace(/\s+/g, " ").trim();
    return value ? [`- ${USER_TEMPLATE_LABELS[field]}: ${value}`] : [];
  });
  return lines.length ? `${USER_TEMPLATE_HEADER}\n${lines.join("\n")}` : null;
};
