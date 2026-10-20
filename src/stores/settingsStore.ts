import { create } from "zustand";
import type { PaymentMethod } from "../types";

// The global Efectivo/Transferencia toggle. It only affects how amounts are
// visualized (which rate is applied on the fly) — never stored data.
interface SettingsState {
  viewMode: PaymentMethod; // 'cash' | 'transfer' (visualization only)
  setViewMode: (mode: PaymentMethod) => void;
  toggleViewMode: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  viewMode: "cash",
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((state) => ({ viewMode: state.viewMode === "cash" ? "transfer" : "cash" })),
}));
