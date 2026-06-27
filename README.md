# Duitkoo — Manajemen Keuangan Pribadi

Aplikasi keuangan pribadi **single-user** untuk Muhammad Sya'ban Nurul Fuad. Dua pilar:

- **Pilar A — Dashboard Rencana Keuangan Pernikahan:** target dana nikah, proyeksi tabungan bulanan, tracker mahar emas, anggaran pernikahan, sumber penghasilan.
- **Pilar B — Pencatatan Pengeluaran:** input manual + **scan struk (OCR otomatis)**, daftar/filter, dan **export Excel**.

## Tech Stack

| Lapis | Teknologi |
|---|---|
| Frontend | Next.js (App Router, TypeScript) — **static export** → Cloudflare Pages |
| API | **Hono** sebagai **Pages Functions** (`functions/api/[[route]].ts`) — domain sama `*.pages.dev` |
| Database | Cloudflare **D1** (SQLite) |
| File | Cloudflare **R2** (gambar struk) |
| OCR | **Tesseract.js** di browser — **gratis**, tanpa API berbayar |
| Styling | Tailwind CSS |
| Export | `xlsx-js-style` (SheetJS + styling) |

> Seluruh aplikasi adalah **satu proyek Cloudflare Pages**. Frontend (static export) dan API (Pages Functions) hidup di domain yang sama `duitkoo.pages.dev`. Tidak ada Worker terpisah dan tidak memakai `@cloudflare/next-on-pages`.

> **OCR gratis tanpa biaya:** scan struk memakai **Tesseract.js** yang berjalan langsung di browser (HP) memakai WebAssembly. Tidak ada panggilan Workers AI / API berbayar — tidak ada biaya per-scan. Gambar tetap disimpan ke R2 untuk arsip/thumbnail, lalu teks dibaca di perangkat dan diparse jadi merchant/tanggal/total untuk kamu konfirmasi.

## Struktur Proyek

```
/
├── app/                    Next.js App Router (static export)
│   ├── page.tsx            Dashboard Rencana (Pilar A)
│   ├── login/              Halaman login
│   ├── pengeluaran/        Daftar + tambah manual
│   ├── pengeluaran/scan/   Upload & OCR struk
│   ├── laporan/            Grafik + export Excel
│   └── pengaturan/         Edit asumsi rencana, penghasilan, emas, anggaran, kategori
├── components/             Komponen UI (AppShell, Charts, ExpenseForm, Modal, ...)
├── lib/                    Helper frontend (api, format, types)
├── functions/api/[[route]].ts   Entry Pages Functions → mount app Hono
├── server/                 App Hono (modular per domain) — di-bundle ke Pages Functions
│   ├── app.ts              Router utama + middleware auth
│   ├── routes/             auth, expenses, receipts, plan, income, gold, budget, categories, reports, export
│   ├── crypto.ts           PBKDF2 (Web Crypto)
│   └── projection.ts       Proyeksi cashflow bulanan
├── lib/receiptParser.ts    Parser teks struk Indonesia (heuristik, client-side)
├── migrations/             File migrasi SQL D1
├── scripts/hash-password.mjs
├── next.config.js          output: 'export', images.unoptimized
└── wrangler.toml           Binding D1, R2, AI
```

---

## Setup Lokal

### 1. Install dependensi
```bash
npm install
```

### 2. Buat secret untuk pengembangan lokal
Salin `.dev.vars.example` → `.dev.vars`, lalu isi. Buat hash password:
```bash
npm run hash-password -- "199911222025051007"
```
Contoh `.dev.vars` siap pakai (password = NIP):
```
ADMIN_NIP="199911222025051007"
ADMIN_PASSWORD_HASH="pbkdf2$100000$37c4a4ef89f64fb8443f0aabcd02a8ee$e6c7272873e5c00103ea059799ac1ee296524657417ddc50ded6d31c0bf8eb97"
SESSION_SECRET="ganti-dengan-string-acak-panjang"
```

### 3. Resource Cloudflare — ✅ SUDAH DIBUAT
Account ID `618e43a561438aab425d674a18b0cf1d`. Sudah dibuat & terisi di `wrangler.toml`:
- D1 `duitkoo-db` (database_id `069b886d-3e61-4498-804b-8f7390431580`)
- R2 bucket `duitkoo-receipts`

Migrasi + seed **sudah dijalankan ke D1 remote**. Untuk emulator lokal:
```bash
npx wrangler d1 migrations apply duitkoo-db --local
```
Yang belum: buat proyek Pages-nya (sekali saja, butuh login kamu):
```bash
npx wrangler pages project create duitkoo      # → duitkoo.pages.dev
```

