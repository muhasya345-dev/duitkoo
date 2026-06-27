// Parser struk Indonesia berbasis heuristik (tanpa API berbayar).
// Dipakai setelah Tesseract.js menghasilkan teks mentah dari foto struk.
// Tujuan: tebak merchant, tanggal, dan total — lalu user mengoreksi.

import type { ReceiptExtraction } from './types'

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4,
  mei: 5, may: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agt: 8, agustus: 8, aug: 8,
  sep: 9, september: 9, okt: 10, oktober: 10, oct: 10, nov: 11, november: 11,
  des: 12, desember: 12, dec: 12,
}

/** Ubah "25.000" / "Rp 25,000" / "25000" → 25000. Format Indonesia: titik = ribuan. */
function toAmount(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, '').trim()
  if (!s) return null
  // Buang pemisah ribuan (titik atau koma). Karena ini Rupiah tanpa desimal,
  // semua titik/koma dianggap pemisah ribuan.
  s = s.replace(/[.,]/g, '')
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

/** Ambil semua angka Rupiah dari sebuah baris. */
function amountsInLine(line: string): number[] {
  const matches = line.match(/\d[\d.,]*\d|\d/g) || []
  return matches.map(toAmount).filter((n): n is number => n != null && n >= 100)
}

function guessTotal(lines: string[]): number | null {
  const lower = lines.map((l) => l.toLowerCase())
  // Kata kunci total, diurutkan dari paling kuat. Hindari "subtotal" & "sub total".
  const strongKeys = ['grand total', 'total bayar', 'total belanja', 'total harga', 'total']
  const payKeys = ['tunai', 'bayar', 'cash', 'debit', 'kredit', 'qris']

  // 1) Cari baris dengan kata "total" (bukan subtotal) → ambil angka terbesar di situ.
  let best: number | null = null
  for (let i = 0; i < lines.length; i++) {
    const l = lower[i]
    if (l.includes('sub total') || l.includes('subtotal')) continue
    if (strongKeys.some((k) => l.includes(k))) {
      // angka bisa di baris yang sama atau baris berikutnya
      let nums = amountsInLine(lines[i])
      if (nums.length === 0 && i + 1 < lines.length) nums = amountsInLine(lines[i + 1])
      const max = nums.length ? Math.max(...nums) : null
      if (max != null && (best == null || max > best)) best = max
    }
  }
  if (best != null) return best

  // 2) Fallback: baris pembayaran (tunai/bayar).
  for (let i = 0; i < lines.length; i++) {
    if (payKeys.some((k) => lower[i].includes(k))) {
      const nums = amountsInLine(lines[i])
      if (nums.length) return Math.max(...nums)
    }
  }

  // 3) Fallback terakhir: angka terbesar di seluruh struk.
  const all = lines.flatMap(amountsInLine)
  return all.length ? Math.max(...all) : null
}

function guessDate(text: string): string | null {
  // Format numerik: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YY
  const numeric = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (numeric) {
    let [, d, m, y] = numeric
    let year = parseInt(y, 10)
    if (year < 100) year += 2000
    const day = parseInt(d, 10)
    const mon = parseInt(m, 10)
    if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12) {
      return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  // Format teks: "25 Jun 2026" / "25 Juni 2026"
  const textual = text.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (textual) {
    const [, d, monName, y] = textual
    const mon = MONTHS[monName.toLowerCase().slice(0, 3)] || MONTHS[monName.toLowerCase()]
    if (mon) {
      return `${y}-${String(mon).padStart(2, '0')}-${String(parseInt(d, 10)).padStart(2, '0')}`
    }
  }
  return null
}

function guessMerchant(lines: string[]): string | null {
  // Merchant biasanya di baris atas, berupa teks (bukan angka/alamat).
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim()
    if (clean.length < 3) continue
    const letters = (clean.match(/[A-Za-z]/g) || []).length
    const digits = (clean.match(/\d/g) || []).length
    // Lewati baris yang didominasi angka (kemungkinan tanggal/struk no/alamat).
    if (letters >= 3 && letters > digits) {
      return clean.replace(/\s{2,}/g, ' ').slice(0, 60)
    }
  }
  return null
}

/** Tebak kategori dari nama merchant (heuristik sederhana). */
function guessCategory(merchant: string | null, text: string): string | null {
  const hay = `${merchant || ''} ${text}`.toLowerCase()
  if (/(indomaret|alfamart|alfamidi|superindo|hypermart|supermarket|toko|mart)/.test(hay))
    return 'Makan & Minum'
  if (/(spbu|pertamina|shell|bensin|bbm|parkir|tol|grab|gojek|ojek)/.test(hay))
    return 'Transportasi'
  if (/(apotek|apotik|klinik|rumah sakit|farmasi|obat)/.test(hay)) return 'Kesehatan'
  if (/(pln|pdam|wifi|indihome|pulsa|token|listrik)/.test(hay)) return 'Tagihan'
  if (/(restoran|resto|cafe|kopi|warung|bakso|ayam|nasi|food|kfc|mcd)/.test(hay))
    return 'Makan & Minum'
  return null
}

/** Parse teks OCR mentah menjadi ReceiptExtraction. */
export function parseReceiptText(rawText: string): ReceiptExtraction {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const merchant = guessMerchant(lines)
  const total = guessTotal(lines)
  const date = guessDate(rawText)
  const category_guess = guessCategory(merchant, rawText)

  return {
    merchant,
    date,
    total,
    currency: 'IDR',
    items: [], // ekstraksi item per-baris tidak andal dari OCR mentah; diisi manual bila perlu
    category_guess,
  }
}
