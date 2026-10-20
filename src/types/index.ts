// Shared domain types for Seah (strict TS, no `any`).

export type TxType = "expense" | "income";
export type PaymentMethod = "cash" | "transfer" | "other";
export type CategoryType = "expense" | "income" | "both";
export type Frequency = "monthly" | "weekly";

export interface Transaction {
  id: number;
  type: TxType;
  amount: number;
  currency: string;
  amount_cup: number;
  category_id: number;
  description: string | null;
  payment_method: PaymentMethod;
  exchange_rate_used: number | null;
  date: string; // ISO 8601
  is_recurring_generated: number; // 0 | 1
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  is_base: number; // 0 | 1
}

export interface ExchangeRate {
  id: number;
  currency_id: number;
  rate_cash: number;
  rate_transfer: number | null;
  transfer_surcharge_percent: number | null;
  updated_at: string;
}

export interface RecurringRule {
  id: number;
  type: TxType;
  amount: number;
  currency: string;
  category_id: number;
  description: string | null;
  payment_method: PaymentMethod;
  day_of_month: number; // 1..31
  frequency: Frequency;
  is_active: number; // 0 | 1
  last_generated_month: string | null; // 'YYYY-MM' (monthly) or 'YYYY-Www' (weekly)
}

export interface DashboardSummary {
  income_cup: number;
  expense_cup: number;
  balance_cup: number;
  income_count: number;
  expense_count: number;
}

export interface MonthlyTotals {
  month: string; // 'YYYY-MM'
  income_cup: number;
  expense_cup: number;
}

// A currency joined with its latest exchange rate row (if any).
export interface CurrencyWithRate extends Currency {
  rate: ExchangeRate | null;
}
