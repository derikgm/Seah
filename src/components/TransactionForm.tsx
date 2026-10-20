import { useEffect, useMemo, useState, type FormEvent } from "react";
import { listCategories } from "../lib/queries/categories";
import { listCurrenciesWithRates } from "../lib/queries/exchangeRates";
import { convertToCup, rateForMethod, round2 } from "../lib/exchange";
import { formatAmount } from "../lib/format";
import type {
  Category,
  CurrencyWithRate,
  PaymentMethod,
  Transaction,
  TxType,
} from "../types";

export interface TransactionFormValues {
  type: TxType;
  amount: number;
  currency: string;
  amount_cup: number;
  category_id: number;
  description: string | null;
  payment_method: PaymentMethod;
  exchange_rate_used: number | null;
  date: string;
}

interface TransactionFormProps {
  initial?: Transaction;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
}

// UI labels for enum-backed option groups.
const TYPE_OPTIONS: Array<{ value: TxType; label: string }> = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
];
const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "other", label: "Otro" },
];

// Fast entry form: type → amount → category → description → method → live CUP
// conversion → save. Used for both create and edit (via `initial`).
export default function TransactionForm({ initial, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState<string>(initial?.currency ?? "CUP");
  const [categoryId, setCategoryId] = useState<number>(initial?.category_id ?? 0);
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.payment_method ?? "cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyWithRate[]>([]);

  useEffect(() => {
    Promise.all([listCategories(type), listCurrenciesWithRates()])
      .then(([cats, curs]) => {
        setCategories(cats);
        setCurrencies(curs);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [type]);

  // Reset category if it no longer matches the selected type.
  useEffect(() => {
    if (categoryId !== 0 && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(0);
    }
  }, [categories, categoryId]);

  const rate = useMemo(
    () => currencies.find((c) => c.code === currency)?.rate ?? null,
    [currencies, currency],
  );

  // Live CUP equivalent (base currency needs no conversion).
  const conversion = useMemo(() => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null;
    if (currency === "CUP") return { amountCup: round2(numericAmount), rateUsed: null };
    if (!rate) return { amountCup: round2(numericAmount), rateUsed: null };
    const rateUsed = rateForMethod(rate, method);
    return { amountCup: convertToCup(numericAmount, rateUsed), rateUsed };
  }, [amount, currency, method, rate]);

  const baseCurrency = currencies.find((c) => c.is_base === 1)?.code ?? "CUP";

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
    if (!conversion) {
      setError("Indica un monto válido.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        type,
        amount: numericAmount,
        currency,
        amount_cup: conversion.amountCup,
        category_id: categoryId,
        description: description.trim() === "" ? null : description.trim(),
        payment_method: method,
        exchange_rate_used: conversion.rateUsed,
        date: initial?.date ?? new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Type */}
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

      {/* 2. Amount + currency */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
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

      {/* Live conversion */}
      {conversion && (
        <p className="text-sm text-muted">
          ≈ {formatAmount(conversion.amountCup)} CUP{" "}
          <span className="text-xs">
            ({method === "transfer" ? "transferencia" : method === "cash" ? "efectivo" : "otro"}
            {currency !== baseCurrency && conversion.rateUsed
              ? `, tasa ${formatAmount(conversion.rateUsed)}`
              : ""}
            )
          </span>
        </p>
      )}

      {/* 3. Category */}
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

      {/* 4. Description */}
      <input
        type="text"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={inputCls}
        aria-label="Descripción"
      />

      {/* 5. Payment method */}
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

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* 7. Save */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50"
      >
        {saving ? "Guardando…" : initial ? "Guardar cambios" : "Guardar"}
      </button>
    </form>
  );
}
