import type { SupabaseClient } from "@supabase/supabase-js";
import { createMiddleware } from "hono/factory";

// Constants
import { BEARER_PREFIX } from "@/constants";

export type AuthEnv = { Variables: { userId: string } };

/**
 * Verifies the Supabase access token and exposes the owner as `c.get("userId")`.
 * Missing and invalid tokens get the same 401 body so callers learn nothing about why.
 */
export const createRequireAuth = (supabase: SupabaseClient) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    // Preflight requests never carry Authorization; the CORS middleware answers them.
    if (c.req.method === "OPTIONS") return next();

    const header = c.req.header("Authorization");
    const token = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : "";
    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return c.json({ error: "Unauthorized" }, 401);

    c.set("userId", data.user.id);
    return next();
  });
