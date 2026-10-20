import type { Transaction } from "../types";

// RFC-4180 escaping: wrap in quotes, double any inner quotes.
function escapeCell(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(transactions: Transaction[]): string {
  const header = [
    "fecha",
    "tipo",
    "monto",
    "moneda",
    "monto_cup",
    "categoria_id",
    "descripcion",
    "metodo",
    "tasa_usada",
  ];
  const rows = transactions.map((tx) =>
    [
      tx.date,
      tx.type,
      String(tx.amount),
      tx.currency,
      String(tx.amount_cup),
      String(tx.category_id),
      escapeCell(tx.description ?? ""),
      tx.payment_method,
      tx.exchange_rate_used != null ? String(tx.exchange_rate_used) : "",
    ].join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

// Trigger a client-side CSV download of the given transactions. Runs fully in
// the webview (no backend round-trip needed).
export function exportTransactionsCsv(transactions: Transaction[], filename: string): void {
  const bom = "\uFEFF"; // so Excel opens UTF-8 accents correctly
  const blob = new Blob([bom + toCsv(transactions)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
