'use client'

import { useEffect, useState } from 'react'
import { Check, Coins, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import Select from '@/components/Select'
import { PageLoader } from '@/components/ui'
import { api } from '@/lib/api'
import { parseRupiah, ribuan, rupiah, tanggal } from '@/lib/format'
import type { BudgetItem, Category, GoldPrice, IncomeSource } from '@/lib/types'

const TABS = ['Rencana', 'Penghasilan', 'Emas', 'Anggaran', 'Kategori'] as const
type Tab = (typeof TABS)[number]

export default function PengaturanPage() {
  const [tab, setTab] = useState<Tab>('Rencana')
  return (
    <AppShell>
      <h1 className="text-xl font-extrabold">Pengaturan</h1>
      <div className="sticky top-[57px] z-[5] -mx-4 mt-3 flex gap-1.5 overflow-x-auto bg-ink-50/95 px-4 py-2 backdrop-blur lg:top-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t ? 'bg-brand-600 text-white shadow-glow' : 'bg-white text-ink-500 ring-1 ring-ink-100'
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
const PLAN_FIELDS: { key: string; label: string; type: 'rupiah' | 'text' | 'month' }[] = [
  { key: 'saldo_awal', label: 'Saldo awal', type: 'rupiah' },
  { key: 'target_min', label: 'Target minimum', type: 'rupiah' },
  { key: 'target_max', label: 'Target maksimum', type: 'rupiah' },
  { key: 'target_periode', label: 'Periode target (teks)', type: 'text' },
  { key: 'biaya_hidup_bulanan', label: 'Biaya hidup / bulan', type: 'rupiah' },
  { key: 'proyeksi_mulai', label: 'Proyeksi mulai', type: 'month' },
  { key: 'proyeksi_selesai', label: 'Proyeksi selesai', type: 'month' },
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
          ) : f.type === 'month' ? (
            <input
              type="month"
              className="input"
              value={s[f.key] || ''}
              onChange={(e) => setVal(f.key, e.target.value)}
            />
          ) : (
            <input className="input" value={s[f.key] || ''} onChange={(e) => setVal(f.key, e.target.value)} />
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
            <button onClick={() => remove(i)} className="rounded-xl px-2 text-red-400 hover:bg-red-50">
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

// ── 3. Emas (patokan harga, bukan tabungan) ───────────────────
function GoldSection() {
  const [price, setPrice] = useState<GoldPrice | null>(null)
  const [s, setS] = useState<Record<string, string> | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const saver = useSaver()

  async function load() {
    const [p, plan] = await Promise.all([
      api.get<GoldPrice>('/gold/price'),
      api.get<{ settings: Record<string, string> }>('/plan'),
    ])
    setPrice(p)
    setS(plan.settings)
  }
  useEffect(() => {
    load()
  }, [])
  if (!price || !s) return <PageLoader />

  const setVal = (k: string, v: string) => setS({ ...s, [k]: v })
  const save = () =>
    saver.run(async () => {
      await api.put('/plan', { settings: s })
      await load()
    })

  return (
    <div className="space-y-3">
      {/* Harga live */}
      <div className="card bg-gradient-to-br from-gold-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-white shadow-glow-gold">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Emas murni / gram (pasar)</p>
              <p className="text-2xl font-extrabold text-ink-900">{rupiah(price.spot_per_gram)}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
            className="rounded-xl bg-white p-2.5 text-gold-600 ring-1 ring-gold-100 transition hover:bg-gold-50"
            title="Perbarui harga"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-400">
          Sumber: {price.source} · diperbarui {tanggal(new Date(price.updated_at).toISOString().slice(0, 10))}
          {' · '}estimasi retail {rupiah(price.retail_per_gram)}/gr · patokan mahar {price.mahar_target_gram} gr ≈{' '}
          <b className="text-gold-700">{rupiah(price.mahar_estimate)}</b>
        </p>
      </div>

      {/* Pengaturan patokan */}
      <div className="card space-y-3">
        <div>
          <label className="label">Target mahar (gram)</label>
          <input
            type="number"
            step="0.1"
            className="input"
            value={s['mahar_target_gram'] || ''}
            onChange={(e) => setVal('mahar_target_gram', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Premium retail (%) — selisih Antam/UBS vs pasar</label>
          <input
            type="number"
            step="1"
            className="input"
            value={s['gold_premium_pct'] || ''}
            onChange={(e) => setVal('gold_premium_pct', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Harga manual / gram (cadangan bila pasar gagal)</label>
          <input
            className="input"
            inputMode="numeric"
            value={ribuan(parseRupiah(s['harga_emas_per_gram'] || ''))}
            onChange={(e) => setVal('harga_emas_per_gram', String(parseRupiah(e.target.value)))}
          />
        </div>
        <SaveButton {...saver} onClick={save} />
      </div>
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
            <button onClick={() => remove(i)} className="rounded-xl px-2 text-red-400 hover:bg-red-50">
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

// ── 5. Kategori (dengan emoji) ────────────────────────────────
const EMOJI_PRESET = ['🍽️', '🚗', '🧾', '📚', '🏥', '💍', '🤲', '📦', '🛍️', '☕', '🎬', '📶', '🏠', '👕', '🏃', '🎁', '🏦', '🧒', '⛽', '💊', '🎓', '✈️', '🐾', '💡']

function CategorySection() {
  const [list, setList] = useState<Category[] | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛍️')
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
    await api.post('/categories', { name, color, icon: emoji, type: 'lainnya' })
    setName('')
    setEmoji('🛍️')
    load()
  }
  async function remove(id: number) {
    await api.del(`/categories/${id}`)
    load()
  }

  return (
    <div className="space-y-3">
      {/* Form tambah */}
      <div className="card space-y-3">
        <p className="text-sm font-bold text-ink-700">Tambah kategori</p>
        <div className="flex items-center gap-2">
          <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl text-2xl ring-1 ring-ink-100" style={{ backgroundColor: `${color}1a` }}>
            {emoji}
          </div>
          <input
            className="input flex-1"
            placeholder="Nama kategori baru"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input type="color" className="h-11 w-11 flex-shrink-0 cursor-pointer rounded-xl" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESET.map((em) => (
            <button
              key={em}
              onClick={() => setEmoji(em)}
              className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${
                emoji === em ? 'bg-brand-100 ring-2 ring-brand-400' : 'bg-ink-50 hover:bg-ink-100'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
        <button onClick={add} className="btn-primary w-full">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </button>
      </div>

      {/* Daftar */}
      <div className="card divide-y divide-ink-50">
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl text-lg ring-1 ring-ink-100" style={{ backgroundColor: `${c.color || '#94a3b8'}1a` }}>
                {c.icon || '📦'}
              </span>
              {c.name}
            </span>
            <button onClick={() => remove(c.id)} className="rounded-xl p-2 text-red-400 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
