import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import RateRow from "./RateRow";
import { listCurrenciesWithRates } from "../lib/queries/exchangeRates";
import { insertCurrency } from "../lib/queries/currencies";
import { getNumberSetting, setSetting } from "../lib/queries/settings";
import type { CurrencyWithRate } from "../types";

const DEFAULT_SURCHARGE_KEY = "default_transfer_surcharge";
const inputCls =
  "rounded-lg border border-line bg-background px-2.5 py-2 text-sm outline-none focus:border-primary";

// "Tasas de cambio" section: base currency (fixed), editable rate rows, the
// global default surcharge, and a way to add currencies.
export default function RateSettings() {
  const [currencies, setCurrencies] = useState<CurrencyWithRate[]>([]);
  const [surcharge, setSurcharge] = useState<number>(30);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [rows, stored] = await Promise.all([
        listCurrenciesWithRates(),
        getNumberSetting(DEFAULT_SURCHARGE_KEY, 30),
      ]);
      setCurrencies(rows);
      setSurcharge(stored);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSurchargeChange = async (value: number) => {
    setSurcharge(value);
    if (Number.isFinite(value)) await setSetting(DEFAULT_SURCHARGE_KEY, String(value));
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = newCode.trim().toUpperCase();
    if (!code) {
      setError("Indica el código de la moneda (ej. EUR).");
      return;
    }
    if (currencies.some((c) => c.code === code)) {
      setError("Esa moneda ya existe.");
      return;
    }
    try {
      await insertCurrency(code, newName.trim() || code);
      setNewCode("");
      setNewName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const base = currencies.find((c) => c.is_base === 1);
  const others = currencies.filter((c) => !c.is_base);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Tasas de cambio</h2>

      {/* Base currency (fixed) */}
      <div className="flex items-center justify-between rounded-lg border border-line bg-card p-3">
        <span className="text-sm">Moneda base</span>
        <span className="text-sm font-semibold">{base ? `${base.code} · ${base.name}` : "—"}</span>
      </div>

      {/* Global default surcharge */}
      <label className="block rounded-lg border border-line bg-card p-3">
        <span className="text-sm">Recargo por defecto por transferencia (%)</span>
        <input
          type="number"
          step="any"
          value={surcharge}
          onChange={(e) => handleSurchargeChange(Number(e.target.value))}
          className={`${inputCls} mt-2 w-full`}
          aria-label="Recargo por defecto"
        />
        <span className="mt-1 block text-xs text-muted">
          Se aplica a monedas nuevas y a las que no tengan recargo propio.
        </span>
      </label>

      {/* Per-currency rates */}
      <div className="space-y-2">
        {others.length === 0 && (
          <p className="text-sm text-muted">Sin monedas extranjeras todavía.</p>
        )}
        {others.map((c) => (
          <RateRow key={c.id} currency={c} defaultSurcharge={surcharge} onChanged={refresh} />
        ))}
      </div>

      {/* Add currency */}
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Código (EUR)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className={`${inputCls} w-32 uppercase`}
          aria-label="Código"
        />
        <input
          type="text"
          placeholder="Nombre"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={`${inputCls} flex-1`}
          aria-label="Nombre"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white"
        >
          <Plus size={15} /> Añadir
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
