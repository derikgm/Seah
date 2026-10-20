import { useState, type FormEvent } from "react";
import { getCategoryIcon, ICON_CHOICES } from "../lib/categoryIcons";
import type { Category, CategoryType } from "../types";

export interface CategoryFormValues {
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
}

interface CategoryFormProps {
  initial?: Category;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

const TYPE_OPTIONS: Array<{ value: CategoryType; label: string }> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "both", label: "Ambos" },
];

const COLOR_CHOICES = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
  "#14B8A6",
];

// Create/edit a category: name, icon picker, color swatches and type.
export default function CategoryForm({ initial, onSubmit }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState<string | null>(initial?.icon ?? "Shapes");
  const [color, setColor] = useState<string | null>(initial?.color ?? COLOR_CHOICES[0]);
  const [type, setType] = useState<CategoryType>(initial?.type ?? "expense");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim() === "") {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), icon, color, type });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const SelectedIcon = getCategoryIcon(icon);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        aria-label="Nombre"
      />

      {/* Color swatches */}
      <div className="flex flex-wrap gap-2">
        {COLOR_CHOICES.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => setColor(hex)}
            style={{ backgroundColor: hex }}
            className={`h-7 w-7 rounded-full ${
              color === hex ? "ring-2 ring-offset-2 ring-offset-card" : ""
            }`}
            aria-label={`Color ${hex}`}
          />
        ))}
      </div>

      {/* Icon picker */}
      <div className="max-h-28 overflow-y-auto rounded-lg border border-line p-2">
        <div className="flex flex-wrap gap-1.5">
          {ICON_CHOICES.map((name) => {
            const Icon = getCategoryIcon(name);
            const active = icon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                className={`rounded-md p-2 transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
                }`}
                aria-label={name}
                title={name}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color ?? "#64748B"}20`, color: color ?? "#64748B" }}
        >
          <SelectedIcon size={18} />
        </span>
        <div className="flex flex-1 rounded-lg border border-line p-0.5">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                type === value ? "bg-primary text-white" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear categoría"}
      </button>
    </form>
  );
}
