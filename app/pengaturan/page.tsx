'use client'

import { useEffect, useState } from 'react'
import { Check, Coins, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import Select from '@/components/Select'
import MonthPicker from '@/components/MonthPicker'
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
              tab === t ? 'bg-brand-600 text-white shadow-glow' : 'bg-surface text-ink-500 ring-1 ring-ink-100'
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
const PLAN_FIELDS: { key: string; label: string; type: 'rupiah' | 'text' | 'month' | 'date' }[] = [
  { key: 'saldo_awal', label: 'Saldo awal', type: 'rupiah' },
  { key: 'target_min', label: 'Target minimum', type: 'rupiah' },
  { key: 'target_max', label: 'Target maksimum', type: 'rupiah' },
  { key: 'target_date', label: 'Tanggal target nikah', type: 'date' },
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
            <MonthPicker value={s[f.key] || ''} onChange={(v) => setVal(f.key, v)} />
          ) : f.type === 'date' ? (
            <input
              type="date"
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

// Pemilih bulan (multi) untuk penghasilan periodik/tahunan.
const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function MonthMultiSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = new Set(
    (value || '')
      .split(/[,/]/)
      .map((x) => x.trim().toLowerCase().slice(0, 3))
      .filter(Boolean),
  )
  function toggle(m: string) {
    const key = m.toLowerCase().slice(0, 3)
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    // susun ulang dalam urutan kalender
    onChange(MONTHS_ABBR.filter((x) => next.has(x.toLowerCase().slice(0, 3))).join(','))
  }
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {MONTHS_ABBR.map((m) => {
        const on = selected.has(m.toLowerCase().slice(0, 3))
        return (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            className={`rounded-lg py-1.5 text-xs font-semibold transition ${
              on ? 'bg-brand-600 text-white shadow-glow' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            }`}
          >
            {m}
          </button>
        )
      })}
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
          <Select
            value={it.frequency}
            onChange={(v) => {
              const f = String(v)
              // bulanan = otomatis tiap bulan; lainnya = pilih bulan (mulai kosong).
              update(i, {
                frequency: f,
                month_pattern:
                  f === 'bulanan' ? 'tiap bulan' : it.month_pattern === 'tiap bulan' ? '' : it.month_pattern,
              })
            }}
            options={[
              { value: 'bulanan', label: 'Bulanan' },
              { value: 'periodik', label: 'Periodik' },
              { value: 'tahunan', label: 'Tahunan' },
            ]}
          />
          {it.frequency === 'bulanan' ? (
            <p className="rounded-2xl bg-ink-50 px-3 py-2 text-xs text-ink-400">
              Otomatis dihitung <b className="text-ink-600">tiap bulan</b>.
            </p>
          ) : (
            <div>
              <label className="label">Bulan diterima (pilih satu/lebih)</label>
              <MonthMultiSelect value={it.month_pattern} onChange={(v) => update(i, { month_pattern: v })} />
            </div>
          )}
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
      <div className="card bg-gradient-to-br from-gold-50 to-surface dark:from-gold-500/10">
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
            className="rounded-xl bg-surface p-2.5 text-gold-600 ring-1 ring-gold-100 transition hover:bg-gold-50"
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
  const [budget, setBudget] = useState('')

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
    await api.post('/categories', {
      name,
      color,
      icon: emoji,
      type: 'lainnya',
      monthly_budget: parseRupiah(budget),
    })
    setName('')
    setEmoji('🛍️')
    setBudget('')
    load()
  }
  async function remove(id: number) {
    await api.del(`/categories/${id}`)
    load()
  }
  // Simpan budget bulanan kategori (PUT keseluruhan field).
  async function saveBudget(c: Category, value: number) {
    if ((c.monthly_budget || 0) === value) return
    await api.put(`/categories/${c.id}`, {
      name: c.name,
      color: c.color,
      icon: c.icon,
      type: c.type,
      monthly_budget: value,
    })
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
        <div>
          <label className="label">Budget bulanan (opsional)</label>
          <input
            className="input"
            inputMode="numeric"
            placeholder="0 = tanpa batas"
            value={budget}
            onChange={(e) => setBudget(ribuan(parseRupiah(e.target.value)))}
          />
        </div>
        <button onClick={add} className="btn-primary w-full">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </button>
      </div>

      {/* Daftar — atur budget bulanan per kategori */}
      <p className="px-1 text-xs text-ink-400">
        Isi budget bulanan untuk dapat peringatan boros di halaman Laporan.
      </p>
      <div className="card space-y-1 divide-y divide-ink-50">
        {list.map((c) => (
          <div key={c.id} className="flex items-center gap-2 py-2.5">
            <span
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-lg ring-1 ring-ink-100"
              style={{ backgroundColor: `${c.color || '#94a3b8'}1a` }}
            >
              {c.icon || '📦'}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">{c.name}</span>
            <div className="relative w-28 flex-shrink-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
                Rp
              </span>
              <input
                className="input !py-1.5 !pl-7 text-right text-xs"
                inputMode="numeric"
                defaultValue={c.monthly_budget ? ribuan(c.monthly_budget) : ''}
                placeholder="0"
                onBlur={(e) => saveBudget(c, parseRupiah(e.target.value))}
              />
            </div>
            <button onClick={() => remove(c.id)} className="flex-shrink-0 rounded-xl p-2 text-red-400 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
