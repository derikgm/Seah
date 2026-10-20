import { getDb } from "./db";
import type { DashboardSummary, MonthlyTotals } from "../types";

// Totals for a given month, using the stored CUP amounts (`amount_cup`), which
// already reflect the rate + payment method at registration time.
export async function getDashboardSummary(month: number, year: number): Promise<DashboardSummary> {
  const db = await getDb();
  const rows = await db.select<
    Array<{ type: string; total: number; count: number }>
  >(
    `SELECT type, SUM(amount_cup) as total, COUNT(*) as count
     FROM transactions
     WHERE strftime('%m', date) = $1 AND strftime('%Y', date) = $2
     GROUP BY type`,
    [String(month).padStart(2, "0"), String(year)],
  );

  let incomeCup = 0;
  let expenseCup = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  for (const row of rows) {
    if (row.type === "income") {
      incomeCup = row.total;
      incomeCount = row.count;
    } else if (row.type === "expense") {
      expenseCup = row.total;
      expenseCount = row.count;
    }
  }
  return {
    income_cup: incomeCup,
    expense_cup: expenseCup,
    balance_cup: incomeCup - expenseCup,
    income_count: incomeCount,
    expense_count: expenseCount,
  };
}

// One row per month (income + expense totals) for the twelve months of a year.
// Used by the annual line/bar chart. Missing months default to 0.
export async function getYearlyTotals(year: number): Promise<MonthlyTotals[]> {
  const db = await getDb();
  const rows = await db.select<Array<{ month: string; type: string; total: number }>>(
    `SELECT strftime('%m', date) as month, type, SUM(amount_cup) as total
     FROM transactions
     WHERE strftime('%Y', date) = $1
     GROUP BY month, type`,
    [String(year)],
  );

  const byMonth = new Map<string, MonthlyTotals>();
  for (let m = 1; m <= 12; m++) {
    const key = String(m).padStart(2, "0");
    byMonth.set(key, { month: key, income_cup: 0, expense_cup: 0 });
  }
  for (const row of rows) {
    const entry = byMonth.get(row.month);
    if (!entry) continue;
    if (row.type === "income") entry.income_cup = row.total;
    else entry.expense_cup = row.total;
  }
  return [...byMonth.values()];
}

export interface CategoryBreakdownRow {
  category_id: number;
  name: string;
  color: string | null;
  total: number;
}

// Expense (or income) totals grouped by category for a given month.
export async function getCategoryBreakdown(
  month: number,
  year: number,
  type: "expense" | "income",
): Promise<CategoryBreakdownRow[]> {
  const db = await getDb();
  return db.select<CategoryBreakdownRow[]>(
    `SELECT t.category_id, c.name, c.color, SUM(t.amount_cup) as total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.type = $1
       AND strftime('%m', t.date) = $2
       AND strftime('%Y', t.date) = $3
     GROUP BY t.category_id, c.name, c.color
     ORDER BY total DESC`,
    [type, String(month).padStart(2, "0"), String(year)],
  );
}
