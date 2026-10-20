import Database from "@tauri-apps/plugin-sql";
import { MIGRATIONS } from "./migrations";

// Singleton SQLite connection, shared across the whole app.
let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:seah.db");
  }
  return dbPromise;
}

// Apply idempotent schema migrations. Safe to call on every app start.
export async function initDb(): Promise<void> {
  const db = await getDb();
  for (const sql of MIGRATIONS) {
    await db.execute(sql);
  }
}
