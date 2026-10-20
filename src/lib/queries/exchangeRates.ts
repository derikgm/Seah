import { getDb } from "../db";
import type { Currency, CurrencyWithRate, ExchangeRate } from "../../types";

// Currencies joined with their exchange rate. Done in JS (not SQL) to avoid
// column-name collisions between the two tables, since the SQL driver returns
// flat rows.
export async function listCurrenciesWithRates(): Promise<CurrencyWithRate[]> {
  const db = await getDb();
  const [currencies, rates] = await Promise.all([
    db.select<Currency[]>("SELECT * FROM currencies ORDER BY is_base DESC, code"),
    db.select<ExchangeRate[]>("SELECT * FROM exchange_rates"),
  ]);
  const rateByCurrency = new Map<number, ExchangeRate>();
  for (const rate of rates) rateByCurrency.set(rate.currency_id, rate);
  return currencies.map((c) => ({ ...c, rate: rateByCurrency.get(c.id) ?? null }));
}

export async function getRateByCurrencyId(currencyId: number): Promise<ExchangeRate | null> {
  const db = await getDb();
  const rows = await db.select<ExchangeRate[]>(
    "SELECT * FROM exchange_rates WHERE currency_id = $1 LIMIT 1",
    [currencyId],
  );
  return rows[0] ?? null;
}

// Look up a rate by currency code (transactions store the code, not the id).
export async function getRateByCode(code: string): Promise<ExchangeRate | null> {
  const db = await getDb();
  const rows = await db.select<ExchangeRate[]>(
    `SELECT r.* FROM exchange_rates r
     JOIN currencies c ON c.id = r.currency_id
     WHERE c.code = $1 LIMIT 1`,
    [code],
  );
  return rows[0] ?? null;
}

// Upsert: one rate row per currency. A null rate_transfer keeps the
// surcharge-derived behavior.
export async function upsertRate(
  currencyId: number,
  rateCash: number,
  rateTransfer: number | null,
  surcharge: number | null,
): Promise<void> {
  const db = await getDb();
  const existing = await getRateByCurrencyId(currencyId);
  if (existing) {
    await db.execute(
      `UPDATE exchange_rates
       SET rate_cash = $1, rate_transfer = $2, transfer_surcharge_percent = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [rateCash, rateTransfer, surcharge, existing.id],
    );
  } else {
    await db.execute(
      `INSERT INTO exchange_rates (currency_id, rate_cash, rate_transfer, transfer_surcharge_percent)
       VALUES ($1, $2, $3, $4)`,
      [currencyId, rateCash, rateTransfer, surcharge],
    );
  }
}
