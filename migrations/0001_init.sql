-- Migrasi 0001: skema awal Duitkoo
-- Jalankan: wrangler d1 migrations apply duitkoo-db --remote
-- (untuk lokal tambahkan --local)

-- users: cukup 1 baris (single-user). Tabel disediakan untuk fleksibilitas.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,            -- 'kebutuhan' | 'keinginan' | 'pernikahan' | dst
  color TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL,
  original_filename TEXT,
  ocr_status TEXT DEFAULT 'pending',  -- pending|done|failed
  ocr_raw_json TEXT,
  merchant TEXT,
  receipt_date TEXT,
  total INTEGER,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  name TEXT,
  qty REAL,
  price INTEGER
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  amount INTEGER NOT NULL,           -- Rupiah, disimpan sebagai integer
  payment_method TEXT,
  is_wedding INTEGER DEFAULT 0,
  receipt_id INTEGER REFERENCES receipts(id),
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS income_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  frequency TEXT,        -- 'bulanan' | 'periodik' | 'tahunan'
  month_pattern TEXT     -- mis. 'tiap bulan' | 'Jul' | 'Des,Jun' | 'Mar'
);

CREATE TABLE IF NOT EXISTS gold_savings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT,            -- 'YYYY-MM'
  grams REAL,
  price_per_gram INTEGER
);

CREATE TABLE IF NOT EXISTS wedding_budget (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item TEXT NOT NULL,
  estimated INTEGER,
  actual INTEGER DEFAULT 0,
  priority TEXT,
  note TEXT
);

-- key-value untuk asumsi rencana (target, saldo, tanggal, harga emas, biaya hidup, dst)
CREATE TABLE IF NOT EXISTS plan_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Index untuk query yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_wedding ON expenses(is_wedding);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);
