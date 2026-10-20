import { getDb } from "../db";
import type { Currency } from "../../types";

export async function listCurrencies(): Promise<Currency[]> {
  const db = await getDb();
  return db.select<Currency[]>("SELECT * FROM currencies ORDER BY is_base DESC, code");
}

export async function getBaseCurrency(): Promise<Currency | null> {
  const db = await getDb();
  const rows = await db.select<Currency[]>(
    "SELECT * FROM currencies WHERE is_base = 1 LIMIT 1",
  );
  return rows[0] ?? null;
}

export async function insertCurrency(code: string, name: string): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO currencies (code, name, is_base) VALUES ($1, $2, 0)", [
    code,
    name,
  ]);
}

// Refuse to delete a currency that still has transactions referencing it.
export async function deleteCurrency(id: number): Promise<void> {
  const db = await getDb();
  const [{ count }] = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM transactions WHERE currency = (SELECT code FROM currencies WHERE id = $1)",
    [id],
  );
  if (count > 0) {
    throw new Error("No se puede eliminar: tiene transacciones asociadas.");
  }
  await db.execute("DELETE FROM exchange_rates WHERE currency_id = $1", [id]);
  await db.execute("DELETE FROM currencies WHERE id = $1", [id]);
}
