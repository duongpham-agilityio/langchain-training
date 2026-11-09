import { tool } from "langchain";

// Constants
import { RELEASE_NOTES_PREVIEW_DESCRIPTION, TOOL_NAMES } from "@/constants";

// Schemas
import { ReleaseNotesDraftSchema } from "@/schemas";

// Utils
import { buildReleaseTitle, formatReleaseDate } from "@/utils";

export const renderReleaseNotesPreview = tool(
  async (draft) => {
    const releaseDate = draft.releaseDate ?? formatReleaseDate();
    const heading = buildReleaseTitle(releaseDate, draft.titleOverride);
    return JSON.stringify({ ...draft, releaseDate, heading });
  },
  {
    name: TOOL_NAMES.renderReleaseNotesPreview,
    description: RELEASE_NOTES_PREVIEW_DESCRIPTION,
    schema: ReleaseNotesDraftSchema,
  },
);
