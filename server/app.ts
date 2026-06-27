import { Hono } from 'hono'
import type { AppEnv } from './types'
import { authMiddleware } from './middleware'

import auth from './routes/auth'
import expenses from './routes/expenses'
import receipts from './routes/receipts'
import categories from './routes/categories'
import plan from './routes/plan'
import income from './routes/income'
import gold from './routes/gold'
import budget from './routes/budget'
import reports from './routes/reports'
import exportRoute from './routes/export'

// Satu app Hono untuk seluruh API, di-mount sebagai Pages Functions (/api/*).
const app = new Hono<AppEnv>().basePath('/api')

// Route publik (tanpa auth).
const PUBLIC_PATHS = new Set(['/api/auth/login', '/api/auth/logout'])

// Middleware auth global: lindungi semua kecuali route publik.
app.use('*', async (c, next) => {
  if (PUBLIC_PATHS.has(c.req.path)) return next()
  return authMiddleware(c, next)
})

// Pendaftaran route per domain (modular).
app.route('/auth', auth)
app.route('/expenses', expenses)
app.route('/receipts', receipts)
app.route('/categories', categories)
app.route('/plan', plan)
app.route('/income', income)
app.route('/gold', gold)
app.route('/budget', budget)
app.route('/reports', reports)
app.route('/export', exportRoute)

// Penanganan error & not-found seragam (JSON).
app.notFound((c) => c.json({ error: 'Route tidak ditemukan' }, 404))
app.onError((err, c) => {
  console.error('API error:', err)
  return c.json({ error: 'Terjadi kesalahan server' }, 500)
})

export default app
