import { getDb } from "../db";
import type { PaymentMethod, Transaction, TxType } from "../../types";

export interface TransactionFilters {
  month?: string; // 'YYYY-MM'
  type?: TxType;
  categoryId?: number;
  method?: PaymentMethod;
  search?: string; // matches description
}

// Build a WHERE clause + params from the provided filters.
function buildWhere(filters: TransactionFilters): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.month) {
    params.push(`${filters.month}%`);
    conditions.push(`date LIKE $${params.length}`);
  }
  if (filters.type) {
    params.push(filters.type);
    conditions.push(`type = $${params.length}`);
  }
  if (filters.categoryId != null) {
    params.push(filters.categoryId);
    conditions.push(`category_id = $${params.length}`);
  }
  if (filters.method) {
    params.push(filters.method);
    conditions.push(`payment_method = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`description LIKE $${params.length}`);
  }
  const clause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, params };
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<
  Transaction[]
> {
  const db = await getDb();
  const { clause, params } = buildWhere(filters);
  return db.select<Transaction[]>(
    `SELECT * FROM transactions ${clause} ORDER BY date DESC, id DESC`,
    params,
  );
}

export async function getRecentTransactions(limit: number): Promise<Transaction[]> {
  const db = await getDb();
  return db.select<Transaction[]>(
    "SELECT * FROM transactions ORDER BY date DESC, id DESC LIMIT $1",
    [limit],
  );
}

export interface NewTransaction {
  type: TxType;
  amount: number;
  currency: string;
  amount_cup: number;
  category_id: number;
  description: string | null;
  payment_method: PaymentMethod;
  exchange_rate_used: number | null;
  date: string; // ISO 8601
  is_recurring_generated?: boolean;
}

export async function insertTransaction(tx: NewTransaction): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO transactions
       (type, amount, currency, amount_cup, category_id, description,
        payment_method, exchange_rate_used, date, is_recurring_generated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      tx.type,
      tx.amount,
      tx.currency,
      tx.amount_cup,
      tx.category_id,
      tx.description,
      tx.payment_method,
      tx.exchange_rate_used,
      tx.date,
      tx.is_recurring_generated ? 1 : 0,
    ],
  );
}

export async function updateTransaction(
  id: number,
  tx: Omit<NewTransaction, "is_recurring_generated">,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE transactions
     SET type = $1, amount = $2, currency = $3, amount_cup = $4, category_id = $5,
         description = $6, payment_method = $7, exchange_rate_used = $8, date = $9
     WHERE id = $10`,
    [
      tx.type,
      tx.amount,
      tx.currency,
      tx.amount_cup,
      tx.category_id,
      tx.description,
      tx.payment_method,
      tx.exchange_rate_used,
      tx.date,
      id,
    ],
  );
}

// Override only the stored CUP amount (manual rate override per transaction).
export async function updateTransactionAmountCup(id: number, amountCup: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE transactions SET amount_cup = $1 WHERE id = $2", [amountCup, id]);
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM transactions WHERE id = $1", [id]);
}
