// Tipe binding Cloudflare untuk Pages Functions + variabel context Hono.

export interface Env {
  // Bindings (lihat wrangler.toml)
  DB: D1Database
  BUCKET: R2Bucket
  // Secrets (wrangler pages secret put ...)
  ADMIN_NIP: string
  ADMIN_PASSWORD_HASH: string
  SESSION_SECRET: string
}

// Hasil ekstraksi struk terstruktur.
export interface ReceiptExtraction {
  merchant: string | null
  date: string | null // YYYY-MM-DD
  total: number | null // Rupiah integer
  currency: string
  items: { name: string; qty: number; price: number }[]
  category_guess: string | null
}

export interface JwtPayload {
  sub: string // NIP
  name: string
  exp: number
}

// Variabel yang di-set middleware auth ke context Hono.
export type Variables = {
  user: { nip: string; name: string }
}

export type AppEnv = { Bindings: Env; Variables: Variables }
