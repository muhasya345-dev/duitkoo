'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import Select from '@/components/Select'
import { PageLoader } from '@/components/ui'
import { api } from '@/lib/api'
import { parseRupiah, ribuan } from '@/lib/format'
import type { BudgetItem, Category, GoldEntry, IncomeSource } from '@/lib/types'

const TABS = ['Rencana', 'Penghasilan', 'Emas', 'Anggaran', 'Kategori'] as const
type Tab = (typeof TABS)[number]

export default function PengaturanPage() {
  const [tab, setTab] = useState<Tab>('Rencana')
  return (
    <AppShell>
      <h1 className="text-xl font-extrabold">Pengaturan</h1>
      <div className="sticky top-[57px] z-[5] -mx-4 mt-3 flex gap-1 overflow-x-auto bg-slate-50 px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3">
        {tab === 'Rencana' && <PlanSection />}
        {tab === 'Penghasilan' && <IncomeSection />}
        {tab === 'Emas' && <GoldSection />}
        {tab === 'Anggaran' && <BudgetSection />}
        {tab === 'Kategori' && <CategorySection />}
      </div>
    </AppShell>
  )
}

// Tombol simpan dengan indikator status.
function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button className="btn-primary w-full" onClick={onClick} disabled={saving}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Tersimpan</> : 'Simpan'}
    </button>
  )
}

function useSaver() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  async function run(fn: () => Promise<any>) {
    setSaving(true)
    setSaved(false)
    try {
      await fn()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }
  return { saving, saved, run }
}

// ── 1. Asumsi Rencana ─────────────────────────────────────────
const PLAN_FIELDS: { key: string; label: string; type: 'rupiah' | 'text' | 'number' }[] = [
  { key: 'saldo_awal', label: 'Saldo awal', type: 'rupiah' },
  { key: 'target_min', label: 'Target minimum', type: 'rupiah' },
  { key: 'target_max', label: 'Target maksimum', type: 'rupiah' },
  { key: 'target_periode', label: 'Periode target', type: 'text' },
  { key: 'biaya_hidup_bulanan', label: 'Biaya hidup / bulan', type: 'rupiah' },
  { key: 'harga_emas_per_gram', label: 'Harga emas / gram', type: 'rupiah' },
  { key: 'mahar_target_gram', label: 'Target mahar (gram)', type: 'number' },
  { key: 'mahar_cicil_per_bulan_gram', label: 'Cicilan emas (gram/bln)', type: 'number' },
  { key: 'proyeksi_mulai', label: 'Proyeksi mulai (YYYY-MM)', type: 'text' },
  { key: 'proyeksi_selesai', label: 'Proyeksi selesai (YYYY-MM)', type: 'text' },
]

function PlanSection() {
  const [s, setS] = useState<Record<string, string> | null>(null)
  const saver = useSaver()
  useEffect(() => {
    api.get<{ settings: Record<string, string> }>('/plan').then((r) => setS(r.settings))
  }, [])
  if (!s) return <PageLoader />

  const setVal = (k: string, v: string) => setS({ ...s, [k]: v })
  const save = () => saver.run(() => api.put('/plan', { settings: s }))

  return (
    <div className="space-y-3">
      {PLAN_FIELDS.map((f) => (
        <div key={f.key}>
          <label className="label">{f.label}</label>
          {f.type === 'rupiah' ? (
            <input
              className="input"
              inputMode="numeric"
              value={ribuan(parseRupiah(s[f.key] || ''))}
              onChange={(e) => setVal(f.key, String(parseRupiah(e.target.value)))}
            />
          ) : (
            <input
              className="input"
              type={f.type === 'number' ? 'number' : 'text'}
              value={s[f.key] || ''}
              onChange={(e) => setVal(f.key, e.target.value)}
            />
          )}
        </div>
      ))}
      <SaveButton {...saver} onClick={save} />
    </div>
  )
}

