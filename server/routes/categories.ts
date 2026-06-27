import { Hono } from 'hono'
import type { AppEnv } from '../types'

const categories = new Hono<AppEnv>()

/** GET /api/categories — daftar kategori. */
categories.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM categories ORDER BY id').all()
  return c.json({ categories: results })
})

/** POST /api/categories — tambah kategori. */
categories.post('/', async (c) => {
  const b = await c.req.json().catch(() => ({}))
  if (!b?.name) return c.json({ error: 'Nama kategori wajib' }, 400)
  const res = await c.env.DB.prepare(
    'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
  )
    .bind(String(b.name), b.type ? String(b.type) : null, b.color ? String(b.color) : null, b.icon ? String(b.icon) : null)
    .run()
  return c.json({ ok: true, id: res.meta.last_row_id }, 201)
})

/** PUT /api/categories/:id — ubah kategori. */
categories.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const b = await c.req.json().catch(() => ({}))
  if (!b?.name) return c.json({ error: 'Nama kategori wajib' }, 400)
  const res = await c.env.DB.prepare(
    'UPDATE categories SET name=?, type=?, color=?, icon=? WHERE id=?',
  )
    .bind(String(b.name), b.type ? String(b.type) : null, b.color ? String(b.color) : null, b.icon ? String(b.icon) : null, id)
    .run()
  if (res.meta.changes === 0) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json({ ok: true })
})

/** DELETE /api/categories/:id — hapus kategori (pengeluaran terkait jadi tanpa kategori). */
categories.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('UPDATE expenses SET category_id = NULL WHERE category_id = ?').bind(id).run()
  const res = await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  if (res.meta.changes === 0) return c.json({ error: 'Tidak ditemukan' }, 404)
  return c.json({ ok: true })
})

export default categories
