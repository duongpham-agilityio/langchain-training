import { tool } from "langchain";
import type { Pool } from "pg";

// Constants
import {
  CHANGELOG_PAGE_MAX_LENGTH,
  CHANGELOG_PAGE_MESSAGES,
  PUBLISH_CHANGELOG_PAGE_DESCRIPTION,
  TOOL_NAMES,
} from "@/constants";

// Db
import { insertSharedPage } from "@/db";

// Schemas
import { publishChangelogPageSchema } from "@/schemas";

// Utils
import { buildSharedPageUrl } from "@/utils";

// Context
import { readAgentContext } from "@/agent/context";

/**
 * Saves a self-contained HTML page of the changelog and returns its public link. The page lives in
 * Postgres (the function disk is read-only on Vercel); the database picks the id, so the model never
 * chooses a path. Checks run before the insert, and a database error is logged but never shown to the model.
 */
export const createPublishChangelogPage = (pool: Pool, baseUrl: string) =>
  tool(
    async ({ title, html }, runtime) => {
      const userId = readAgentContext(runtime)?.userId;
      if (!userId) {
        return JSON.stringify({ ok: false, error: CHANGELOG_PAGE_MESSAGES.NOT_SIGNED_IN });
      }
      if (html.length > CHANGELOG_PAGE_MAX_LENGTH) {
        return JSON.stringify({ ok: false, error: CHANGELOG_PAGE_MESSAGES.TOO_LONG });
      }
      if (!/^<!doctype html/i.test(html.trimStart())) {
        return JSON.stringify({ ok: false, error: CHANGELOG_PAGE_MESSAGES.NOT_HTML });
      }
      // A stray double quote in the tool-call JSON can cut the string short; a page without its closing tag was cut.
      if (!/<\/html>\s*$/i.test(html)) {
        return JSON.stringify({ ok: false, error: CHANGELOG_PAGE_MESSAGES.INCOMPLETE });
      }
      const cleanTitle = title.trim();
      try {
        const id = await insertSharedPage(pool, { ownerId: userId, title: cleanTitle, html });
        return JSON.stringify({ ok: true, title: cleanTitle, url: buildSharedPageUrl(baseUrl, id) });
      } catch (error) {
        console.error("[ai] publish changelog page failed:", error);
        return JSON.stringify({ ok: false, error: CHANGELOG_PAGE_MESSAGES.SAVE_FAILED });
      }
    },
    {
      name: TOOL_NAMES.publishChangelogPage,
      description: PUBLISH_CHANGELOG_PAGE_DESCRIPTION,
      schema: publishChangelogPageSchema,
    },
  );
