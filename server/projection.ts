// Proyeksi akumulasi tabungan bulanan. Dipakai dashboard & export Excel.
// Murni (tanpa I/O) agar mudah diuji & dipakai ulang.

import type { Env } from './types'

export interface IncomeSource {
  name: string
  amount: number
  frequency: string // 'bulanan' | 'periodik' | 'tahunan'
  month_pattern: string // 'tiap bulan' | 'Jul' | 'Des,Jun' | ...
}

export interface ProjectionMonth {
  month: string // 'YYYY-MM'
  label: string // 'Jul 2026'
  income: number
  living_cost: number
  net: number
  cumulative: number
}

const MONTH_ABBR: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6,
  jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12,
}
const MONTH_LABEL = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Apakah sebuah sumber penghasilan aktif pada bulan tertentu (1-12)? */
function incomeActiveInMonth(src: IncomeSource, month: number): boolean {
  const pattern = (src.month_pattern || '').toLowerCase().trim()
  if (src.frequency === 'bulanan' || pattern.includes('tiap bulan')) return true
  // periodik / tahunan: cocokkan daftar bulan di month_pattern.
  const months = pattern
    .split(/[,/]/)
    .map((s) => MONTH_ABBR[s.trim().slice(0, 3)])
    .filter((m): m is number => !!m)
  return months.includes(month)
}

/**
 * Hitung proyeksi dari saldo awal melintasi rentang bulan (inklusif).
 * @param start 'YYYY-MM' (mis. '2026-07')
 * @param end   'YYYY-MM' (mis. '2027-06')
 */
export function computeProjection(
  saldoAwal: number,
  livingCost: number,
  incomes: IncomeSource[],
  start: string,
  end: string,
): ProjectionMonth[] {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const out: ProjectionMonth[] = []
  let cumulative = saldoAwal
  let y = sy
  let m = sm
  // Batas iterasi agar aman dari input buruk.
  for (let guard = 0; guard < 120; guard++) {
    const income = incomes
      .filter((src) => incomeActiveInMonth(src, m))
      .reduce((s, src) => s + (Number(src.amount) || 0), 0)
    const net = income - livingCost
    cumulative += net
    out.push({
      month: `${y}-${String(m).padStart(2, '0')}`,
      label: `${MONTH_LABEL[m]} ${y}`,
      income,
      living_cost: livingCost,
      net,
      cumulative,
    })
    if (y === ey && m === em) break
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return out
}

/** Ambil data dari D1 lalu hitung proyeksi (dipakai route & export). */
export async function buildProjection(env: Env): Promise<{
  projection: ProjectionMonth[]
  saldoAwal: number
  livingCost: number
  start: string
  end: string
}> {
  const settingsRows = await env.DB.prepare('SELECT key, value FROM plan_settings').all<{
    key: string
    value: string
  }>()
  const s: Record<string, string> = {}
  for (const row of settingsRows.results) s[row.key] = row.value

  const saldoAwal = Number(s['saldo_awal']) || 0
  const livingCost = Number(s['biaya_hidup_bulanan']) || 0
  const start = s['proyeksi_mulai'] || '2026-07'
  const end = s['proyeksi_selesai'] || '2027-06'

  const incomeRows = await env.DB.prepare(
    'SELECT name, amount, frequency, month_pattern FROM income_sources',
  ).all<IncomeSource>()

  const projection = computeProjection(saldoAwal, livingCost, incomeRows.results, start, end)
  return { projection, saldoAwal, livingCost, start, end }
}
