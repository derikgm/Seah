import { getDb } from "../db";
import type { Category, CategoryType } from "../../types";

export async function listCategories(type?: CategoryType): Promise<Category[]> {
  const db = await getDb();
  if (type) {
    return db.select<Category[]>(
      "SELECT * FROM categories WHERE type = $1 OR type = 'both' ORDER BY name",
      [type],
    );
  }
  return db.select<Category[]>("SELECT * FROM categories ORDER BY name");
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDb();
  const rows = await db.select<Category[]>("SELECT * FROM categories WHERE id = $1 LIMIT 1", [
    id,
  ]);
  return rows[0] ?? null;
}

export async function insertCategory(
  name: string,
  icon: string | null,
  color: string | null,
  type: CategoryType,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO categories (name, icon, color, type) VALUES ($1, $2, $3, $4)",
    [name, icon, color, type],
  );
}

export async function updateCategory(
  id: number,
  name: string,
  icon: string | null,
  color: string | null,
  type: CategoryType,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE categories SET name = $1, icon = $2, color = $3, type = $4 WHERE id = $5",
    [name, icon, color, type, id],
  );
}

// Returns the number of transactions using this category, so callers can warn
// before deleting (and offer to reassign).
export async function countTransactionsInCategory(id: number): Promise<number> {
  const db = await getDb();
  const [{ count }] = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM transactions WHERE category_id = $1",
    [id],
  );
  return count;
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM categories WHERE id = $1", [id]);
}

// Move all transactions (and rules) from one category to another. Used when
// deleting a category that still has associations.
export async function reassignCategory(fromId: number, toId: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE transactions SET category_id = $1 WHERE category_id = $2", [
    toId,
    fromId,
  ]);
  await db.execute("UPDATE recurring_rules SET category_id = $1 WHERE category_id = $2", [
    toId,
    fromId,
  ]);
}
