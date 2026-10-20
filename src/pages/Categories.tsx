import { useCallback, useEffect, useState } from "react";
import { Folder, Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import CategoryForm, { type CategoryFormValues } from "../components/CategoryForm";
import { getCategoryIcon } from "../lib/categoryIcons";
import {
  countTransactionsInCategory,
  deleteCategory,
  insertCategory,
  listCategories,
  reassignCategory,
  updateCategory,
} from "../lib/queries/categories";
import type { Category } from "../types";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [associatedCount, setAssociatedCount] = useState(0);
  const [reassignTo, setReassignTo] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCategories(await listCategories());
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (values: CategoryFormValues) => {
    if (editing) await updateCategory(editing.id, values.name, values.icon, values.color, values.type);
    else await insertCategory(values.name, values.icon, values.color, values.type);
    setFormOpen(false);
    setEditing(null);
    await refresh();
  };

  // Guard against orphaning transactions: offer reassign when associations exist.
  const handleDeleteClick = async (category: Category) => {
    setError(null);
    const count = await countTransactionsInCategory(category.id);
    setAssociatedCount(count);
    setPendingDelete(category);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setError(null);
    try {
      if (associatedCount > 0) {
        if (reassignTo === 0) {
          setError("Elige una categoría destino para reasignar las transacciones.");
          return;
        }
        await reassignCategory(pendingDelete.id, reassignTo);
        await deleteCategory(pendingDelete.id);
      } else {
        await deleteCategory(pendingDelete.id);
      }
      setPendingDelete(null);
      setReassignTo(0);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const otherCategories = categories.filter((c) => c.id !== pendingDelete?.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categorías"
        action={
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
        }
      />

      {categories.length === 0 ? (
        <EmptyState icon={Folder} title="Sin categorías" hint="Crea tu primera categoría." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const tint = category.color ?? "#64748B";
            return (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 shadow-sm"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${tint}20`, color: tint }}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-xs capitalize text-muted">
                    {category.type === "both" ? "ambos" : category.type === "expense" ? "gasto" : "ingreso"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-primary"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(category)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      >
        <CategoryForm initial={editing ?? undefined} onSubmit={handleSubmit} />
      </Modal>

      <Modal
        open={pendingDelete !== null}
        title="Eliminar categoría"
        onClose={() => {
          setPendingDelete(null);
          setReassignTo(0);
          setError(null);
        }}
      >
        {associatedCount > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Esta categoría tiene {associatedCount} transacciones asociadas. Elige otra
              categoría para reasignarlas antes de eliminar.
            </p>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value={0}>Selecciona categoría destino</option>
              {otherCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-muted">¿Seguro que quieres eliminar esta categoría?</p>
        )}

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPendingDelete(null);
              setReassignTo(0);
            }}
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
