import { tool } from "langchain";

// Constants
import {
  DRAFT_CONTEXT_CONFIG_KEY,
  EDIT_RELEASE_ITEM_DESCRIPTION,
  EDIT_RELEASE_ITEM_MESSAGES,
  RELEASE_FORMATS,
  type ReleaseFormat,
  TOOL_NAMES,
} from "@/constants";

// Schemas
import { DraftContextSchema } from "@/agui";
import { EditReleaseItemInputSchema } from "@/schemas";

// Utils
import { applyReleaseEdit, checkEditHash, hashRelease, renderRelease, renderReleaseEmail, userContext } from "@/utils";

const refuse = (error: string) => JSON.stringify({ ok: false, error });

/**
 * Runs only after `humanInTheLoopMiddleware` got an Accept, so a Reject never reaches this body and
 * changes nothing. Returns the new draft in the shape of `renderReleaseNotesPreview`, in the format
 * on screen; nothing is saved (the draft is saved like any other when the user sends it).
 */
export const createEditReleaseItem = () =>
  tool(
    async ({ itemId, description, release, hash }, config) => {
      if (!userContext.getStore()?.userId) return refuse(EDIT_RELEASE_ITEM_MESSAGES.NOT_SIGNED_IN);

      // The draft on screen is the current one; without it only the hash/release pair is checked.
      const draft = DraftContextSchema.safeParse(config?.configurable?.[DRAFT_CONTEXT_CONFIG_KEY]);
      const hashCheck = checkEditHash(hash, release, draft.success ? draft.data.hash : undefined);
      if (!hashCheck.ok) return refuse(hashCheck.error);

      const edited = applyReleaseEdit(release, itemId, description);
      if (!edited.ok) return refuse(edited.error);

      const format: ReleaseFormat =
        draft.success && (RELEASE_FORMATS as readonly string[]).includes(draft.data.format)
          ? (draft.data.format as ReleaseFormat)
          : "markdown";
      const newHash = hashRelease(edited.release);
      const rendered = renderRelease(edited.release, format);
      if (!rendered.ok) return JSON.stringify({ ok: false, error: rendered.error, release: edited.release, hash: newHash });

      return JSON.stringify({
        ok: true,
        release: edited.release,
        format,
        text: rendered.text,
        hash: newHash,
        ...(format === "html-email" ? { subject: renderReleaseEmail(edited.release).subject } : {}),
      });
    },
    {
      name: TOOL_NAMES.editReleaseItem,
      description: EDIT_RELEASE_ITEM_DESCRIPTION,
      schema: EditReleaseItemInputSchema,
    },
  );
