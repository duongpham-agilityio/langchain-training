// Constants
import { RELEASE_FORMAT_LABELS } from "@/constants";

// Schemas
import type { Release } from "@/schemas";

// Utils
import { renderRelease } from "./render-release";

export type SlackMessageResult =
  | { ok: true; message: { platformId: "slack"; label: string; content: string } }
  | { ok: false; error: string };

/** The one Slack message for a release: its Slack rendering. Over-limit text is an error, never truncated. */
export const buildSlackMessage = (release: Release): SlackMessageResult => {
  const rendered = renderRelease(release, "slack");
  if (!rendered.ok) return rendered;
  return {
    ok: true,
    message: { platformId: "slack", label: RELEASE_FORMAT_LABELS.slack, content: rendered.text },
  };
};
