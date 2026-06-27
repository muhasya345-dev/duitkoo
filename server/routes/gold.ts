import { Hono } from 'hono'
import type { AppEnv } from '../types'

const gold = new Hono<AppEnv>()

/** GET /api/gold — riwayat tabungan emas per bulan + total gram. */
gold.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM gold_savings ORDER BY month',
  ).all<{ id: number; month: string; grams: number; price_per_gram: number }>()
  const totalGrams = results.reduce((s, r) => s + (Number(r.grams) || 0), 0)
  return c.json({ gold: results, total_grams: totalGrams })
})

/** PUT /api/gold — ganti seluruh riwayat. Body: { gold: [{month, grams, price_per_gram}] }. */
gold.put('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const list = Array.isArray(body?.gold) ? body.gold : null
  if (!list) return c.json({ error: 'Body harus { gold: [...] }' }, 400)

  const stmts = [c.env.DB.prepare('DELETE FROM gold_savings')]
  for (const item of list) {
    const month = String(item?.month || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(month)) continue
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO gold_savings (month, grams, price_per_gram) VALUES (?, ?, ?)`,
      ).bind(month, Number(item.grams) || 0, Math.round(Number(item.price_per_gram)) || 0),
    )
  }
  await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

export default gold
