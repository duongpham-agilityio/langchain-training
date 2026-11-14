import { tool } from "langchain";
import { CHANGELOG_ANSWER_MAX_LENGTH } from "@training/contracts";

// Constants
import {
  CHANGELOG_ANSWER_MESSAGES,
  SHOW_CHANGELOG_ANSWER_DESCRIPTION,
  TOOL_NAMES,
} from "@/constants/tools";

// Schemas
import { showChangelogAnswerSchema } from "@/schemas/changelog-answer";

// Utils
import { userContext } from "@/utils/user-context";

/**
 * F-29: hands a Markdown answer about the changelog to the Live Preview. It reads and saves nothing;
 * the web client draws the result, and it is not a release draft (no release, no hash, no archive).
 */
export const createShowChangelogAnswer = () =>
  tool(
    async ({ title, markdown }) => {
      if (!userContext.getStore()?.userId) {
        return JSON.stringify({ ok: false, error: CHANGELOG_ANSWER_MESSAGES.NOT_SIGNED_IN });
      }
      if (markdown.length > CHANGELOG_ANSWER_MAX_LENGTH) {
        return JSON.stringify({ ok: false, error: CHANGELOG_ANSWER_MESSAGES.TOO_LONG });
      }
      return JSON.stringify({ ok: true, title: title.trim(), markdown });
    },
    {
      name: TOOL_NAMES.showChangelogAnswer,
      description: SHOW_CHANGELOG_ANSWER_DESCRIPTION,
      schema: showChangelogAnswerSchema,
    },
  );
