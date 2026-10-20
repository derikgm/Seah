import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "../stores/themeStore";
import type { ThemePreference } from "../lib/theme";

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

// "Apariencia" section: light / dark / system theme switch. The choice is
// applied instantly and persisted in the SQLite settings table.
export default function AppearanceSettings() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Apariencia</h2>

      <div className="rounded-lg border border-line bg-card p-3">
        <span className="text-sm">Tema de la aplicación</span>

        <div
          className="mt-2 flex rounded-lg border border-line p-0.5"
          role="radiogroup"
          aria-label="Tema de la aplicación"
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        <span className="mt-2 block text-xs text-muted">
          «Sistema» sigue la preferencia de tu dispositivo. La elección se recuerda entre sesiones.
        </span>
      </div>
    </section>
  );
}
