import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { setCookie, deleteCookie } from 'hono/cookie'
import type { AppEnv } from '../types'
import { verifyPassword } from '../crypto'
import { COOKIE_NAME, checkRateLimit, resetRateLimit } from '../middleware'

const auth = new Hono<AppEnv>()

const SESSION_TTL_SEC = 60 * 60 * 24 * 7 // 7 hari

/** POST /api/auth/login — verifikasi NIP + password, set cookie JWT. */
auth.post('/login', async (c) => {
  // Kunci rate limit berbasis IP (dari header Cloudflare).
  const ip = c.req.header('CF-Connecting-IP') || 'local'
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    return c.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      429,
    )
  }

  let body: { nip?: string; password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body tidak valid' }, 400)
  }

  const nip = (body.nip || '').trim()
  const password = body.password || ''
  if (!nip || !password) {
    return c.json({ error: 'NIP dan password wajib diisi' }, 400)
  }

  // Verifikasi terhadap secret. Cek NIP & password keduanya.
  const nipOk = nip === c.env.ADMIN_NIP
  const passOk = await verifyPassword(password, c.env.ADMIN_PASSWORD_HASH || '')
  // Jangan bocorkan field mana yang salah.
  if (!nipOk || !passOk) {
    return c.json({ error: 'NIP atau password salah' }, 401)
  }

  resetRateLimit(ip)

  const name = 'Muhammad Sya\'ban Nurul Fuad'
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  const token = await sign({ sub: nip, name, exp }, c.env.SESSION_SECRET)

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  })

  return c.json({ ok: true, user: { nip, name } })
})

/** POST /api/auth/logout — hapus cookie sesi. */
auth.post('/logout', (c) => {
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

/** GET /api/auth/me — info user dari cookie (dijaga authMiddleware). */
auth.get('/me', (c) => {
  const user = c.get('user')
  return c.json({ user })
})

export default auth
