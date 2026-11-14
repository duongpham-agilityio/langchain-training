import type { BaseStore } from "@langchain/langgraph";
import type { Pool } from "pg";

import { createPublishReleaseNotesToSlack } from "./publish-release-notes-to-slack";
import { createRenderReleaseNotesPreview } from "./release-notes-preview";
import { createSendReleaseEmail } from "./send-release-email";
import { createUserMemoryTools } from "./user-memory";

export * from "./publish-release-notes-to-slack";
export * from "./release-notes-preview";
export * from "./send-release-email";
export * from "./user-memory";

export const createTools = (pool: Pool, store?: BaseStore) => [
  createRenderReleaseNotesPreview(pool),
  createPublishReleaseNotesToSlack(pool),
  createSendReleaseEmail(pool),
  ...(store ? createUserMemoryTools(store) : []),
];
