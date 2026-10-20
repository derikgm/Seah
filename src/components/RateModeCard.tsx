import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { listCurrenciesWithRates } from "../lib/queries/exchangeRates";
import { resolveTransferRate } from "../lib/exchange";
import { formatAmount } from "../lib/format";
import type { CurrencyWithRate } from "../types";

// Shows the currently active exchange rate and the Efectivo/Transferencia
// toggle. The toggle only changes visualization (global store), not stored data.
export default function RateModeCard() {
  const { viewMode, toggleViewMode } = useSettingsStore();
  const [currencies, setCurrencies] = useState<CurrencyWithRate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listCurrenciesWithRates()
      .then(setCurrencies)
      .catch((error: unknown) => console.error("Failed to load rates:", error))
      .finally(() => setLoaded(true));
  }, []);

  // The first non-base currency with a rate is the "featured" rate.
  const featured = currencies.find((c) => !c.is_base && c.rate) ?? null;

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-primary" />
          <span className="text-sm text-muted">Tasa de cambio activa</span>
        </div>

        {/* Efectivo / Transferencia segmented toggle */}
        <div className="flex rounded-lg border border-line p-0.5">
          {(["cash", "transfer"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={toggleViewMode}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === mode ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {mode === "cash" ? "Efectivo" : "Transferencia"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-lg font-bold">
        {!loaded
          ? "Cargando…"
          : featured && featured.rate
            ? `1 ${featured.code} = ${formatAmount(
                viewMode === "cash" ? featured.rate.rate_cash : resolveTransferRate(featured.rate),
              )} CUP (${viewMode === "cash" ? "efectivo" : "transferencia"})`
            : "Sin tasa configurada"}
      </p>
    </div>
  );
}
