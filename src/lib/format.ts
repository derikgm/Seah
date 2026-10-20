// Formatting helpers shared across the app.

// Group thousands with commas, up to 2 decimals only when needed.
export function formatAmount(value: number): string {
  return value.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatCup(value: number): string {
  return `${formatAmount(value)} CUP`;
}

// ISO string (or Date) → localized short date, e.g. "4 oct".
export function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

// 'YYYY-MM' → human label, e.g. "octubre 2026".
export function monthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es", { month: "long", year: "numeric" });
}

const MONTH_NAMES_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// Short label for a 'MM' key, used by the annual chart axis.
export function shortMonth(monthKey: string): string {
  const index = Number(monthKey) - 1;
  return MONTH_NAMES_SHORT[index] ?? monthKey;
}
