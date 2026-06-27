import { Hono } from 'hono'
import type { AppEnv } from '../types'

const income = new Hono<AppEnv>()

/** GET /api/income — daftar sumber penghasilan. */
income.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM income_sources ORDER BY id').all()
  return c.json({ income: results })
})

/** PUT /api/income — ganti seluruh daftar. Body: { income: [...] }. */
income.put('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const list = Array.isArray(body?.income) ? body.income : null
  if (!list) return c.json({ error: 'Body harus { income: [...] }' }, 400)

  const stmts = [c.env.DB.prepare('DELETE FROM income_sources')]
  for (const item of list) {
    const amount = Math.round(Number(item?.amount))
    if (!item?.name || !Number.isFinite(amount)) continue
    const freq = item.frequency ? String(item.frequency) : 'bulanan'
    // bulanan selalu 'tiap bulan'; periodik/tahunan simpan bulan terpilih apa adanya.
    const pattern = freq === 'bulanan' ? 'tiap bulan' : item.month_pattern ? String(item.month_pattern) : ''
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO income_sources (name, amount, frequency, month_pattern) VALUES (?, ?, ?, ?)`,
      ).bind(String(item.name), amount, freq, pattern),
    )
  }
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

export default income
