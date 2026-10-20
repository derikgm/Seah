import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";

// Quick theme toggle for the header. Any non-dark theme counts as light, so
// pressing it from "system" switches to dark and vice versa.
export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-foreground"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
