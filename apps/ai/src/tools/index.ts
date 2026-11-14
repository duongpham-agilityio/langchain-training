import type { BaseStore } from "@langchain/langgraph";
import type { Pool } from "pg";

import { createGetChangelog } from "./get-changelog";
import { createPublishReleaseNotesToSlack } from "./publish-release-notes-to-slack";
import { createRenderReleaseNotesPreview } from "./release-notes-preview";
import { createUserMemoryTools } from "./user-memory";

export * from "./get-changelog";
export * from "./publish-release-notes-to-slack";
export * from "./release-notes-preview";
export * from "./user-memory";

export const createTools = (pool: Pool, store?: BaseStore) => [
  createRenderReleaseNotesPreview(pool),
  createPublishReleaseNotesToSlack(pool),
  createGetChangelog(pool),
  ...(store ? createUserMemoryTools(store) : []),
];
