import { Hono } from 'hono'
import type { AppEnv } from '../types'

const savings = new Hono<AppEnv>()

/** GET /api/savings — daftar catatan saldo nyata (urut tanggal) + saldo terakhir. */
savings.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM savings_log ORDER BY date ASC, id ASC').all()
  const latest = results.length ? (results[results.length - 1] as any) : null
  return c.json({ savings: results, latest })
})

/** POST /api/savings — catat saldo nyata. Body: { date, amount, note }. */
savings.post('/', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as any
  const date = String(b?.date || '').slice(0, 10)
  const amount = Math.round(Number(b?.amount))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({ error: 'Tanggal tidak valid (YYYY-MM-DD)' }, 400)
  if (!Number.isFinite(amount) || amount < 0) return c.json({ error: 'Nominal tidak valid' }, 400)
  const res = await c.env.DB.prepare('INSERT INTO savings_log (date, amount, note) VALUES (?, ?, ?)')
    .bind(date, amount, b?.note ? String(b.note) : null)
    .run()
  return c.json({ ok: true, id: res.meta.last_row_id }, 201)
})

/** DELETE /api/savings/:id */
savings.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const res = await c.env.DB.prepare('DELETE FROM savings_log WHERE id = ?').bind(id).run()
  if (res.meta.changes === 0) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json({ ok: true })
})

export default savings