// ── 2. Penghasilan ────────────────────────────────────────────
function IncomeSection() {
  const [list, setList] = useState<IncomeSource[] | null>(null)
  const saver = useSaver()
  useEffect(() => {
    api.get<{ income: IncomeSource[] }>('/income').then((r) => setList(r.income))
  }, [])
  if (!list) return <PageLoader />

  const update = (i: number, patch: Partial<IncomeSource>) =>
    setList(list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const remove = (i: number) => setList(list.filter((_, idx) => idx !== i))
  const add = () =>
    setList([...list, { name: '', amount: 0, frequency: 'bulanan', month_pattern: 'tiap bulan' }])
  const save = () => saver.run(() => api.put('/income', { income: list }))

  return (
    <div className="space-y-3">
      {list.map((it, i) => (
        <div key={i} className="card space-y-2">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nama sumber"
              value={it.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <button onClick={() => remove(i)} className="rounded-lg px-2 text-red-400 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input
            className="input"
            inputMode="numeric"
            placeholder="Nominal"
            value={ribuan(it.amount)}
            onChange={(e) => update(i, { amount: parseRupiah(e.target.value) })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={it.frequency}
              onChange={(v) => update(i, { frequency: String(v) })}
              options={[
                { value: 'bulanan', label: 'Bulanan' },
                { value: 'periodik', label: 'Periodik' },
                { value: 'tahunan', label: 'Tahunan' },
              ]}
            />
            <input
              className="input"
              placeholder="tiap bulan / Jul / Des,Jun"
              value={it.month_pattern}
              onChange={(e) => update(i, { month_pattern: e.target.value })}
            />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn-secondary w-full">
        <Plus className="h-4 w-4" /> Tambah Sumber
      </button>
      <SaveButton {...saver} onClick={save} />
    </div>
  )
}

// ── 3. Tabungan Emas ──────────────────────────────────────────
function GoldSection() {
  const [list, setList] = useState<GoldEntry[] | null>(null)
  const saver = useSaver()
  useEffect(() => {
    api.get<{ gold: GoldEntry[] }>('/gold').then((r) => setList(r.gold))
  }, [])
  if (!list) return <PageLoader />

  const update = (i: number, patch: Partial<GoldEntry>) =>
    setList(list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const remove = (i: number) => setList(list.filter((_, idx) => idx !== i))
  const add = () => setList([...list, { month: '', grams: 0, price_per_gram: 2655000 }])
  const save = () => saver.run(() => api.put('/gold', { gold: list }))
  const total = list.reduce((s, g) => s + (Number(g.grams) || 0), 0)

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-gold-50 px-3 py-2 text-sm text-gold-700">
        Total terkumpul: <b>{total.toFixed(2)} gram</b>
      </p>
      {list.map((it, i) => (
        <div key={i} className="card grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <div>
            <label className="label">Bulan</label>
            <input
              className="input"
              placeholder="2026-07"
              value={it.month}
              onChange={(e) => update(i, { month: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Gram</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={it.grams}
              onChange={(e) => update(i, { grams: Number(e.target.value) })}
            />
          </div>
          <button onClick={() => remove(i)} className="mb-2.5 rounded-lg px-2 text-red-400 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="btn-secondary w-full">
        <Plus className="h-4 w-4" /> Tambah Cicilan Emas
      </button>
      <SaveButton {...saver} onClick={save} />
    </div>
  )
}

// ── 4. Anggaran Pernikahan ────────────────────────────────────
function BudgetSection() {
  const [list, setList] = useState<BudgetItem[] | null>(null)
  const saver = useSaver()
  useEffect(() => {
    api.get<{ budget: BudgetItem[] }>('/budget').then((r) => setList(r.budget))
  }, [])
  if (!list) return <PageLoader />

  const update = (i: number, patch: Partial<BudgetItem>) =>
    setList(list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const remove = (i: number) => setList(list.filter((_, idx) => idx !== i))
  const add = () => setList([...list, { item: '', estimated: 0, actual: 0, priority: 'Sedang' }])
  const save = () => saver.run(() => api.put('/budget', { budget: list }))

  return (
    <div className="space-y-3">
      {list.map((it, i) => (
        <div key={i} className="card space-y-2">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Nama pos"
              value={it.item}
              onChange={(e) => update(i, { item: e.target.value })}
            />
            <button onClick={() => remove(i)} className="rounded-lg px-2 text-red-400 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Estimasi</label>
              <input
                className="input"
                inputMode="numeric"
                value={ribuan(it.estimated)}
                onChange={(e) => update(i, { estimated: parseRupiah(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Realisasi</label>
              <input
                className="input"
                inputMode="numeric"
                value={ribuan(it.actual)}
                onChange={(e) => update(i, { actual: parseRupiah(e.target.value) })}
              />
            </div>
          </div>
          <Select
            value={it.priority || 'Sedang'}
            onChange={(v) => update(i, { priority: String(v) })}
            options={['Wajib', 'Penting', 'Tinggi', 'Sedang', 'Rendah'].map((p) => ({ value: p, label: p }))}
          />
        </div>
      ))}
      <button onClick={add} className="btn-secondary w-full">
        <Plus className="h-4 w-4" /> Tambah Pos
      </button>
      <SaveButton {...saver} onClick={save} />
    </div>
  )
}

// ── 5. Kategori ───────────────────────────────────────────────
function CategorySection() {
  const [list, setList] = useState<Category[] | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6b7280')

  async function load() {
    const r = await api.get<{ categories: Category[] }>('/categories')
    setList(r.categories)
  }
  useEffect(() => {
    load()
  }, [])
  if (!list) return <PageLoader />

  async function add() {
    if (!name.trim()) return
    await api.post('/categories', { name, color, type: 'lainnya' })
    setName('')
    load()
  }
  async function remove(id: number) {
    await api.del(`/categories/${id}`)
    load()
  }

  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2">
        <input type="color" className="h-10 w-10 rounded-lg" value={color} onChange={(e) => setColor(e.target.value)} />
        <input
          className="input flex-1"
          placeholder="Nama kategori baru"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={add} className="btn-primary !px-3">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="card divide-y divide-slate-50">
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c.color || '#94a3b8' }} />
              {c.name}
            </span>
            <button onClick={() => remove(c.id)} className="rounded-md p-1 text-red-400 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
