import { getSetting, setSetting } from "./queries/settings";

// Theme preference: 'light' | 'dark' force a palette, 'system' follows the OS.
export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "theme";

export const DEFAULT_THEME: ThemePreference = "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

// Applies the preference to <html>. `system` removes both classes so the
// prefers-color-scheme media query in globals.css decides.
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  root.classList.toggle("dark", preference === "dark");
  root.classList.toggle("light", preference === "light");
}

export async function loadTheme(): Promise<ThemePreference> {
  try {
    const stored = await getSetting(THEME_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // A missing settings row (or an unavailable DB) must not block startup.
  }
  return DEFAULT_THEME;
}

export async function saveTheme(preference: ThemePreference): Promise<void> {
  await setSetting(THEME_KEY, preference);
}
