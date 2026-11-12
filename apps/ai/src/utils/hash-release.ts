import { createHash } from "node:crypto";

// Schemas
import { type Release, ReleaseSchema } from "@/schemas";

/**
 * SHA-256 hex of the release object. Parsing first fixes the key order, so the same
 * release always gives the same hash, whatever format it is rendered in.
 */
export const hashRelease = (release: Release): string =>
  createHash("sha256").update(JSON.stringify(ReleaseSchema.parse(release))).digest("hex");
