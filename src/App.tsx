import { useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { bootstrap } from "./lib/bootstrap";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Monthly from "./pages/Monthly";
import Annual from "./pages/Annual";

type InitState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

function App() {
  const [init, setInit] = useState<InitState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    bootstrap()
      .then(() => {
        if (!cancelled) setInit({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setInit({ status: "error", message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (init.status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted">Cargando Seah…</p>
      </div>
    );
  }

  if (init.status === "error") {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-danger bg-card p-6">
          <h1 className="text-lg font-bold text-danger">Error al iniciar la base de datos</h1>
          <p className="mt-2 break-words text-sm text-muted">{init.message}</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/monthly" element={<Monthly />} />
          <Route path="/annual" element={<Annual />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
