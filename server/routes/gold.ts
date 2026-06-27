import { Hono } from 'hono'
import type { AppEnv, Env } from '../types'

const gold = new Hono<AppEnv>()

const GRAMS_PER_OZ = 31.1035
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // refresh maksimal tiap 6 jam

async function getSettings(env: Env, keys: string[]): Promise<Record<string, string>> {
  const placeholders = keys.map(() => '?').join(',')
  const { results } = await env.DB.prepare(
    `SELECT key, value FROM plan_settings WHERE key IN (${placeholders})`,
  )
    .bind(...keys)
    .all<{ key: string; value: string }>()
  const out: Record<string, string> = {}
  for (const r of results) out[r.key] = r.value
  return out
}

async function setSetting(env: Env, key: string, value: string) {
  await env.DB.prepare(
    `INSERT INTO plan_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
  )
    .bind(key, value)
    .run()
}

/**
 * Ambil harga emas MURNI (spot) per gram dalam Rupiah dari sumber key-free.
 * Primer: goldprice.org (IDR langsung). Fallback: gold-api.com (USD) × kurs.
 */
async function fetchSpotPerGram(): Promise<number | null> {
  // 1) goldprice.org — kembalikan harga per troy ounce dalam IDR.
  try {
    const r = await fetch('https://data-asg.goldprice.org/dbXRates/IDR', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Referer: 'https://goldprice.org/',
        Origin: 'https://goldprice.org',
        'x-requested-with': 'XMLHttpRequest',
      },
    })
    if (r.ok) {
      const d: any = await r.json()
      const oz = d?.items?.[0]?.xauPrice
      if (oz && Number.isFinite(oz)) return Math.round(oz / GRAMS_PER_OZ)
    }
  } catch {
    /* lanjut fallback */
  }
  // 2) gold-api.com (USD/oz) × kurs USD→IDR (open.er-api.com).
  try {
    const [g, fx]: any[] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU').then((r) => r.json()),
      fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()),
    ])
    const usdOz = g?.price
    const idr = fx?.rates?.IDR
    if (usdOz && idr) return Math.round((usdOz * idr) / GRAMS_PER_OZ)
  } catch {
    /* gagal total */
  }
  return null
}

/**
 * GET /api/gold/price — harga emas murni (pasar) per gram + estimasi retail.
 * Di-cache di plan_settings, refresh maksimal tiap 6 jam.
 */
gold.get('/price', async (c) => {
  const now = Date.now()
  const s = await getSettings(c.env, [
    'gold_spot_per_gram',
    'gold_spot_updated_at',
    'gold_premium_pct',
    'harga_emas_per_gram',
    'mahar_target_gram',
  ])

  let perGram = Number(s['gold_spot_per_gram']) || 0
  let updatedAt = Number(s['gold_spot_updated_at']) || 0
  let source = 'cache'
  const fresh = perGram > 0 && now - updatedAt < CACHE_TTL_MS

  if (!fresh) {
    const fetched = await fetchSpotPerGram()
    if (fetched) {
      perGram = fetched
      updatedAt = now
      source = 'pasar'
      await setSetting(c.env, 'gold_spot_per_gram', String(perGram))
      await setSetting(c.env, 'gold_spot_updated_at', String(now))
    } else if (perGram === 0) {
      // Fallback terakhir: harga manual dari pengaturan.
      perGram = Number(s['harga_emas_per_gram']) || 0
      source = 'manual'
    }
  }

  const premium = Number(s['gold_premium_pct']) || 0
  const retailPerGram = Math.round(perGram * (1 + premium / 100))
  const maharGram = Number(s['mahar_target_gram']) || 0

  return c.json({
    spot_per_gram: perGram,
    retail_per_gram: retailPerGram, // estimasi setara Antam/UBS
    premium_pct: premium,
    mahar_target_gram: maharGram,
    mahar_estimate: Math.round(retailPerGram * maharGram),
    updated_at: updatedAt || now,
    source,
  })
})

export default gold
