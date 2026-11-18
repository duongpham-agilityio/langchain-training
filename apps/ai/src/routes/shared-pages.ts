import { Hono } from "hono";
import type { Pool } from "pg";

// Constants
import {
  SHARED_PAGE_ERROR_MESSAGE,
  SHARED_PAGE_FILE_PATTERN,
  SHARED_PAGES_PATH,
} from "@/constants";

// DB
import { getSharedPageHtml } from "@/db";

const HTML_SUFFIX = ".html";

export const createSharedPagesRoute = (pool: Pool) => {
  const route = new Hono();

  // Public on purpose: a shared link opens without a session. Only a UUID plus `.html` reaches the database.
  route.get(`${SHARED_PAGES_PATH}/:file`, async (c) => {
    const file = c.req.param("file");
    if (!SHARED_PAGE_FILE_PATTERN.test(file)) return c.notFound();

    try {
      const html = await getSharedPageHtml(pool, file.slice(0, -HTML_SUFFIX.length));
      if (html === null) return c.notFound();
      return c.html(html);
    } catch (error) {
      console.error("[shared-pages] read failed", error);
      return c.text(SHARED_PAGE_ERROR_MESSAGE, 500);
    }
  });

  return route;
};
