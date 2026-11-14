import type { BaseStore } from "@langchain/langgraph";
import type { Pool } from "pg";

import { publishReleaseNotesToSlack } from "./publish-release-notes-to-slack";
import { createRenderReleaseNotesPreview } from "./release-notes-preview";
import { createUserMemoryTools } from "./user-memory";

export * from "./publish-release-notes-to-slack";
export * from "./release-notes-preview";
export * from "./user-memory";

export const createTools = (pool: Pool, store?: BaseStore) => [
  createRenderReleaseNotesPreview(pool),
  publishReleaseNotesToSlack,
  ...(store ? createUserMemoryTools(store) : []),
];
