import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import RateModeCard from "../components/RateModeCard";
import MonthlyBarChart, { type BarDatum } from "../components/MonthlyBarChart";
import TransactionList from "../components/TransactionList";
import { getDashboardSummary, getYearlyTotals } from "../lib/dashboard";
import { getRecentTransactions } from "../lib/queries/transactions";
import { formatCup, monthLabel } from "../lib/format";
import type { DashboardSummary, Transaction } from "../types";

const CURRENT_DATE = new Date();

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<BarDatum[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const month = CURRENT_DATE.getMonth() + 1;
    const year = CURRENT_DATE.getFullYear();
    Promise.all([
      getDashboardSummary(month, year),
      getYearlyTotals(year),
      getRecentTransactions(10),
    ])
      .then(([sum, yearly, txs]) => {
        setSummary(sum);
        setChartData(
          yearly.map((m) => ({ month: m.month, income: m.income_cup, expense: m.expense_cup })),
        );
        setRecent(txs);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-danger bg-card p-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={monthLabel(CURRENT_DATE.getMonth() + 1, CURRENT_DATE.getFullYear())}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo actual"
          value={formatCup(summary?.balance_cup ?? 0)}
          icon={Wallet}
        />
        <StatCard
          label="Ingresos del mes"
          value={formatCup(summary?.income_cup ?? 0)}
          icon={ArrowDownLeft}
          tone="success"
        />
        <StatCard
          label="Gastos del mes"
          value={formatCup(summary?.expense_cup ?? 0)}
          icon={ArrowUpRight}
          tone="danger"
        />
      </div>

      <RateModeCard />

      <section className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Ingresos vs gastos · {CURRENT_DATE.getFullYear()}
        </h2>
        <MonthlyBarChart data={chartData} />
      </section>

      <section className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-1 text-sm font-semibold text-muted">Últimas transacciones</h2>
        <TransactionList transactions={recent} />
      </section>
    </div>
  );
}
