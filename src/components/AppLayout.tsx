import { NavLink, Outlet } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";
import ThemeToggle from "./ThemeToggle";

// Sidebar for desktop (≥1024px) + bottom navigation for mobile, with a simple
// page header. Content is rendered via the router <Outlet />.
export default function AppLayout() {
  return (
    <div className="flex min-h-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-card lg:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            S
          </span>
          <span className="text-lg font-bold">Seah</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-card hover:text-foreground"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3 lg:px-6">
          <span className="text-base font-semibold lg:hidden">Seah</span>
          <span className="hidden text-base font-semibold lg:block">
            Finanzas personales
          </span>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:pb-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
