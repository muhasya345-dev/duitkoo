import { Hono } from 'hono'
import type { AppEnv } from '../types'

const plan = new Hono<AppEnv>()

/** GET /api/plan — semua plan_settings sebagai objek { key: value }. */
plan.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT key, value FROM plan_settings').all<{
    key: string
    value: string
  }>()
  const settings: Record<string, string> = {}
  for (const row of results) settings[row.key] = row.value
  return c.json({ settings })
})

/** PUT /api/plan — upsert sebagian/semua key. Body: { settings: { key: value } }. */
plan.put('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const settings = body?.settings
  if (!settings || typeof settings !== 'object') {
    return c.json({ error: 'Body harus { settings: { key: value } }' }, 400)
  }
  const stmts = Object.entries(settings).map(([key, value]) =>
    c.env.DB.prepare(
      `INSERT INTO plan_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    ).bind(String(key), String(value)),
  )
  if (stmts.length) await c.env.DB.batch(stmts)
  return c.json({ ok: true })
})

export default plan
