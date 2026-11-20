import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createMiddleware } from "hono/factory";

// Constants
import { BEARER_PREFIX } from "@/constants";

export type AuthEnv = { Variables: { userId: string } };

/** Verifies the `Authorization: Bearer` header with Supabase; null for a missing or invalid token. */
export const resolveUserFromAuthHeader = async (
  supabase: SupabaseClient,
  header: string | null | undefined,
): Promise<User | null> => {
  const token = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : "";
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : data.user;
};

/** Headers of an AG-UI run (set per request by the CopilotKit runtime) -> verified user id, or null. */
export type IdentifyRunUser = (headers: Record<string, string>) => Promise<string | null>;

/** Same token check as `createRequireAuth`, for the agent run, which only sees the forwarded headers. */
export const createIdentifyRunUser =
  (supabase: SupabaseClient): IdentifyRunUser =>
  async (headers) => (await resolveUserFromAuthHeader(supabase, headers.authorization))?.id ?? null;

/**
 * `identifyUser` for `CopilotRuntime`: scopes every thread operation of the runtime to the verified caller.
 * Same token check as `createRequireAuth`; throws when no user resolves, so the request is refused.
 */
export const createIdentifyUser =
  (supabase: SupabaseClient) =>
  async (request: Request): Promise<{ id: string; name: string }> => {
    const user = await resolveUserFromAuthHeader(supabase, request.headers.get("Authorization"));
    if (!user) throw new Error("Unauthorized");
    return { id: user.id, name: user.email ?? user.id };
  };

/**
 * Verifies the Supabase access token and exposes the owner as `c.get("userId")`.
 * Missing and invalid tokens get the same 401 body so callers learn nothing about why.
 */
export const createRequireAuth = (supabase: SupabaseClient) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    // Preflight requests never carry Authorization; the CORS middleware answers them.
    if (c.req.method === "OPTIONS") return next();

    const user = await resolveUserFromAuthHeader(supabase, c.req.header("Authorization"));
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    c.set("userId", user.id);
    return next();
  });
