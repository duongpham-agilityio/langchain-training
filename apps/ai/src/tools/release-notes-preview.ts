import { tool } from "langchain";
import type { Pool } from "pg";

// Constants
import {
  RELEASE_FORMATS,
  RELEASE_NOTES_PREVIEW_DESCRIPTION,
  RELEASE_NOTES_VERSION_ERROR,
  type ReleaseFormat,
  TOOL_NAMES,
} from "@/constants";

// Db
import { getLatestReleaseVersion } from "@/db";

// Schemas
import { ReleaseNotesPreviewInputSchema, ReleaseSchema } from "@/schemas";

// Utils
import {
  formatReleaseDate,
  hashRelease,
  nextVersion,
  renderRelease,
  renderReleaseEmail,
  userContext,
} from "@/utils";

const isReleaseFormat = (format: string): format is ReleaseFormat =>
  (RELEASE_FORMATS as readonly string[]).includes(format);

/**
 * Factory (not a singleton) because the previous version comes from the database.
 * Code computes the version and date and renders only the one format asked for; the
 * hash lets a re-render prove it used the same release object.
 */
export const createRenderReleaseNotesPreview = (pool: Pool) =>
  tool(
    async (input) => {
      // The model copies the format from the user's words ("Slack"), so match ignoring case.
      const requestedFormat = input.format.trim().toLowerCase();
      if (!isReleaseFormat(requestedFormat)) {
        return JSON.stringify({
          ok: false,
          error: `Unsupported format "${input.format}".`,
          supportedFormats: RELEASE_FORMATS,
        });
      }
      const format = requestedFormat;

      const userId = userContext.getStore()?.userId;
      // A failed read or a malformed stored version must not crash the turn or leak SQL text to the model.
      let version: string;
      try {
        const previousVersion = userId ? await getLatestReleaseVersion(pool, userId) : null;
        version = nextVersion(previousVersion, input.changes, input.version);
      } catch (error) {
        console.error("[ai] next release version failed:", error);
        return JSON.stringify({ ok: false, error: RELEASE_NOTES_VERSION_ERROR });
      }

      const release = ReleaseSchema.parse({
        version,
        date: input.date ?? formatReleaseDate(),
        openingLine: input.openingLine,
        changes: input.changes,
      });
      const hash = hashRelease(release);

      const rendered = renderRelease(release, format);
      // Over-limit: the error and the object, never a partial text.
      if (!rendered.ok) {
        return JSON.stringify({ ok: false, error: rendered.error, release, hash });
      }

      return JSON.stringify({
        ok: true,
        release,
        format,
        text: rendered.text,
        hash,
        ...(format === "html-email" ? { subject: renderReleaseEmail(release).subject } : {}),
      });
    },
    {
      name: TOOL_NAMES.renderReleaseNotesPreview,
      description: RELEASE_NOTES_PREVIEW_DESCRIPTION,
      schema: ReleaseNotesPreviewInputSchema,
    },
  );
