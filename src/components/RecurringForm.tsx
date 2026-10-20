import { useEffect, useState, type FormEvent } from "react";
import { listCategories } from "../lib/queries/categories";
import { listCurrencies } from "../lib/queries/currencies";
import type {
  Category,
  Currency,
  Frequency,
  PaymentMethod,
  RecurringRule,
  TxType,
} from "../types";

export interface RecurringFormValues {
  type: TxType;
  amount: number;
  currency: string;
  category_id: number;
  description: string | null;
  payment_method: PaymentMethod;
  day_of_month: number;
  frequency: Frequency;
}

interface RecurringFormProps {
  initial?: RecurringRule;
  onSubmit: (values: RecurringFormValues) => Promise<void>;
}

const TYPE_OPTIONS: Array<{ value: TxType; label: string }> = [
  { value: "income", label: "Ingreso" },
  { value: "expense", label: "Gasto" },
];
const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "other", label: "Otro" },
];
const FREQUENCY_OPTIONS: Array<{ value: Frequency; label: string }> = [
  { value: "monthly", label: "Mensual" },
  { value: "weekly", label: "Semanal" },
];

const inputCls =
  "w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

// Create/edit a recurring rule (e.g. salary on day 4 of each month).
export default function RecurringForm({ initial, onSubmit }: RecurringFormProps) {
  const [type, setType] = useState<TxType>(initial?.type ?? "income");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? "CUP");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.payment_method ?? "cash");
  const [day, setDay] = useState<number>(initial?.day_of_month ?? 1);
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "monthly");
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listCategories(type), listCurrencies()])
      .then(([cats, curs]) => {
        setCategories(cats);
        setCurrencies(curs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [type]);

  useEffect(() => {
    if (categoryId !== 0 && !categories.some((c) => c.id === categoryId)) setCategoryId(0);
  }, [categories, categoryId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El monto debe ser mayor que 0.");
      return;
    }
    if (categoryId === 0) {
      setError("Selecciona una categoría.");
      return;
    }
    if (frequency === "monthly" && (day < 1 || day > 31)) {
      setError("El día debe estar entre 1 y 31.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: numericAmount,
        currency,
        category_id: categoryId,
        description: description.trim() === "" ? null : description.trim(),
        payment_method: method,
        day_of_month: frequency === "monthly" ? day : 1,
        frequency,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex rounded-lg border border-line p-0.5">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              type === value
                ? value === "income"
                  ? "bg-success text-white"
                  : "bg-danger text-white"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          min="0"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputCls} flex-1 text-lg font-bold`}
          aria-label="Monto"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className={`${inputCls} w-28`}
          aria-label="Moneda"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </div>

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(Number(e.target.value))}
        className={inputCls}
        aria-label="Categoría"
      >
        <option value={0}>Selecciona una categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={inputCls}
        aria-label="Descripción"
      />

      <div className="flex rounded-lg border border-line p-0.5">
        {METHOD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMethod(value)}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
              method === value ? "bg-primary text-white" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          className={`${inputCls} flex-1`}
          aria-label="Frecuencia"
        >
          {FREQUENCY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {frequency === "monthly" && (
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className={`${inputCls} w-20`}
            aria-label="Día del mes"
          />
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear regla"}
      </button>
    </form>
  );
}
