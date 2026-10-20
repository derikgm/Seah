import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import CategoryBreakdown from "../components/CategoryBreakdown";
import TransactionList from "../components/TransactionList";
import {
  getCategoryBreakdown,
  getDashboardSummary,
  type CategoryBreakdownRow,
} from "../lib/dashboard";
import { listTransactions } from "../lib/queries/transactions";
import { formatCup, monthLabel } from "../lib/format";
import type { DashboardSummary, Transaction } from "../types";

export default function Monthly() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(async () => {
    try {
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      const [sum, rows, txs] = await Promise.all([
        getDashboardSummary(month, year),
        getCategoryBreakdown(month, year, "expense"),
        listTransactions({ month: monthStr }),
      ]);
      setSummary(sum);
      setBreakdown(rows);
      setTransactions(txs);
    } catch (e) {
      console.error("Failed to load month:", e);
    }
  }, [month, year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const shiftMonth = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const expenseTotal = summary?.expense_cup ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={monthLabel(month, year)}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg border border-line p-2 text-muted hover:text-foreground"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg border border-line p-2 text-muted hover:text-foreground"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos" value={formatCup(summary?.income_cup ?? 0)} icon={ArrowDownLeft} tone="success" />
        <StatCard label="Gastos" value={formatCup(summary?.expense_cup ?? 0)} icon={ArrowUpRight} tone="danger" />
        <StatCard label="Balance" value={formatCup(summary?.balance_cup ?? 0)} icon={Wallet} />
      </div>

      <section className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted">Gastos por categoría</h2>
        <CategoryBreakdown rows={breakdown} total={expenseTotal} />
      </section>

      <section className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-1 text-sm font-semibold text-muted">
          Movimientos del mes ({transactions.length})
        </h2>
        <TransactionList transactions={transactions} />
      </section>
    </div>
  );
}
