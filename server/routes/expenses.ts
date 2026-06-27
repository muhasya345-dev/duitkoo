import { Hono } from 'hono'
import type { AppEnv } from '../types'

const expenses = new Hono<AppEnv>()

// Validasi & normalisasi payload pengeluaran.
function parseExpenseBody(b: any) {
  const date = String(b?.date || '').slice(0, 10)
  const amount = Math.round(Number(b?.amount))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Tanggal tidak valid (YYYY-MM-DD)' }
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Nominal tidak valid' }
  return {
    value: {
      date,
      category_id: b?.category_id != null ? Number(b.category_id) : null,
      description: b?.description ? String(b.description) : null,
      amount,
      payment_method: b?.payment_method ? String(b.payment_method) : null,
      is_wedding: b?.is_wedding ? 1 : 0,
      receipt_id: b?.receipt_id != null ? Number(b.receipt_id) : null,
      note: b?.note ? String(b.note) : null,
    },
  }
}

/** GET /api/expenses — daftar dengan filter (from, to, category_id, wedding, q). */
expenses.get('/', async (c) => {
  const url = new URL(c.req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const categoryId = url.searchParams.get('category_id')
  const wedding = url.searchParams.get('wedding')
  const q = url.searchParams.get('q')

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
  if (categoryId) {
    where.push('e.category_id = ?')
    binds.push(Number(categoryId))
  }
  if (wedding === '1') {
    where.push('e.is_wedding = 1')
  }
  if (q) {
    where.push('(e.description LIKE ? OR e.note LIKE ?)')
    binds.push(`%${q}%`, `%${q}%`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const sql = `
    SELECT e.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
           r.r2_key AS receipt_key
    FROM expenses e
    LEFT JOIN categories c ON c.id = e.category_id
    LEFT JOIN receipts r ON r.id = e.receipt_id
    ${whereSql}
    ORDER BY e.date DESC, e.id DESC
    LIMIT 1000`
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json({ expenses: results })
})

/** POST /api/expenses — buat pengeluaran baru. */
expenses.post('/', async (c) => {
  const parsed = parseExpenseBody(await c.req.json().catch(() => ({})))
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const v = parsed.value
  const res = await c.env.DB.prepare(
    `INSERT INTO expenses (date, category_id, description, amount, payment_method, is_wedding, receipt_id, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(v.date, v.category_id, v.description, v.amount, v.payment_method, v.is_wedding, v.receipt_id, v.note)
    .run()
  return c.json({ ok: true, id: res.meta.last_row_id }, 201)
})

/** GET /api/expenses/:id */
expenses.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const row = await c.env.DB.prepare('SELECT * FROM expenses WHERE id = ?').bind(id).first()
  if (!row) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json({ expense: row })
})

/** PUT /api/expenses/:id */
expenses.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const parsed = parseExpenseBody(await c.req.json().catch(() => ({})))
  if ('error' in parsed) return c.json({ error: parsed.error }, 400)
  const v = parsed.value
  const res = await c.env.DB.prepare(
    `UPDATE expenses SET date=?, category_id=?, description=?, amount=?, payment_method=?, is_wedding=?, receipt_id=?, note=?
     WHERE id=?`,
  )
    .bind(v.date, v.category_id, v.description, v.amount, v.payment_method, v.is_wedding, v.receipt_id, v.note, id)
    .run()
  if (res.meta.changes === 0) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json({ ok: true })
})

/** DELETE /api/expenses/:id */
expenses.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const res = await c.env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(id).run()
  if (res.meta.changes === 0) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json({ ok: true })
})

export default expenses
