import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount, shortMonth } from "../lib/format";

export interface BarDatum {
  month: string; // 'MM'
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: BarDatum[];
}

// Income vs. expense bars for a year. Colors follow the Seah palette via CSS
// variables so it adapts to light/dark automatically.
export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Sin datos para mostrar.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={shortMonth}
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            formatter={(value) => formatAmount(Number(value))}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--fg)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Ingresos" fill="var(--success)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Gastos" fill="var(--danger)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
