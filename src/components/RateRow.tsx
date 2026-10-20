import { useState } from "react";
import { Trash2 } from "lucide-react";
import { upsertRate } from "../lib/queries/exchangeRates";
import { deleteCurrency } from "../lib/queries/currencies";
import { formatAmount } from "../lib/format";
import type { CurrencyWithRate } from "../types";

interface RateRowProps {
  currency: CurrencyWithRate;
  defaultSurcharge: number;
  onChanged: () => void;
}

const inputCls =
  "w-full rounded-lg border border-line bg-background px-2.5 py-2 text-sm outline-none focus:border-primary";

// Editable rate row for one currency: cash rate, surcharge % and (optionally) a
// manual transfer rate. A blank manual transfer falls back to the surcharge.
export default function RateRow({ currency, defaultSurcharge, onChanged }: RateRowProps) {
  const [cash, setCash] = useState<string>(String(currency.rate?.rate_cash ?? ""));
  const [surcharge, setSurcharge] = useState<string>(
    String(currency.rate?.transfer_surcharge_percent ?? defaultSurcharge),
  );
  const [manualTransfer, setManualTransfer] = useState<string>(
    currency.rate?.rate_transfer != null ? String(currency.rate.rate_transfer) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveTransfer = (() => {
    const cashNum = Number(cash);
    if (!Number.isFinite(cashNum) || cashNum <= 0) return null;
    const manualNum = Number(manualTransfer);
    if (Number.isFinite(manualNum) && manualNum > 0) return manualNum;
    const surchargeNum = Number(surcharge);
    if (Number.isFinite(surchargeNum)) return cashNum * (1 + surchargeNum / 100);
    return cashNum;
  })();

  const handleSave = async () => {
    setError(null);
    const cashNum = Number(cash);
    if (!Number.isFinite(cashNum) || cashNum <= 0) {
      setError("La tasa en efectivo debe ser > 0.");
      return;
    }
    const surchargeNum = Number(surcharge);
    const manualNum = Number(manualTransfer);
    setSaving(true);
    try {
      await upsertRate(
        currency.id,
        cashNum,
        Number.isFinite(manualNum) && manualNum > 0 ? manualNum : null,
        Number.isFinite(surchargeNum) ? surchargeNum : null,
      );
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteCurrency(currency.id);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="rounded-lg border border-line p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">
          {currency.code} <span className="font-normal text-muted">· {currency.name}</span>
        </span>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md p-1.5 text-muted transition-colors hover:text-danger"
          aria-label={`Eliminar ${currency.code}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[11px] text-muted">Efectivo</span>
          <input
            type="number"
            step="any"
            min="0"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            className={inputCls}
            aria-label={`Tasa efectivo ${currency.code}`}
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-muted">Recargo %</span>
          <input
            type="number"
            step="any"
            value={surcharge}
            onChange={(e) => setSurcharge(e.target.value)}
            className={inputCls}
            aria-label={`Recargo ${currency.code}`}
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-muted">Transferencia</span>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="auto"
            value={manualTransfer}
            onChange={(e) => setManualTransfer(e.target.value)}
            className={inputCls}
            aria-label={`Tasa transferencia ${currency.code}`}
          />
        </label>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted">
          {effectiveTransfer != null
            ? `Transferencia = ${formatAmount(effectiveTransfer)} CUP`
            : "—"}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {saving ? "…" : "Guardar"}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
