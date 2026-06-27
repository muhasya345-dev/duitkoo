import { Hono } from 'hono'
// xlsx-js-style: fork SheetJS yang mendukung styling (header tebal) & jalan di Workers.
import * as XLSX from 'xlsx-js-style'
import type { AppEnv } from '../types'
import { buildProjection } from '../projection'

const exportRoute = new Hono<AppEnv>()

const RP_FMT = '"Rp"#,##0'
const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FF1B5A35' } },
  alignment: { horizontal: 'center', vertical: 'center' },
}

type Cell = { v: any; t?: string; z?: string; s?: any }

/** Bangun worksheet dari header + baris sel; header otomatis dibuat tebal. */
function makeSheet(headers: string[], rows: Cell[][], widths?: number[]) {
  const aoa: Cell[][] = [
    headers.map((h) => ({ v: h, t: 's', s: HEADER_STYLE })),
    ...rows,
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa.map((r) => r.map((c) => c.v)))
  // Terapkan tipe, format angka, & style per sel.
  for (let r = 0; r < aoa.length; r++) {
    for (let col = 0; col < aoa[r].length; col++) {
      const addr = XLSX.utils.encode_cell({ r, c: col })
      const cell = aoa[r][col]
      if (!ws[addr]) ws[addr] = { v: cell.v }
      if (cell.t) ws[addr].t = cell.t
      if (cell.z) ws[addr].z = cell.z
      if (cell.s) ws[addr].s = cell.s
    }
  }
  if (widths) ws['!cols'] = widths.map((w) => ({ wch: w }))
  return ws
}

function rp(v: number): Cell {
  return { v: Number(v) || 0, t: 'n', z: RP_FMT }
}
function txt(v: any): Cell {
  return { v: v == null ? '' : String(v), t: 's' }
}

function workbookToResponse(wb: XLSX.WorkBook, filename: string): Response {
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

/** GET /api/export/expenses.xlsx — daftar pengeluaran sesuai filter aktif. */
exportRoute.get('/expenses.xlsx', async (c) => {
  const url = new URL(c.req.url)
  const where: string[] = []
  const binds: any[] = []
  const addFilter = (param: string, sql: string) => {
    const v = url.searchParams.get(param)
    if (v) {
      where.push(sql)
      binds.push(v)
    }
  }
  addFilter('from', 'e.date >= ?')
  addFilter('to', 'e.date <= ?')
  addFilter('category_id', 'e.category_id = ?')
  if (url.searchParams.get('wedding') === '1') where.push('e.is_wedding = 1')
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const { results } = await c.env.DB.prepare(
    `SELECT e.date, c.name AS category, e.description, e.amount, e.payment_method, e.is_wedding, e.note
     FROM expenses e LEFT JOIN categories c ON c.id = e.category_id
     ${whereSql} ORDER BY e.date DESC, e.id DESC`,
  )
    .bind(...binds)
    .all<any>()

  const rows: Cell[][] = results.map((r) => [
    txt(r.date),
    txt(r.category ?? 'Tanpa Kategori'),
    txt(r.description),
    rp(r.amount),
    txt(r.payment_method),
    txt(r.is_wedding ? 'Ya' : '—'),
    txt(r.note),
  ])
  // Baris total.
  const total = results.reduce((s, r) => s + (r.amount || 0), 0)
  rows.push([txt(''), txt(''), { v: 'TOTAL', t: 's', s: { font: { bold: true } } }, rp(total), txt(''), txt(''), txt('')])

  const ws = makeSheet(
    ['Tanggal', 'Kategori', 'Deskripsi', 'Nominal', 'Metode', 'Pernikahan', 'Catatan'],
    rows,
    [12, 18, 30, 16, 14, 12, 24],
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran')
  return workbookToResponse(wb, 'pengeluaran.xlsx')
})

/** GET /api/export/report.xlsx — rekap per kategori & per bulan. */
exportRoute.get('/report.xlsx', async (c) => {
  const byCat = await c.env.DB.prepare(
    `SELECT COALESCE(c.name,'Tanpa Kategori') AS category, COALESCE(SUM(e.amount),0) AS total, COUNT(*) AS count
     FROM expenses e LEFT JOIN categories c ON c.id = e.category_id
     GROUP BY e.category_id ORDER BY total DESC`,
  ).all<any>()
  const byMonth = await c.env.DB.prepare(
    `SELECT substr(date,1,7) AS month, COALESCE(SUM(amount),0) AS total FROM expenses GROUP BY month ORDER BY month`,
  ).all<any>()

  const wb = XLSX.utils.book_new()

  const catRows: Cell[][] = byCat.results.map((r) => [txt(r.category), { v: r.count, t: 'n' }, rp(r.total)])
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(['Kategori', 'Jumlah Transaksi', 'Total'], catRows, [22, 18, 16]),
    'Per Kategori',
  )

  const monthRows: Cell[][] = byMonth.results.map((r) => [txt(r.month), rp(r.total)])
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(['Bulan', 'Total'], monthRows, [14, 16]),
    'Per Bulan',
  )

  return workbookToResponse(wb, 'laporan-pengeluaran.xlsx')
})

/** GET /api/export/plan.xlsx — proyeksi cashflow + anggaran pernikahan. */
exportRoute.get('/plan.xlsx', async (c) => {
  const { projection } = await buildProjection(c.env)
  const wb = XLSX.utils.book_new()

  // Sheet proyeksi.
  const projRows: Cell[][] = projection.map((p) => [
    txt(p.label),
    rp(p.income),
    rp(p.living_cost),
    rp(p.net),
    rp(p.cumulative),
  ])
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ['Bulan', 'Penghasilan', 'Biaya Hidup', 'Bersih', 'Akumulasi Tabungan'],
      projRows,
      [12, 16, 16, 16, 20],
    ),
    'Proyeksi Cashflow',
  )

  // Sheet anggaran pernikahan.
  const { results: budget } = await c.env.DB.prepare(
    'SELECT item, estimated, actual, priority FROM wedding_budget ORDER BY id',
  ).all<any>()
  const budRows: Cell[][] = budget.map((b) => [
    txt(b.item),
    rp(b.estimated),
    rp(b.actual),
    rp((b.estimated || 0) - (b.actual || 0)),
    txt(b.priority),
  ])
  const totEst = budget.reduce((s, b) => s + (b.estimated || 0), 0)
  const totAct = budget.reduce((s, b) => s + (b.actual || 0), 0)
  budRows.push([
    { v: 'TOTAL', t: 's', s: { font: { bold: true } } },
    rp(totEst),
    rp(totAct),
    rp(totEst - totAct),
    txt(''),
  ])
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(['Pos', 'Estimasi', 'Realisasi', 'Sisa', 'Prioritas'], budRows, [30, 16, 16, 16, 12]),
    'Anggaran Pernikahan',
  )

  // Sheet penghasilan.
  const { results: income } = await c.env.DB.prepare(
    'SELECT name, amount, frequency, month_pattern FROM income_sources',
  ).all<any>()
  const incRows: Cell[][] = income.map((i) => [txt(i.name), rp(i.amount), txt(i.frequency), txt(i.month_pattern)])
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(['Sumber', 'Nominal', 'Frekuensi', 'Pola Bulan'], incRows, [28, 16, 14, 18]),
    'Penghasilan',
  )

  return workbookToResponse(wb, 'rencana-keuangan.xlsx')
})

export default exportRoute
