import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { listCategories } from "../lib/queries/categories";
import { formatAmount, formatDate } from "../lib/format";
import type { Category, Transaction } from "../types";

interface TransactionListProps {
  transactions: Transaction[];
  // When provided, edit/delete buttons are rendered per row.
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

// Compact transaction rows with resolved category names/icons. Used by the
// dashboard (read-only) and the transactions page (with actions).
export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((error: unknown) => console.error("Failed to load categories:", error));
  }, []);

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Sin transacciones aún.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {transactions.map((tx) => {
        const category = byId.get(tx.category_id);
        const isIncome = tx.type === "income";
        return (
          <li key={tx.id} className="flex items-center gap-3 py-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isIncome ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              {isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {tx.description || category?.name || "Sin concepto"}
              </p>
              <p className="truncate text-xs text-muted">
                {category?.name ?? "—"} · {formatDate(tx.date)}
              </p>
            </div>

            <span
              className={`shrink-0 text-sm font-semibold ${
                isIncome ? "text-success" : "text-danger"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatAmount(tx.amount_cup)} CUP
            </span>

            {(onEdit || onDelete) && (
              <div className="flex shrink-0 gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(tx)}
                    className="rounded-md p-1.5 text-muted transition-colors hover:text-primary"
                    aria-label="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(tx)}
                    className="rounded-md p-1.5 text-muted transition-colors hover:text-danger"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
