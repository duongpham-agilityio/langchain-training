import type { Pool } from "pg";
import { tool } from "langchain";
import { CHANGELOG_ANSWER_MAX_LENGTH } from "@training/contracts";

// Constants
import {
  CHANGELOG_ANSWER_MESSAGES,
  SHOW_CHANGELOG_ANSWER_DESCRIPTION,
  TOOL_NAMES,
} from "@/constants/tools";

// Db
import { listOwnerReleaseVersions } from "@/db/changelog";

// Schemas
import { showChangelogAnswerSchema } from "@/schemas/changelog-answer";

// Utils
import { findUnknownVersions } from "@/utils/changelog-answer";
import { userContext } from "@/utils/user-context";

/**
 * F-29: hands a Markdown answer about the changelog to the Live Preview. It reads and saves nothing;
 * the web client draws the result, and it is not a release draft (no release, no hash, no archive).
 */
export const createShowChangelogAnswer = (pool: Pool) =>
  tool(
    async ({ title, markdown }) => {
      const userId = userContext.getStore()?.userId;
      if (!userId) {
        return JSON.stringify({ ok: false, error: CHANGELOG_ANSWER_MESSAGES.NOT_SIGNED_IN });
      }
      if (markdown.length > CHANGELOG_ANSWER_MAX_LENGTH) {
        return JSON.stringify({ ok: false, error: CHANGELOG_ANSWER_MESSAGES.TOO_LONG });
      }
      // Code check behind the prompt rule: an answer may only name versions the user really saved.
      const unknown = findUnknownVersions(markdown, await listOwnerReleaseVersions(pool, userId));
      if (unknown.length > 0) {
        return JSON.stringify({
          ok: false,
          error: `${CHANGELOG_ANSWER_MESSAGES.UNKNOWN_VERSIONS} ${unknown.join(", ")}.`,
        });
      }
      return JSON.stringify({ ok: true, title: title.trim(), markdown });
    },
    {
      name: TOOL_NAMES.showChangelogAnswer,
      description: SHOW_CHANGELOG_ANSWER_DESCRIPTION,
      schema: showChangelogAnswerSchema,
    },
  );
