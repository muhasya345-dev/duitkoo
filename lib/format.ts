// Helper format Rupiah & tanggal Indonesia untuk seluruh UI.

const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

/** 25000 → "Rp25.000" */
export function rupiah(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return 'Rp0'
  return rupiahFmt.format(Number(n))
}

/** 25000 → "25.000" (tanpa simbol, untuk input) */
export function ribuan(n: number | null | undefined): string {
  if (n == null) return ''
  return new Intl.NumberFormat('id-ID').format(Number(n))
}

/** "Rp 25.000" / "25.000" → 25000 */
export function parseRupiah(s: string): number {
  const digits = (s || '').replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

/** "2026-06-27" → "27 Jun 2026" */
export function tanggal(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return s
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

/** "2026-06" → "Jun 2026" */
export function bulanTahun(s: string): string {
  const [y, m] = s.split('-').map(Number)
  const labels = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${labels[m] || m} ${y}`
}

/** Tanggal hari ini dalam format YYYY-MM-DD (zona lokal). */
export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}
