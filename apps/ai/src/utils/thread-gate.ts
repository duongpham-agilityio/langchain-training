import type { Pool } from "pg";

// Db
import { claimThread, getThreadOwner, touchThread } from "@/db";

export type ThreadGate = {
  /** Read-only check: true when the thread is the caller's in this project or has no row yet. Runs before anything else. */
  canUse: (userId: string, projectId: string, threadId: string) => Promise<boolean>;
  /** Creates the caller's row (empty title, in the project) when missing; false when it belongs to someone else or to another project. */
  claim: (userId: string, projectId: string, threadId: string) => Promise<boolean>;
  /** Bumps `updated_at` after a used turn. Detached-safe: never rejects. */
  touch: (userId: string, threadId: string) => Promise<void>;
};

/**
 * Owner and project checks for the AG-UI run. The caller is the verified Supabase user the run resolved from the
 * request headers and the project is one the server verified for that user (both passed in), never read from the request body.
 * A thread belongs to one project for life: the same id under another project is refused like a stranger's thread.
 */
export const createThreadGate = (pool: Pool): ThreadGate => ({
  canUse: async (userId, projectId, threadId) => {
    const row = await getThreadOwner(pool, threadId);
    return row === null || (row.ownerId === userId && row.projectId === projectId);
  },
  claim: async (userId, projectId, threadId) => {
    // Two first turns can race: the insert settles it and the loser sees the winner's row here.
    const row = await claimThread(pool, userId, projectId, threadId);
    return row?.ownerId === userId && row.projectId === projectId;
  },
  touch: async (userId, threadId) => {
    try {
      await touchThread(pool, userId, threadId);
    } catch (error) {
      console.error(`[ai] thread touch failed for ${threadId}: ${String(error)}`);
    }
  },
});
