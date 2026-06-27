-- Migrasi 0004: catatan saldo/tabungan NYATA untuk progres aktual vs proyeksi.

CREATE TABLE IF NOT EXISTS savings_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,        -- YYYY-MM-DD
  amount INTEGER NOT NULL,   -- saldo/tabungan nyata pada tanggal itu (Rupiah)
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_savings_date ON savings_log(date);
