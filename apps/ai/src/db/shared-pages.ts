import type { Pool } from "pg";

// Constants
import { SHARED_PAGES_TABLE } from "@/constants";

export type NewSharedPage = {
  ownerId: string;
  title: string;
  html: string;
};

/** Inserts one page and returns its id; the database makes the id, so the model never picks a path. */
export const insertSharedPage = async (pool: Pool, page: NewSharedPage): Promise<string> => {
  const { rows } = await pool.query<{ id: string }>(
    `insert into ${SHARED_PAGES_TABLE} (owner_id, title, html)
     values ($1, $2, $3)
     returning id`,
    [page.ownerId, page.title, page.html],
  );
  return rows[0].id;
};

/** The stored HTML of a page, or `null` when no row has that id. */
export const getSharedPageHtml = async (pool: Pool, id: string): Promise<string | null> => {
  const { rows } = await pool.query<{ html: string }>(
    `select html from ${SHARED_PAGES_TABLE} where id = $1`,
    [id],
  );
  return rows[0]?.html ?? null;
};
