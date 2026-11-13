import type { RunAgentInput } from "@ag-ui/client";
import { DraftContextSchema, type DraftContext } from "@training/contracts";

// Constants
import { DRAFT_BLOCK_END, DRAFT_BLOCK_INTRO, DRAFT_BLOCK_START } from "@/constants";

/**
 * Picks the draft out of the AG-UI context entries. CopilotKit sends other entries too, and `null`
 * (no draft yet) is a valid value, so every entry is tried and anything that does not parse is
 * skipped. The last matching entry wins.
 */
export const findDraftContext = (context: RunAgentInput["context"] | undefined): DraftContext | null => {
  for (const entry of [...(context ?? [])].reverse()) {
    try {
      const parsed = DraftContextSchema.safeParse(JSON.parse(entry.value));
      if (parsed.success) return parsed.data;
    } catch {
      // Not JSON: another context entry, not ours.
    }
  }
  return null;
};

/** The delimited, read-only block appended to the latest human message for one model call. */
export const buildDraftBlock = (draft: DraftContext): string =>
  [
    "",
    "",
    DRAFT_BLOCK_START,
    DRAFT_BLOCK_INTRO,
    JSON.stringify({ release: draft.release, format: draft.format, text: draft.text }),
    DRAFT_BLOCK_END,
  ].join("\n");

export { DraftContextSchema, type DraftContext };
