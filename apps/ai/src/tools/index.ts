import type { BaseStore } from "@langchain/langgraph";
import type { Pool } from "pg";

import { createEditReleaseItem } from "./edit-release-item";
import { createGetChangelog } from "./get-changelog";
import { createPublishReleaseNotesToSlack } from "./publish-release-notes-to-slack";
import { createRenderReleaseNotesPreview } from "./release-notes-preview";
import { createUserMemoryTools } from "./user-memory";

export * from "./edit-release-item";
export * from "./get-changelog";
export * from "./publish-release-notes-to-slack";
export * from "./release-notes-preview";
export * from "./user-memory";

export const createTools = (pool: Pool, store?: BaseStore) => [
  createRenderReleaseNotesPreview(pool),
  createPublishReleaseNotesToSlack(pool),
  createEditReleaseItem(),
  createGetChangelog(pool),
  ...(store ? createUserMemoryTools(store) : []),
];
