-- Migrasi 0003: emoji kategori + tambah kategori + setting emas (patokan).

-- ── Emoji untuk kategori awal ──────────────────────────────────
UPDATE categories SET icon='🍽️' WHERE name='Makan & Minum';
UPDATE categories SET icon='🚗' WHERE name='Transportasi';
UPDATE categories SET icon='🧾' WHERE name='Tagihan';
UPDATE categories SET icon='📚' WHERE name='Pendidikan';
UPDATE categories SET icon='🏥' WHERE name='Kesehatan';
UPDATE categories SET icon='💍' WHERE name='Pernikahan';
UPDATE categories SET icon='🤲' WHERE name='Sedekah/Zakat';
UPDATE categories SET icon='📦' WHERE name='Lain-lain';

-- ── Kategori tambahan (idempotent per nama) ────────────────────
INSERT INTO categories (name, type, color, icon)
SELECT 'Belanja', 'keinginan', '#06b6d4', '🛍️'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Belanja');
INSERT INTO categories (name, type, color, icon)
SELECT 'Kopi & Jajan', 'keinginan', '#a16207', '☕'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Kopi & Jajan');
INSERT INTO categories (name, type, color, icon)
SELECT 'Hiburan', 'keinginan', '#d946ef', '🎬'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Hiburan');
INSERT INTO categories (name, type, color, icon)
SELECT 'Pulsa & Internet', 'kebutuhan', '#2563eb', '📶'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Pulsa & Internet');
INSERT INTO categories (name, type, color, icon)
SELECT 'Rumah / Kos', 'kebutuhan', '#0891b2', '🏠'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Rumah / Kos');
INSERT INTO categories (name, type, color, icon)
SELECT 'Pakaian', 'keinginan', '#db2777', '👕'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Pakaian');
INSERT INTO categories (name, type, color, icon)
SELECT 'Olahraga', 'keinginan', '#16a34a', '🏃'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Olahraga');
INSERT INTO categories (name, type, color, icon)
SELECT 'Hadiah', 'keinginan', '#e11d48', '🎁'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Hadiah');
INSERT INTO categories (name, type, color, icon)
SELECT 'Tabungan / Investasi', 'kebutuhan', '#0e7a55', '🏦'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Tabungan / Investasi');
INSERT INTO categories (name, type, color, icon)
SELECT 'Keluarga & Anak', 'kebutuhan', '#f97316', '🧒'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Keluarga & Anak');

-- ── Setting emas (patokan, bukan tabungan) ─────────────────────
-- gold_premium_pct: estimasi selisih harga retail (Antam/UBS) vs spot pasar.
INSERT OR IGNORE INTO plan_settings (key, value) VALUES ('gold_premium_pct', '12');
