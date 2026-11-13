import type { Pool } from "pg";

// Db
import { claimThread, getThreadOwner, touchThread } from "@/db";

// Utils
import { userContext } from "./user-context";

export type ThreadGate = {
  /** Read-only owner check: true when the thread is the caller's or has no row yet. Runs before anything else. */
  canUse: (threadId: string) => Promise<boolean>;
  /** Creates the caller's row (empty title) when missing; false when the thread belongs to someone else. */
  claim: (threadId: string) => Promise<boolean>;
  /** Bumps `updated_at` after a used turn. Detached-safe: never rejects. */
  touch: (threadId: string) => Promise<void>;
};

/**
 * Owner checks for the AG-UI run. The caller is read from `userContext` (the verified Supabase user),
 * never from the request body. With no verified user every check refuses.
 */
export const createThreadGate = (pool: Pool): ThreadGate => {
  const currentUserId = () => userContext.getStore()?.userId;

  return {
    canUse: async (threadId) => {
      const userId = currentUserId();
      if (!userId) return false;
      const owner = await getThreadOwner(pool, threadId);
      return owner === null || owner === userId;
    },
    claim: async (threadId) => {
      const userId = currentUserId();
      if (!userId) return false;
      // Two first turns can race: the insert settles it and the loser sees the winner's id here.
      return (await claimThread(pool, userId, threadId)) === userId;
    },
    touch: async (threadId) => {
      const userId = currentUserId();
      if (!userId) return;
      try {
        await touchThread(pool, userId, threadId);
      } catch (error) {
        console.error(`[ai] thread touch failed for ${threadId}: ${String(error)}`);
      }
    },
  };
};
