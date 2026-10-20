import { getDb } from "../db";
import type { Frequency, PaymentMethod, RecurringRule, TxType } from "../../types";

export async function listRecurringRules(includeInactive = true): Promise<RecurringRule[]> {
  const db = await getDb();
  if (includeInactive) {
    return db.select<RecurringRule[]>("SELECT * FROM recurring_rules ORDER BY day_of_month");
  }
  return db.select<RecurringRule[]>(
    "SELECT * FROM recurring_rules WHERE is_active = 1 ORDER BY day_of_month",
  );
}

export interface NewRecurringRule {
  type: TxType;
  amount: number;
  currency: string;
  category_id: number;
  description: string | null;
  payment_method: PaymentMethod;
  day_of_month: number;
  frequency: Frequency;
}

export async function insertRecurringRule(rule: NewRecurringRule): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO recurring_rules
       (type, amount, currency, category_id, description, payment_method, day_of_month, frequency)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      rule.type,
      rule.amount,
      rule.currency,
      rule.category_id,
      rule.description,
      rule.payment_method,
      rule.day_of_month,
      rule.frequency,
    ],
  );
}

export async function updateRecurringRule(
  id: number,
  rule: NewRecurringRule,
  isActive: boolean,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE recurring_rules
     SET type = $1, amount = $2, currency = $3, category_id = $4, description = $5,
         payment_method = $6, day_of_month = $7, frequency = $8, is_active = $9
     WHERE id = $10`,
    [
      rule.type,
      rule.amount,
      rule.currency,
      rule.category_id,
      rule.description,
      rule.payment_method,
      rule.day_of_month,
      rule.frequency,
      isActive ? 1 : 0,
      id,
    ],
  );
}

export async function toggleRecurringRule(id: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE recurring_rules SET is_active = $1 WHERE id = $2", [
    isActive ? 1 : 0,
    id,
  ]);
}

export async function deleteRecurringRule(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM recurring_rules WHERE id = $1", [id]);
}

// Record that a rule already produced a transaction for the given period key,
// so it won't be duplicated on the next app start.
export async function markRuleGenerated(id: number, periodKey: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE recurring_rules SET last_generated_month = $1 WHERE id = $2", [
    periodKey,
    id,
  ]);
}
