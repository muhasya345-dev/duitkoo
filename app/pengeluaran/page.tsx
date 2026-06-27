'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import Modal, { ConfirmDialog } from '@/components/Modal'
import ExpenseForm, { expenseToForm } from '@/components/ExpenseForm'
import Select from '@/components/Select'
import { PageLoader } from '@/components/ui'
import { api } from '@/lib/api'
import { rupiah, tanggal } from '@/lib/format'
import type { Category, Expense } from '@/lib/types'

export default function PengeluaranPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Filter
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [weddingOnly, setWeddingOnly] = useState(false)
  const [q, setQ] = useState('')

  // Modal & dialog state
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  function buildQuery() {
    const p = new URLSearchParams()
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    if (catFilter) p.set('category_id', catFilter)
    if (weddingOnly) p.set('wedding', '1')
    if (q) p.set('q', q)
    return p.toString()
  }

  async function load() {
    setLoading(true)
    try {
      const qs = buildQuery()
      const res = await api.get<{ expenses: Expense[] }>(`/expenses${qs ? `?${qs}` : ''}`)
      setExpenses(res.expenses)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((r) => setCategories(r.categories))
  }, [])

  // muat ulang saat filter berubah (debounce untuk pencarian)
  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, catFilter, weddingOnly, q])

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  function openAdd() {
    setEditing(null)
    setShowForm(true)
  }
  function openEdit(e: Expense) {
    setEditing(e)
    setShowForm(true)
  }
  async function confirmDelete() {
    if (deleteId == null) return
    await api.del(`/expenses/${deleteId}`)
    setDeleteId(null)
    load()
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Pengeluaran</h1>
        <button className="btn-primary !px-3 !py-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      {/* Filter */}
      <div className="card mt-3 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Cari deskripsi / catatan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={catFilter || null}
            onChange={(v) => setCatFilter(v == null ? '' : String(v))}
            allowEmpty
            emptyLabel="Semua kategori"
            placeholder="Semua kategori"
            options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color, emoji: c.icon }))}
          />
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition ${
              weddingOnly ? 'bg-gold-100 text-gold-700 ring-1 ring-gold-200' : 'bg-ink-50 text-ink-500'
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-gold-500"
              checked={weddingOnly}
              onChange={(e) => setWeddingOnly(e.target.checked)}
            />
            Pernikahan
          </label>
        </div>
      </div>

      {/* Total bar */}
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3.5 text-white shadow-glow">
        <span className="text-sm font-medium text-white/80">{expenses.length} transaksi</span>
        <span className="text-lg font-extrabold tracking-tight">{rupiah(total)}</span>
      </div>

      {/* List */}
      {loading ? (
        <PageLoader />
      ) : expenses.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-400">Belum ada pengeluaran.</p>
      ) : (
        <div className="stagger mt-3 space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="card flex items-center gap-3 !p-3 transition hover:shadow-soft">
              {e.receipt_id ? (
                <img
                  src={`/api/receipts/${e.receipt_id}/image`}
                  alt="struk"
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-1 ring-ink-100"
                />
              ) : (
                <div
                  className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl text-2xl ring-1 ring-ink-100"
                  style={{ backgroundColor: `${e.category_color || '#94a3b8'}1a` }}
                >
                  {e.category_icon || '📦'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-ink-700">
                    {e.description || e.category_name || 'Pengeluaran'}
                  </p>
                  {!!e.is_wedding && (
                    <span className="badge bg-gold-100 text-gold-700">nikah</span>
                  )}
                </div>
                <p className="text-[11px] text-ink-400">
                  {tanggal(e.date)} · {e.category_name || 'Tanpa kategori'} · {e.payment_method || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink-800">{rupiah(e.amount)}</p>
                <div className="mt-1 flex justify-end gap-1">
                  <button onClick={() => openEdit(e)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(e.id)} className="rounded-md p-1 text-red-400 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
      >
        <ExpenseForm
          categories={categories}
          initial={editing ? expenseToForm(editing) : undefined}
          submitLabel={editing ? 'Perbarui' : 'Simpan'}
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            load()
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        title="Hapus pengeluaran?"
        message="Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  )
}
