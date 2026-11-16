import type { BaseStore } from "@langchain/langgraph";
import { Hono } from "hono";

// Constants
import { PREFERENCES_PATH, USER_MEMORY_FIELDS } from "@/constants";

// DB
import { clearUserPreferences, getUserPreferences, saveUserPreferences } from "@/db";

// Middlewares
import type { AuthEnv } from "@/middlewares";

// Schemas
import { UpdateUserPreferencesRequestSchema, type UserPreferences } from "@/schemas";

/**
 * `GET`/`PUT /api/preferences` (F-16 template, viewed and edited from the web): covered by the
 * `/api/*` guard and scoped to `c.get("userId")`, the same record the agent tools read and write.
 */
export const createPreferencesRoute = (store: BaseStore) => {
  const routes = new Hono<AuthEnv>();

  routes.get(PREFERENCES_PATH, async (c) => c.json(await getUserPreferences(store, c.get("userId"))));

  // The form sends the whole template, so a blank field means "forget it".
  routes.put(PREFERENCES_PATH, async (c) => {
    const body = UpdateUserPreferencesRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Invalid preferences" }, 400);

    const userId = c.get("userId");
    const filled: Partial<UserPreferences> = {};
    const blank: (keyof UserPreferences)[] = [];
    for (const field of USER_MEMORY_FIELDS) {
      const value = body.data[field];
      if (value) filled[field] = value;
      else blank.push(field);
    }
    if (blank.length === USER_MEMORY_FIELDS.length) {
      await clearUserPreferences(store, userId);
      return c.json({});
    }
    if (blank.length > 0) await clearUserPreferences(store, userId, blank);
    return c.json(await saveUserPreferences(store, userId, filled));
  });

  return routes;
};
