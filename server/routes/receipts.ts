import { Hono } from 'hono'
import type { AppEnv, ReceiptExtraction } from '../types'

const receipts = new Hono<AppEnv>()

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/receipts/upload — multipart "file".
 * Hanya menyimpan gambar ke R2 + membuat baris receipts(pending) lalu
 * mengembalikan receipt_id. OCR dilakukan GRATIS di browser (Tesseract.js),
 * hasilnya dikirim balik lewat PUT /receipts/:id.
 */
receipts.post('/upload', async (c) => {
  const form = await c.req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return c.json({ error: 'File tidak ditemukan (field "file")' }, 400)
  }
  if (!ALLOWED.includes(file.type)) {
    return c.json({ error: `Tipe file tidak didukung: ${file.type}` }, 400)
  }
  const buf = new Uint8Array(await file.arrayBuffer())
  if (buf.byteLength > MAX_BYTES) {
    return c.json({ error: 'Ukuran file melebihi 10MB' }, 400)
  }

  // Simpan ke R2 dengan key unik.
  const ext = file.name.split('.').pop() || 'bin'
  const key = `receipts/${Date.now()}-${crypto.randomUUID()}.${ext}`
  await c.env.BUCKET.put(key, buf, {
    httpMetadata: { contentType: file.type },
  })

  const ins = await c.env.DB.prepare(
    `INSERT INTO receipts (r2_key, original_filename, ocr_status) VALUES (?, ?, 'pending')`,
  )
    .bind(key, file.name)
    .run()

  return c.json({ ok: true, receipt_id: ins.meta.last_row_id, r2_key: key, status: 'pending' })
})

/**
 * PUT /api/receipts/:id — simpan hasil ekstraksi OCR dari browser.
 * Body: ReceiptExtraction { merchant, date, total, items, ... , raw_text? }.
 */
receipts.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = (await c.req.json().catch(() => ({}))) as Partial<ReceiptExtraction> & {
    raw_text?: string
  }

  const exists = await c.env.DB.prepare('SELECT id FROM receipts WHERE id = ?').bind(id).first()
  if (!exists) return c.json({ error: 'Tidak ditemukan' }, 404)

  const total = body.total != null ? Math.round(Number(body.total)) : null
  const date = body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null

  await c.env.DB.prepare(
    `UPDATE receipts SET ocr_status='done', ocr_raw_json=?, merchant=?, receipt_date=?, total=? WHERE id=?`,
  )
    .bind(JSON.stringify(body), body.merchant ?? null, date, total, id)
    .run()

  // Simpan item bila ada (ganti yang lama).
  await c.env.DB.prepare('DELETE FROM receipt_items WHERE receipt_id = ?').bind(id).run()
  if (Array.isArray(body.items)) {
    for (const it of body.items) {
      if (!it?.name) continue
      await c.env.DB.prepare(
        `INSERT INTO receipt_items (receipt_id, name, qty, price) VALUES (?, ?, ?, ?)`,
      )
        .bind(id, String(it.name), Number(it.qty) || 1, Math.round(Number(it.price)) || 0)
        .run()
    }
  }

  return c.json({ ok: true })
})

/** GET /api/receipts/:id — metadata + item. */
receipts.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const receipt = await c.env.DB.prepare('SELECT * FROM receipts WHERE id = ?').bind(id).first()
  if (!receipt) return c.json({ error: 'Tidak ditemukan' }, 404)
  const { results: items } = await c.env.DB.prepare(
    'SELECT * FROM receipt_items WHERE receipt_id = ?',
  )
    .bind(id)
    .all()
  return c.json({ receipt, items })
})

/** GET /api/receipts/:id/image — stream gambar dari R2 (ter-auth, R2 tidak public). */
receipts.get('/:id/image', async (c) => {
  const id = Number(c.req.param('id'))
  const row = await c.env.DB.prepare('SELECT r2_key FROM receipts WHERE id = ?').bind(id).first<{
    r2_key: string
  }>()
  if (!row) return c.json({ error: 'Tidak ditemukan' }, 404)
  const obj = await c.env.BUCKET.get(row.r2_key)
  if (!obj) return c.json({ error: 'File tidak ada di penyimpanan' }, 404)
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'private, max-age=3600')
  return new Response(obj.body, { headers })
})

export default receipts