### 4. Build & jalankan lokal
Static export Next + Pages Functions sekaligus:
```bash
npm run build        # menghasilkan folder out/
npm run pages:dev    # wrangler pages dev (baca output dir & binding D1/R2 dari wrangler.toml)
```
Buka `http://localhost:8788`. Login dengan NIP `199911222025051007` dan password yang kamu hash di langkah 2.

> Untuk hot-reload UI saja (tanpa API), `npm run dev` di port 3000. Tapi API hanya hidup lewat `wrangler pages dev`.

---

## Deploy ke Cloudflare Pages (`*.pages.dev`)

### Opsi A — CI/CD via GitHub (disarankan)
1. Push repo ke GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pilih repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `out`
4. Dashboard Pages → **Settings → Functions → Bindings**: tambahkan
   - D1 database → variabel `DB` → `duitkoo-db`
   - R2 bucket → variabel `BUCKET` → `duitkoo-receipts`
   - (tidak perlu Workers AI — OCR gratis di browser)
5. Dashboard Pages → **Settings → Environment variables / Secrets**, atau via CLI:
   ```bash
   npx wrangler pages secret put ADMIN_NIP
   npx wrangler pages secret put ADMIN_PASSWORD_HASH
   npx wrangler pages secret put SESSION_SECRET
   ```
6. Jalankan migrasi ke D1 produksi: `npx wrangler d1 migrations apply duitkoo-db --remote`.
7. Setiap `git push` ke `main` → otomatis build & deploy ke `duitkoo.pages.dev` (plus preview URL per branch).

### Opsi B — Deploy langsung dari lokal
```bash
npm run build
npx wrangler pages deploy out
```

---

## Checklist Deploy
- [x] `npm install`
- [x] ~~`wrangler d1 create duitkoo-db`~~ → sudah, `database_id` terisi di `wrangler.toml`
- [x] ~~`wrangler r2 bucket create duitkoo-receipts`~~ → sudah
- [x] ~~`wrangler d1 migrations apply duitkoo-db --remote`~~ → sudah (schema + seed)
- [ ] `wrangler pages project create duitkoo` (butuh login kamu)
- [ ] Pasang binding **DB / BUCKET** di proyek Pages (tidak perlu AI)
- [ ] `npm run hash-password -- "<password>"` → set secret `ADMIN_PASSWORD_HASH`
- [ ] Set secret `ADMIN_NIP` & `SESSION_SECRET`
- [ ] `npm run build` lalu deploy (GitHub CI atau `wrangler pages deploy out`)
- [ ] Login & cek dashboard

---

## Keamanan
- Tidak ada password plaintext di repo — disimpan sebagai **Cloudflare Secret** (hash PBKDF2-SHA256).
- JWT di **cookie HttpOnly, Secure, SameSite=Lax**; seluruh `/api/*` dijaga middleware (kecuali login).
- **Rate limit** pada endpoint login.
- Query D1 memakai **prepared statement** (parameterized) → cegah SQL injection.
- Objek **R2 tidak public** — gambar struk hanya via endpoint ter-auth `/api/receipts/:id/image`.
- `.env`, `.dev.vars`, secret → `.gitignore`.

> Catatan: default password = NIP (lemah). Karena memakai hash + secret, kamu bisa ganti ke password lebih kuat **tanpa ubah kode** — cukup `npm run hash-password -- "<baru>"` lalu `wrangler pages secret put ADMIN_PASSWORD_HASH`.

## Endpoint API (ringkas)
`POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
`GET/POST /api/expenses` · `GET/PUT/DELETE /api/expenses/:id`
`POST /api/receipts/upload` · `GET /api/receipts/:id` · `GET /api/receipts/:id/image`
`GET /api/categories` (+POST/PUT/DELETE)
`GET/PUT /api/plan` · `GET/PUT /api/income` · `GET/PUT /api/gold` · `GET/PUT /api/budget`
`GET /api/reports/summary` · `GET /api/reports/projection`
`GET /api/export/expenses.xlsx` · `GET /api/export/report.xlsx` · `GET /api/export/plan.xlsx`

## Catatan OCR (GRATIS, tanpa API berbayar)
- OCR memakai **Tesseract.js** (`ind+eng`) yang berjalan **di browser** memakai WebAssembly. Tidak ada panggilan ke Workers AI / API berbayar → **tidak ada biaya per-scan**.
- Alur: foto/unggah → gambar disimpan ke R2 (arsip) → teks dibaca di perangkat → `lib/receiptParser.ts` menebak `{ merchant, date, total, category_guess }` (heuristik struk Indonesia: total vs subtotal, format tanggal, merchant umum) → **dikonfirmasi user** sebelum jadi pengeluaran.
- Saat pertama kali, mesin OCR + data bahasa (~beberapa MB) diunduh dari CDN lalu di-cache; scan berikutnya lebih cepat.
- PDF tidak di-OCR (diisi manual). Gambar (JPG/PNG/WebP) didukung penuh.
