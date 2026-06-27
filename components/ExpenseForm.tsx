'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { parseRupiah, ribuan, todayISO } from '@/lib/format'
import type { Category, Expense } from '@/lib/types'
import Select from '@/components/Select'

export interface ExpenseFormValues {
  id?: number
  date: string
  category_id: number | null
  description: string
  amount: number
  payment_method: string
  is_wedding: boolean
  note: string
  receipt_id?: number | null
}

const PAYMENT_METHODS = ['Tunai', 'Transfer', 'QRIS', 'Debit', 'Kartu Kredit', 'E-Wallet']

export default function ExpenseForm({
  categories,
  initial,
  onSaved,
  onCancel,
  submitLabel = 'Simpan',
}: {
  categories: Category[]
  initial?: Partial<ExpenseFormValues>
  onSaved: (id: number) => void
  onCancel?: () => void
  submitLabel?: string
}) {
  const [date, setDate] = useState(initial?.date || todayISO())
  const [categoryId, setCategoryId] = useState<number | null>(initial?.category_id ?? null)
  const [description, setDescription] = useState(initial?.description || '')
  const [amountStr, setAmountStr] = useState(initial?.amount ? ribuan(initial.amount) : '')
  const [paymentMethod, setPaymentMethod] = useState(initial?.payment_method || 'Tunai')
  const [isWedding, setIsWedding] = useState(!!initial?.is_wedding)
  const [note, setNote] = useState(initial?.note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = parseRupiah(amountStr)
    if (amount <= 0) {
      setError('Nominal harus lebih dari 0')
      return
    }
    setSaving(true)
    const payload = {
      date,
      category_id: categoryId,
      description,
      amount,
      payment_method: paymentMethod,
      is_wedding: isWedding,
      note,
      receipt_id: initial?.receipt_id ?? null,
    }
    try {
      if (initial?.id) {
        await api.put(`/expenses/${initial.id}`, payload)
        onSaved(initial.id)
      } else {
        const res = await api.post<{ id: number }>('/expenses', payload)
        onSaved(res.id)
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">Nominal (Rp)</label>
          <input
            className="input"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => setAmountStr(ribuan(parseRupiah(e.target.value)))}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Kategori</label>
        <Select
          value={categoryId}
          onChange={(v) => setCategoryId(v != null ? Number(v) : null)}
          allowEmpty
          emptyLabel="Tanpa kategori"
          placeholder="Pilih kategori"
          options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
        />
      </div>

      <div>
        <label className="label">Deskripsi</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="mis. Belanja Indomaret"
        />
      </div>

      <div>
        <label className="label">Metode Bayar</label>
        <Select
          value={paymentMethod}
          onChange={(v) => setPaymentMethod(String(v))}
          options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
        />
      </div>

      <div>
        <label className="label">Catatan</label>
        <textarea
          className="input min-h-[60px] resize-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Opsional"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 accent-amber-500"
          checked={isWedding}
          onChange={(e) => setIsWedding(e.target.checked)}
        />
        <span className="text-sm font-medium text-amber-700">Tandai untuk pernikahan</span>
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
            Batal
          </button>
        )}
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
        </button>
      </div>
    </form>
  )
}

/** Util kecil untuk konversi Expense (server) → nilai form. */
export function expenseToForm(e: Expense): Partial<ExpenseFormValues> {
  return {
    id: e.id,
    date: e.date,
    category_id: e.category_id,
    description: e.description || '',
    amount: e.amount,
    payment_method: e.payment_method || 'Tunai',
    is_wedding: !!e.is_wedding,
    note: e.note || '',
    receipt_id: e.receipt_id,
  }
}
