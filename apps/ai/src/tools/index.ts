import type { BaseStore } from "@langchain/langgraph";
import type { Pool } from "pg";

import { DEFAULT_PUBLIC_URL } from "@/constants";

import { createEditReleaseItem } from "./edit-release-item";
import { createGetChangelog } from "./get-changelog";
import { createPublishChangelogPage } from "./publish-changelog-page";
import { createPublishReleaseNotesToSlack } from "./publish-release-notes-to-slack";
import { createRenderReleaseNotesPreview } from "./release-notes-preview";
import { createSendReleaseEmail } from "./send-release-email";
import { createGetCurrentDateTime, createScheduleReleaseSend } from "./schedule-release-send";
import { createShowChangelogAnswer } from "./show-changelog-answer";
import { createUserMemoryTools } from "./user-memory";

export * from "./edit-release-item";
export * from "./get-changelog";
export * from "./publish-changelog-page";
export * from "./publish-release-notes-to-slack";
export * from "./release-notes-preview";
export * from "./send-release-email";
export * from "./schedule-release-send";
export * from "./show-changelog-answer";
export * from "./user-memory";

export const createTools = (pool: Pool, store?: BaseStore, publicBaseUrl = DEFAULT_PUBLIC_URL) => [
  createRenderReleaseNotesPreview(pool),
  createPublishReleaseNotesToSlack(pool),
  createSendReleaseEmail(pool),
  createGetCurrentDateTime(),
  createScheduleReleaseSend(pool),
  createEditReleaseItem(),
  createGetChangelog(pool),
  createShowChangelogAnswer(),
  createPublishChangelogPage(pool, publicBaseUrl),
  ...(store ? createUserMemoryTools(store) : []),
];
