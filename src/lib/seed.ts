import { getDb } from "./db";

// Insert the initial reference data exactly once (guarded by an empty-table
// check so it is safe on every startup).
export async function seedIfEmpty(): Promise<void> {
  const db = await getDb();
  const [{ count }] = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM currencies",
  );
  if (count > 0) return;

  // Base currency + one example cash/transfer pair for USD.
  await db.execute(
    "INSERT INTO currencies (code, name, is_base) VALUES ('CUP', 'Peso cubano', 1)",
  );
  await db.execute("INSERT INTO currencies (code, name, is_base) VALUES ('USD', 'Dólar', 0)");
  await db.execute(
    `INSERT INTO exchange_rates (currency_id, rate_cash, rate_transfer, transfer_surcharge_percent)
     VALUES ((SELECT id FROM currencies WHERE code = 'USD'), 100, 130, 30.0)`,
  );

  // Default categories (icon = lucide-react component name, color = hex).
  const categories: Array<[string, string, string, string]> = [
    ["Salud", "HeartPulse", "#EF4444", "expense"],
    ["Comida", "UtensilsCrossed", "#F59E0B", "expense"],
    ["Transporte", "Bus", "#3B82F6", "expense"],
    ["Salario", "Wallet", "#10B981", "income"],
    ["Otros", "Shapes", "#64748B", "both"],
  ];
  for (const [name, icon, color, type] of categories) {
    await db.execute(
      "INSERT INTO categories (name, icon, color, type) VALUES ($1, $2, $3, $4)",
      [name, icon, color, type],
    );
  }
}
