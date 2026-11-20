import type { Pool } from "pg";

// Db
import { claimThread, getThreadOwner, touchThread } from "@/db";

export type ThreadGate = {
  /** Read-only owner check: true when the thread is the caller's or has no row yet. Runs before anything else. */
  canUse: (userId: string, threadId: string) => Promise<boolean>;
  /** Creates the caller's row (empty title) when missing; false when the thread belongs to someone else. */
  claim: (userId: string, threadId: string) => Promise<boolean>;
  /** Bumps `updated_at` after a used turn. Detached-safe: never rejects. */
  touch: (userId: string, threadId: string) => Promise<void>;
};

/**
 * Owner checks for the AG-UI run. The caller is the verified Supabase user the run resolved from the
 * request headers (passed in), never read from the request body.
 */
export const createThreadGate = (pool: Pool): ThreadGate => ({
  canUse: async (userId, threadId) => {
    const owner = await getThreadOwner(pool, threadId);
    return owner === null || owner === userId;
  },
  claim: async (userId, threadId) =>
    // Two first turns can race: the insert settles it and the loser sees the winner's id here.
    (await claimThread(pool, userId, threadId)) === userId,
  touch: async (userId, threadId) => {
    try {
      await touchThread(pool, userId, threadId);
    } catch (error) {
      console.error(`[ai] thread touch failed for ${threadId}: ${String(error)}`);
    }
  },
});
