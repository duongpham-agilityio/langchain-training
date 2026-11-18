import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import type { Pool } from "pg";

// Configs
import { config } from "@/config";

// Constants
import { BEARER_PREFIX, CRON_SCHEDULED_SENDS_PATH } from "@/constants";

// Services
import { createSchedulerDeps, pollScheduledSends } from "@/services";

const isAuthorized = (header: string | undefined, secret: string): boolean => {
  if (!header?.startsWith(BEARER_PREFIX)) return false;
  const given = Buffer.from(header.slice(BEARER_PREFIX.length));
  const expected = Buffer.from(secret);
  // timingSafeEqual throws on different lengths, so compare lengths first.
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/**
 * Serverless replacement for the `setInterval` poller: Vercel Cron calls this once per tick and one
 * `pollScheduledSends` drains every due job. The claim is atomic, so an overlapping call is safe.
 */
export const createCronRoute = (pool: Pool) => {
  const route = new Hono();

  route.get(CRON_SCHEDULED_SENDS_PATH, async (c) => {
    // Fail closed: without a secret anybody on the internet could trigger sends.
    if (!config.cronSecret) return c.json({ error: "CRON_SECRET is not configured" }, 503);
    if (!isAuthorized(c.req.header("Authorization"), config.cronSecret)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      await pollScheduledSends(pool, createSchedulerDeps(pool));
      return c.json({ ok: true });
    } catch (error) {
      console.error(`[scheduler] cron poll failed: ${String(error)}`);
      return c.json({ error: "Poll failed" }, 500);
    }
  });

  return route;
};
