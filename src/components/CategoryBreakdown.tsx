import type { CategoryBreakdownRow } from "../lib/dashboard";
import { formatAmount } from "../lib/format";

interface CategoryBreakdownProps {
  rows: CategoryBreakdownRow[];
  total: number;
}

// Horizontal bars showing each category's share of the month's total.
export default function CategoryBreakdown({ rows, total }: CategoryBreakdownProps) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">Sin datos este mes.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const percent = total > 0 ? (row.total / total) * 100 : 0;
        const tint = row.color ?? "#64748B";
        return (
          <li key={row.category_id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tint }}
                  aria-hidden
                />
                {row.name}
              </span>
              <span className="font-medium">
                {formatAmount(row.total)} CUP{" "}
                <span className="text-xs text-muted">({percent.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: tint }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
