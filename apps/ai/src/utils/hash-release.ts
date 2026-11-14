import { createHash } from "node:crypto";

// Shared schema directly: the `@/schemas` barrel pulls in `config` (env), which unit tests cannot load.
import { type Release, ReleaseSchema } from "@training/contracts";

/**
 * SHA-256 hex of the release object. Parsing first fixes the key order, so the same
 * release always gives the same hash, whatever format it is rendered in.
 */
export const hashRelease = (release: Release): string =>
  createHash("sha256").update(JSON.stringify(ReleaseSchema.parse(release))).digest("hex");
