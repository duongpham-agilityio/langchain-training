import type { Pool } from "pg";

import { publishReleaseNotesToSlack } from "./publish-release-notes-to-slack";
import { createRenderReleaseNotesPreview } from "./release-notes-preview";

export * from "./publish-release-notes-to-slack";
export * from "./release-notes-preview";

export const createTools = (pool: Pool) => [
  createRenderReleaseNotesPreview(pool),
  publishReleaseNotesToSlack,
];
