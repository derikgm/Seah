// Initial schema migrations for Seah's SQLite database.
// Run once at startup (all statements are idempotent via IF NOT EXISTS).

export const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     icon TEXT,
     color TEXT,
     type TEXT NOT NULL CHECK(type IN ('expense','income','both'))
   )`,

  `CREATE TABLE IF NOT EXISTS currencies (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     code TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     is_base INTEGER DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS exchange_rates (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     currency_id INTEGER NOT NULL,
     rate_cash REAL NOT NULL,
     rate_transfer REAL,
     transfer_surcharge_percent REAL,
     updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (currency_id) REFERENCES currencies(id)
   )`,

  `CREATE TABLE IF NOT EXISTS transactions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     type TEXT NOT NULL CHECK(type IN ('expense','income')),
     amount REAL NOT NULL,
     currency TEXT NOT NULL,
     amount_cup REAL NOT NULL,
     category_id INTEGER NOT NULL,
     description TEXT,
     payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','other')),
     exchange_rate_used REAL,
     date TEXT NOT NULL,
     is_recurring_generated INTEGER DEFAULT 0,
     created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (category_id) REFERENCES categories(id)
   )`,

  `CREATE TABLE IF NOT EXISTS recurring_rules (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     type TEXT NOT NULL CHECK(type IN ('expense','income')),
     amount REAL NOT NULL,
     currency TEXT NOT NULL,
     category_id INTEGER NOT NULL,
     description TEXT,
     payment_method TEXT NOT NULL,
     day_of_month INTEGER NOT NULL CHECK(day_of_month BETWEEN 1 AND 31),
     frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(frequency IN ('monthly','weekly')),
     is_active INTEGER DEFAULT 1,
     last_generated_month TEXT,
     FOREIGN KEY (category_id) REFERENCES categories(id)
   )`,

  // Speed up the monthly dashboard / transactions filters.
  `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
  `CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency_id)`,

  // Global app settings (key/value) — e.g. the default transfer surcharge %.
  // Additive: stores globals not covered by the section-3 schema.
  `CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
];
