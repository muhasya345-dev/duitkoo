-- Migrasi 0005: budget bulanan per kategori + tanggal target nikah.

-- Batas pengeluaran bulanan per kategori (0 = tanpa batas).
ALTER TABLE categories ADD COLUMN monthly_budget INTEGER DEFAULT 0;

-- Tanggal target nikah (untuk countdown & hitung wajib nabung/bulan).
INSERT OR IGNORE INTO plan_settings (key, value) VALUES ('target_date', '2027-06-01');
