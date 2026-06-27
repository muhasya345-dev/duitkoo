import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'
import type { AppEnv, JwtPayload } from './types'

export const COOKIE_NAME = 'duitkoo_session'

/**
 * Middleware auth: memverifikasi JWT dari cookie HttpOnly.
 * Dipasang ke semua route /api/* kecuali /api/auth/login.
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, COOKIE_NAME)
  if (!token) {
    return c.json({ error: 'Tidak terautentikasi' }, 401)
  }
  try {
    const payload = (await verify(token, c.env.SESSION_SECRET, 'HS256')) as unknown as JwtPayload
    c.set('user', { nip: payload.sub, name: payload.name })
    await next()
  } catch {
    return c.json({ error: 'Sesi tidak valid atau kedaluwarsa' }, 401)
  }
}

// ── Rate limit sederhana untuk endpoint login ────────────────────
// In-memory per-isolate. Cukup untuk app single-user; bukan pengganti
// rate limiting terdistribusi. Mencegah brute force kasar.
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000 // 15 menit
const MAX_ATTEMPTS = 8

export function checkRateLimit(key: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now()
  const rec = attempts.get(key)
  if (!rec || now > rec.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (rec.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) }
  }
  rec.count++
  return { ok: true }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
