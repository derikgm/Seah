import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import AnnualLineChart, { type LineDatum } from "../components/AnnualLineChart";
import { getYearlyTotals } from "../lib/dashboard";
import { formatCup } from "../lib/format";

export default function Annual() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<LineDatum[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });

  const refresh = useCallback(async () => {
    try {
      const yearly = await getYearlyTotals(year);
      setChartData(
        yearly.map((m) => ({ month: m.month, income: m.income_cup, expense: m.expense_cup })),
      );
      setTotals({
        income: yearly.reduce((acc, m) => acc + m.income_cup, 0),
        expense: yearly.reduce((acc, m) => acc + m.expense_cup, 0),
      });
    } catch (e) {
      console.error("Failed to load year:", e);
    }
  }, [year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const balance = totals.income - totals.expense;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Anual ${year}`}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg border border-line p-2 text-muted hover:text-foreground"
              aria-label="Año anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="rounded-lg border border-line p-2 text-muted hover:text-foreground"
              aria-label="Año siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ingresos del año" value={formatCup(totals.income)} icon={ArrowDownLeft} tone="success" />
        <StatCard label="Gastos del año" value={formatCup(totals.expense)} icon={ArrowUpRight} tone="danger" />
        <StatCard label="Balance del año" value={formatCup(balance)} icon={Wallet} />
      </div>

      <section className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Tendencia mensual · ingresos vs gastos
        </h2>
        <AnnualLineChart data={chartData} />
      </section>
    </div>
  );
}
