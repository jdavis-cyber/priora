import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// The app runs as the least-privilege role (priora_app: INSERT/SELECT-only on
// audit_log — NFR-01). DATABASE_URL (owner) is for migrations/seeds only; falling
// back to it is permitted in development, refused everywhere else. Fail loud.
const connectionString =
  process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production" && !process.env.APP_DATABASE_URL) {
  throw new Error(
    "APP_DATABASE_URL is required outside development: the app must connect as the least-privilege priora_app role (append-only audit_log, NFR-01).",
  );
}

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type Db = typeof db;
