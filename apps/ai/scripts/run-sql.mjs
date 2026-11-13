// Runs SQL files against the database in DATABASE_URL, or (no args) reports whether the release tables exist.
// Why a script: the Supabase CLI and psql are not required to apply `supabase/migrations/*.sql`.
// Usage (from apps/ai): node --env-file=.env scripts/run-sql.mjs [file.sql ...]
import { readFile } from "node:fs/promises";
import pg from "pg";

const TABLES = ["release_history", "release_sends"];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Run with --env-file=.env from apps/ai.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });
await client.connect();

try {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    const { rows } = await client.query(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name = any($1)`,
      [TABLES],
    );
    const found = new Set(rows.map((row) => row.table_name));
    for (const table of TABLES) console.log(`public.${table}: ${found.has(table) ? "exists" : "missing"}`);
  }
  for (const file of files) {
    // One multi-statement simple query runs as a single implicit transaction: all or nothing.
    await client.query(await readFile(file, "utf8"));
    console.log(`ok: ${file}`);
  }
} catch (error) {
  console.error(`failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
