import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Download } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import TransactionList from "../components/TransactionList";
import Modal from "../components/Modal";
import TransactionForm, { type TransactionFormValues } from "../components/TransactionForm";
import { exportTransactionsCsv } from "../lib/csv";
import {
  deleteTransaction,
  insertTransaction,
  listTransactions,
  updateTransaction,
  type TransactionFilters,
} from "../lib/queries/transactions";
import { listCategories } from "../lib/queries/categories";
import type { Category, Transaction, TxType, PaymentMethod } from "../types";

const inputCls =
  "rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-primary";

export default function Transactions() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const refresh = useCallback(async () => {
    try {
      setTransactions(await listTransactions(filters));
    } catch (e) {
      console.error("Failed to load transactions:", e);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((e) => console.error("Failed to load categories:", e));
  }, []);

  // Debounced free-text search.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: search.trim() || undefined }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const setFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (values: TransactionFormValues) => {
    if (editing) await updateTransaction(editing.id, values);
    else await insertTransaction(values);
    setFormOpen(false);
    setEditing(null);
    await refresh();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteTransaction(pendingDelete.id);
    setPendingDelete(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transacciones"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                exportTransactionsCsv(transactions, `seah-transacciones-${Date.now()}.csv`)
              }
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
              title="Exportar CSV"
            >
              <Download size={16} /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-bold text-white"
            >
              <Plus size={16} /> Nueva
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="relative col-span-2 sm:col-span-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-8`}
          />
        </div>
        <input
          type="month"
          className={inputCls}
          onChange={(e) => setFilter("month", e.target.value || undefined)}
        />
        <select
          className={inputCls}
          onChange={(e) =>
            setFilter("type", (e.target.value || undefined) as TxType | undefined)
          }
        >
          <option value="">Tipo</option>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
        <select
          className={inputCls}
          onChange={(e) =>
            setFilter("categoryId", e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={inputCls}
          onChange={(e) =>
            setFilter("method", (e.target.value || undefined) as PaymentMethod | undefined)
          }
        >
          <option value="">Método</option>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
        {transactions.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Sin transacciones"
            hint="Ajusta los filtros o crea una nueva."
          />
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={(tx) => {
              setEditing(tx);
              setFormOpen(true);
            }}
            onDelete={(tx) => setPendingDelete(tx)}
          />
        )}
      </div>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        title={editing ? "Editar transacción" : "Nueva transacción"}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      >
        <TransactionForm initial={editing ?? undefined} onSubmit={handleSubmit} />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={pendingDelete !== null}
        title="Eliminar transacción"
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-sm text-muted">
          ¿Seguro que quieres eliminar esta transacción? Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="flex-1 rounded-lg bg-danger py-2.5 text-sm font-bold text-white"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
