import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import Modal from "./Modal";
import RecurringForm, { type RecurringFormValues } from "./RecurringForm";
import { getCategoryIcon } from "../lib/categoryIcons";
import {
  deleteRecurringRule,
  insertRecurringRule,
  listRecurringRules,
  toggleRecurringRule,
  updateRecurringRule,
} from "../lib/queries/recurringRules";
import { listCategories } from "../lib/queries/categories";
import { formatAmount } from "../lib/format";
import type { Category, RecurringRule } from "../types";

// "Recurrentes" section: list of rules with active toggle + CRUD.
export default function RecurringSettings() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecurringRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [ruleRows, catRows] = await Promise.all([listRecurringRules(), listCategories()]);
      setRules(ruleRows);
      setCategories(catRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (values: RecurringFormValues) => {
    if (editing) await updateRecurringRule(editing.id, values, Boolean(editing.is_active));
    else await insertRecurringRule(values);
    setFormOpen(false);
    setEditing(null);
    await refresh();
  };

  const handleToggle = async (rule: RecurringRule) => {
    await toggleRecurringRule(rule.id, !rule.is_active);
    await refresh();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteRecurringRule(pendingDelete.id);
    setPendingDelete(null);
    await refresh();
  };

  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <RefreshCw size={16} className="text-primary" /> Recurrentes
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white"
        >
          <Plus size={15} /> Nueva
        </button>
      </div>

      {rules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
          Sin reglas recurrentes. Crea una para automatizar ingresos o gastos fijos.
        </p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => {
            const category = catById.get(rule.category_id);
            const Icon = getCategoryIcon(category?.icon ?? null);
            const tint = category?.color ?? "#64748B";
            const active = Boolean(rule.is_active);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-3 rounded-lg border border-line bg-card p-3 ${
                  active ? "" : "opacity-60"
                }`}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${tint}20`, color: tint }}
                >
                  <Icon size={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {rule.description || category?.name || "Regla"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {rule.type === "income" ? "Ingreso" : "Gasto"} ·{" "}
                    {formatAmount(rule.amount)} {rule.currency} ·{" "}
                    {rule.frequency === "monthly"
                      ? `día ${rule.day_of_month}/mes`
                      : "semanal"}{" "}
                    · {rule.payment_method === "cash" ? "efectivo" : rule.payment_method === "transfer" ? "transferencia" : "otro"}
                  </p>
                </div>

                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(rule)}
                  role="switch"
                  aria-checked={active}
                  aria-label={active ? "Desactivar" : "Activar"}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    active ? "bg-success" : "bg-line"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      active ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(rule);
                      setFormOpen(true);
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-primary"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(rule)}
                    className="rounded-md p-1.5 text-muted hover:text-danger"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Modal
        open={formOpen}
        title={editing ? "Editar regla" : "Nueva regla recurrente"}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      >
        <RecurringForm initial={editing ?? undefined} onSubmit={handleSubmit} />
      </Modal>

      <Modal
        open={pendingDelete !== null}
        title="Eliminar regla"
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-sm text-muted">¿Seguro que quieres eliminar esta regla?</p>
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
    </section>
  );
}
