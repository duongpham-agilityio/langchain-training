import { z } from "zod";
import type { Pool } from "pg";

// Db
import { findOwnedProject } from "@/db";

/** True when the project exists and belongs to the user. */
export type ProjectGate = (userId: string, projectId: string) => Promise<boolean>;

/**
 * Owner check of the project a run claims (`X-Project-Id`). Like the thread gate, "not yours" and "does not
 * exist" are the same answer. A malformed id is refused before Postgres sees it (the uuid cast would throw).
 */
export const createProjectGate =
  (pool: Pool): ProjectGate =>
  async (userId, projectId) =>
    z.uuid().safeParse(projectId).success && (await findOwnedProject(pool, userId, projectId)) !== null;
