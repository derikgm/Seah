import { create } from "zustand";
import {
  applyTheme,
  DEFAULT_THEME,
  loadTheme,
  saveTheme,
  type ThemePreference,
} from "../lib/theme";

// Theme preference shared across the app. `applyTheme` is called synchronously
// so the UI updates instantly; persistence to SQLite happens in the background.
interface ThemeState {
  theme: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
  hydrateTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,
  setTheme: (preference) => {
    applyTheme(preference);
    set({ theme: preference });
    void saveTheme(preference).catch(() => {
      // Persisting is best-effort: the in-session theme still applies.
    });
  },
  hydrateTheme: async () => {
    const stored = await loadTheme();
    applyTheme(stored);
    set({ theme: stored });
  },
}));
