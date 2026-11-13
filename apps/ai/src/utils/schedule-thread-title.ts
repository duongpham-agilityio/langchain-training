import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Pool } from "pg";

// Db
import { hasTitledThread, setThreadTitle } from "@/db";

// Utils
import { generateThreadTitle } from "./thread-title";
import { userContext } from "./user-context";

export type ThreadTitleScheduler = (turn: { threadId: string; userMessage: string }) => void;

/**
 * Builds the hook the AG-UI agent calls after a turn that produced a reply.
 * The work runs detached (never awaited) so RUN_FINISHED is not delayed, and it never
 * rejects: a failing model or database must not fail a run that already succeeded.
 * "No titled row yet" is the trigger rather than "first turn", so a failed attempt retries next turn;
 * the row itself already exists from the run start (`claimThread`), the title only fills it.
 */
export const createThreadTitleScheduler = (
  pool: Pool,
  model: Pick<BaseChatModel, "invoke">,
): ThreadTitleScheduler => {
  return ({ threadId, userMessage }) => {
    const ownerId = userContext.getStore()?.userId;
    if (!ownerId || !userMessage.trim()) return;

    void (async () => {
      if (await hasTitledThread(pool, ownerId, threadId)) return;
      const title = await generateThreadTitle(model, userMessage);
      if (title) await setThreadTitle(pool, ownerId, threadId, title);
    })().catch((error) => {
      console.error(`[ai] thread title failed for ${threadId}: ${String(error)}`);
    });
  };
};
