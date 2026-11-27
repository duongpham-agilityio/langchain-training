import { tool } from "langchain";

// Constants
import {
  DEFAULT_TIME_ZONE,
  PROJECT_REQUIRED_MESSAGE,
  RELEASE_FORMAT_ALIASES,
  RELEASE_FORMATS,
  RELEASE_NOTES_PREVIEW_DESCRIPTION,
  type ReleaseFormat,
  TOOL_NAMES,
} from "@/constants";

// Schemas
import { ReleaseNotesPreviewInputSchema, ReleaseSchema } from "@/schemas";

// Utils
import {
  formatReleaseDate,
  hashRelease,
  renderRelease,
  renderReleaseEmail,
} from "@/utils";

// Context
import { readAgentContext } from "@/agent/context";

const isReleaseFormat = (format: string): format is ReleaseFormat =>
  (RELEASE_FORMATS as readonly string[]).includes(format);

/** "App Store" and "google_play" become "app-store" and "google-play"; known aliases map to a format. */
const normalizeFormat = (format: string): string => {
  const normalized = format.trim().toLowerCase().replace(/[\s_]+/g, "-");
  return RELEASE_FORMAT_ALIASES[normalized] ?? normalized;
};

/**
 * Code fills in the date and renders only the one format asked for; the
 * hash lets a re-render prove it used the same release object.
 */
export const createRenderReleaseNotesPreview = () =>
  tool(
    async (input, runtime) => {
      // The model copies the format from the user's words ("GitHub", "App Store"), so normalize first.
      const requestedFormat = normalizeFormat(input.format);
      if (!isReleaseFormat(requestedFormat)) {
        return JSON.stringify({
          ok: false,
          error: `Unsupported format "${input.format}".`,
          supportedFormats: RELEASE_FORMATS,
        });
      }
      const format = requestedFormat;

      const context = readAgentContext(runtime);
      // The project comes from the verified run context.
      if (!context?.projectId) return JSON.stringify({ ok: false, error: PROJECT_REQUIRED_MESSAGE });

      const release = ReleaseSchema.parse({
        date: input.date ?? formatReleaseDate(new Date(), context?.timeZone ?? DEFAULT_TIME_ZONE),
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
