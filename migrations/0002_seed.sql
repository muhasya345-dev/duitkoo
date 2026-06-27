-- Migrasi 0002: seed data awal sesuai rencana yang sudah disusun.
-- Migrasi dilacak oleh wrangler (tabel d1_migrations) sehingga hanya jalan
-- sekali. Memakai multi-row VALUES (bukan compound SELECT) agar tidak kena
-- batas "too many terms in compound SELECT" pada D1.

-- ── User tunggal ───────────────────────────────────────────────
INSERT OR IGNORE INTO users (id, nip, name)
VALUES (1, '199911222025051007', 'Muhammad Sya''ban Nurul Fuad');

-- ── Asumsi rencana (plan_settings) — punya PK, aman OR IGNORE ───
INSERT OR IGNORE INTO plan_settings (key, value) VALUES
  ('saldo_awal', '9000000'),
  ('target_min', '60000000'),
  ('target_max', '70000000'),
  ('target_periode', 'Mei–Juni 2027'),
  ('biaya_hidup_bulanan', '2500000'),
  ('harga_emas_per_gram', '2655000'),
  ('mahar_target_gram', '5'),
  ('mahar_cicil_per_bulan_gram', '0.5'),
  ('proyeksi_mulai', '2026-07'),
  ('proyeksi_selesai', '2027-06');

-- ── Kategori awal ──────────────────────────────────────────────
INSERT INTO categories (name, type, color, icon) VALUES
  ('Makan & Minum', 'kebutuhan', '#ef4444', 'utensils'),
  ('Transportasi', 'kebutuhan', '#f59e0b', 'car'),
  ('Tagihan', 'kebutuhan', '#3b82f6', 'receipt'),
  ('Pendidikan', 'kebutuhan', '#8b5cf6', 'book'),
  ('Kesehatan', 'kebutuhan', '#ec4899', 'heart'),
  ('Pernikahan', 'pernikahan', '#d4a017', 'gem'),
  ('Sedekah/Zakat', 'keinginan', '#10b981', 'hand-heart'),
  ('Lain-lain', 'keinginan', '#6b7280', 'ellipsis');

-- ── Sumber penghasilan ─────────────────────────────────────────
INSERT INTO income_sources (name, amount, frequency, month_pattern) VALUES
  ('Gaji pokok', 2785000, 'bulanan', 'tiap bulan'),
  ('Tukin', 1300000, 'bulanan', 'tiap bulan'),
  ('Uang makan', 625000, 'bulanan', 'tiap bulan'),
  ('Honor pesantren', 780000, 'bulanan', 'tiap bulan'),
  ('Panitia unit penjualan kitab', 1500000, 'periodik', 'Jul'),
  ('Panitia EHB pesantren', 1300000, 'periodik', 'Des,Jun'),
  ('Editor soal diniyah kabupaten', 1000000, 'periodik', 'Des,Jun'),
  ('Gaji ke-13', 3500000, 'tahunan', 'Jul'),
  ('THR', 3500000, 'tahunan', 'Mar');

-- ── Anggaran pernikahan ────────────────────────────────────────
INSERT INTO wedding_budget (item, estimated, actual, priority) VALUES
  ('Mahar — emas Antam 5 gram', 13275000, 0, 'Wajib'),
  ('Cincin kawin (2 pcs)', 4000000, 0, 'Tinggi'),
  ('Seserahan / hantaran', 5000000, 0, 'Tinggi'),
  ('Kontribusi resepsi / catering', 20000000, 0, 'Tinggi'),
  ('Dekorasi & pelaminan', 8000000, 0, 'Sedang'),
  ('Dokumentasi (foto/video)', 4000000, 0, 'Sedang'),
  ('Pakaian & rias pengantin', 4000000, 0, 'Sedang'),
  ('Undangan & souvenir', 3000000, 0, 'Sedang'),
  ('Akad / KUA & administrasi', 1000000, 0, 'Wajib'),
  ('Cadangan / dana darurat (10%)', 6200000, 0, 'Penting');

-- ── Tabungan emas: baris awal bulan mulai (0 gram) ─────────────
INSERT INTO gold_savings (month, grams, price_per_gram) VALUES
  ('2026-07', 0, 2655000);
