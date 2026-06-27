import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { buildProjection } from '../projection'

const reports = new Hono<AppEnv>()

/** GET /api/reports/projection — proyeksi akumulasi tabungan bulanan. */
reports.get('/projection', async (c) => {
  const { projection, saldoAwal, start, end } = await buildProjection(c.env)
  const final = projection.length ? projection[projection.length - 1].cumulative : saldoAwal
  return c.json({ projection, saldo_awal: saldoAwal, start, end, proyeksi_akhir: final })
})

/** GET /api/reports/summary — rekap per kategori & per bulan (opsional from/to). */
reports.get('/summary', async (c) => {
  const url = new URL(c.req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const where: string[] = []
  const binds: any[] = []
  if (from) {
    where.push('e.date >= ?')
    binds.push(from)
  }
  if (to) {
    where.push('e.date <= ?')
    binds.push(to)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const byCategory = await c.env.DB.prepare(
    `SELECT c.id AS category_id, COALESCE(c.name,'Tanpa Kategori') AS category_name,
            c.color AS color, c.icon AS icon, COALESCE(SUM(e.amount),0) AS total, COUNT(*) AS count
     FROM expenses e LEFT JOIN categories c ON c.id = e.category_id
     ${whereSql}
     GROUP BY e.category_id
     ORDER BY total DESC`,
  )
    .bind(...binds)
    .all()

  const byMonth = await c.env.DB.prepare(
    `SELECT substr(e.date,1,7) AS month, COALESCE(SUM(e.amount),0) AS total
     FROM expenses e ${whereSql}
     GROUP BY month ORDER BY month`,
  )
    .bind(...binds)
    .all()

  const totals = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount),0) AS total_all,
            COALESCE(SUM(CASE WHEN is_wedding=1 THEN amount ELSE 0 END),0) AS wedding_total,
            COUNT(*) AS count
     FROM expenses e ${whereSql}`,
  )
    .bind(...binds)
    .first()

  return c.json({
    by_category: byCategory.results,
    by_month: byMonth.results,
    totals,
  })
})

export default reports
