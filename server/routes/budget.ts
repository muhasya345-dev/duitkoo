import { Hono } from 'hono'
import type { AppEnv } from '../types'

const budget = new Hono<AppEnv>()

/**
 * GET /api/budget — pos anggaran pernikahan (estimasi & realisasi)
 * + total realisasi agregat dari pengeluaran bertanda "pernikahan".
 */
budget.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM wedding_budget ORDER BY id').all()
  const spentRow = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE is_wedding = 1',
  ).first<{ total: number }>()
  return c.json({
    budget: results,
    total_wedding_spent: spentRow?.total ?? 0,
  })
})

/** PUT /api/budget — ganti seluruh pos. Body: { budget: [{item, estimated, actual, priority, note}] }. */
budget.put('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const list = Array.isArray(body?.budget) ? body.budget : null
  if (!list) return c.json({ error: 'Body harus { budget: [...] }' }, 400)

  const stmts = [c.env.DB.prepare('DELETE FROM wedding_budget')]
  for (const item of list) {
    if (!item?.item) continue
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO wedding_budget (item, estimated, actual, priority, note) VALUES (?, ?, ?, ?, ?)`,
      ).bind(
        String(item.item),
        Math.round(Number(item.estimated)) || 0,
        Math.round(Number(item.actual)) || 0,
        item.priority ? String(item.priority) : null,
        item.note ? String(item.note) : null,
      ),
    )
  }
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

export default budget
