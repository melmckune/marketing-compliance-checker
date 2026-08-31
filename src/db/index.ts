import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema";

// Next.js loads .env.local automatically; standalone scripts (seed.ts,
// drizzle-kit) do not, so load it explicitly here. No-op if already set.
if (!process.env.DATABASE_URL) {
  config({ path: ".env.local" });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
