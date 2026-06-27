// Catch-all Pages Functions: meneruskan SEMUA request /api/* ke app Hono.
// Inilah satu-satunya entry backend — tidak ada Worker terpisah, sehingga
// domain tetap *.pages.dev (frontend & API satu proyek, satu domain).
import { handle } from 'hono/cloudflare-pages'
import app from '../../server/app'

export const onRequest = handle(app)
