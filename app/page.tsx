'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  Coins,
  LineChart,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
} from 'lucide-react'
import AppShell from '@/components/AppShell'
import { ProjectionChart } from '@/components/Charts'
import Modal from '@/components/Modal'
import { PageLoader, ProgressBar, SectionTitle, Stat } from '@/components/ui'
import { api } from '@/lib/api'
import { bulanTahun, parseRupiah, ribuan, rupiah, tanggal, todayISO } from '@/lib/format'
import type {
  BudgetItem,
  ChartPoint,
  GoldPrice,
  IncomeSource,
  ProjectionMonth,
  SavingsEntry,
} from '@/lib/types'

interface DashData {
  settings: Record<string, string>
  projection: ProjectionMonth[]
  proyeksiAkhir: number
  gold: GoldPrice
  budget: BudgetItem[]
  weddingSpent: number
  income: IncomeSource[]
  savings: SavingsEntry[]
}

// Hitung sisa waktu ke tanggal target (tahun/bulan/hari).
function computeCountdown(dateStr: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (target <= now) return { totalMonths: 0, text: 'sudah tiba', past: true }
  let y = target.getFullYear() - now.getFullYear()
  let m = target.getMonth() - now.getMonth()
  let dd = target.getDate() - now.getDate()
  if (dd < 0) {
    m--
    dd += new Date(target.getFullYear(), target.getMonth(), 0).getDate()
  }
  if (m < 0) {
    y--
    m += 12
  }
  const parts: string[] = []
  if (y > 0) parts.push(`${y} tahun`)
  parts.push(`${m} bulan`)
  if (dd > 0) parts.push(`${dd} hari`)
  return { totalMonths: y * 12 + m, text: parts.join(' '), past: false }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [plan, proj, gold, bud, inc, sav] = await Promise.all([
      api.get<{ settings: Record<string, string> }>('/plan'),
      api.get<{ projection: ProjectionMonth[]; proyeksi_akhir: number }>('/reports/projection'),
      api.get<GoldPrice>('/gold/price'),
      api.get<{ budget: BudgetItem[]; total_wedding_spent: number }>('/budget'),
      api.get<{ income: IncomeSource[] }>('/income'),
      api.get<{ savings: SavingsEntry[] }>('/savings'),
    ])
    setData({
      settings: plan.settings,
      projection: proj.projection,
      proyeksiAkhir: proj.proyeksi_akhir,
      gold,
      budget: bud.budget,
      weddingSpent: bud.total_wedding_spent,
      income: inc.income,
      savings: sav.savings,
    })
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  return <AppShell>{loading || !data ? <PageLoader /> : <Dashboard d={data} reload={load} />}</AppShell>
}

function Dashboard({ d, reload }: { d: DashData; reload: () => Promise<void> }) {
  const [showSaving, setShowSaving] = useState(false)
  const s = d.settings
  const num = (k: string) => Number(s[k]) || 0
  const targetMin = num('target_min')
  const targetMax = num('target_max')
  const saldoAwal = num('saldo_awal')

  // Label periode target diturunkan dari tanggal nikah (fallback: proyeksi selesai).
  const periodLabel = /^\d{4}-\d{2}-\d{2}$/.test(s['target_date'] || '')
    ? bulanTahun(s['target_date'].slice(0, 7))
    : s['proyeksi_selesai']
      ? bulanTahun(s['proyeksi_selesai'])
      : '—'

  // ── Progres nyata ──────────────────────────────────────────
  const snaps = [...d.savings].sort((a, b) => a.date.localeCompare(b.date))
  const latest = snaps.length ? snaps[snaps.length - 1] : null
  const actualBalance = latest?.amount ?? 0
  const lastSnapMonth = latest ? latest.date.slice(0, 7) : null

  const actualAt = (month: string): number | null => {
    let v: number | null = null
    for (const sp of snaps) {
      if (sp.date.slice(0, 7) <= month) v = sp.amount
      else break
    }
    return v
  }

  // Data grafik: proyeksi (selalu) + aktual (carry-forward s/d snapshot terakhir).
  const chartData: ChartPoint[] = d.projection.map((p) => ({
    label: p.label,
    month: p.month,
    proyeksi: p.cumulative,
    aktual: lastSnapMonth && p.month <= lastSnapMonth ? actualAt(p.month) : null,
  }))

  // Bandingkan aktual vs proyeksi pada bulan snapshot terakhir.
  const proyeksiAtLatest = latest
    ? d.projection.find((p) => p.month === lastSnapMonth)?.cumulative ?? saldoAwal
    : 0
  const selisih = actualBalance - proyeksiAtLatest
  const pctTarget = targetMin > 0 ? Math.round((actualBalance / targetMin) * 100) : 0
  const kurang = Math.max(0, targetMin - actualBalance)

  // ── Countdown nikah + wajib nabung/bulan ───────────────────
  const countdown = computeCountdown(s['target_date'] || '')
  const currentForReq = actualBalance || saldoAwal
  const monthsLeft = Math.max(1, countdown?.totalMonths ?? 1)
  const requiredPerMonth = Math.max(0, Math.ceil((targetMin - currentForReq) / monthsLeft))
  const avgNet = d.projection.length ? Math.round((d.proyeksiAkhir - saldoAwal) / d.projection.length) : 0

  // ── Anggaran pernikahan ────────────────────────────────────
  const totalEstimasi = d.budget.reduce((a, b) => a + (b.estimated || 0), 0)
  const totalRealisasi = d.budget.reduce((a, b) => a + (b.actual || 0), 0)

  return (
    <div className="space-y-2">
      {/* Ringkasan target */}
      <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white ring-0">
        <div className="flex items-center gap-2 text-white/80">
          <Target className="h-4 w-4" />
          <span className="text-sm font-medium">Target Dana Nikah · {periodLabel}</span>
        </div>
        <p className="mt-2 text-3xl font-extrabold">{rupiah(targetMin)}</p>
        <p className="text-sm text-white/70">s/d {rupiah(targetMax)}</p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-white/80">
            <span>Proyeksi akhir: {rupiah(d.proyeksiAkhir)}</span>
            <span>{targetMax > 0 ? Math.round((d.proyeksiAkhir / targetMax) * 100) : 0}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(100, targetMax > 0 ? (d.proyeksiAkhir / targetMax) * 100 : 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Countdown nikah */}
      {countdown && !countdown.past && (
        <div className="card bg-gradient-to-br from-gold-400 to-gold-600 text-white ring-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/90">
              <CalendarClock className="h-4 w-4" />
              <span className="text-sm font-medium">Hitung Mundur Nikah</span>
            </div>
            <span className="text-xs text-white/70">{tanggal(s['target_date'])}</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold">{countdown.text} lagi</p>
          <div className="mt-3 rounded-2xl bg-white/15 px-3.5 py-2.5">
            <p className="text-xs text-white/80">
              Agar capai target {rupiah(targetMin)}, sisihkan minimal
            </p>
            <p className="text-xl font-extrabold">
              {rupiah(requiredPerMonth)} <span className="text-sm font-medium text-white/80">/bulan</span>
            </p>
            <p className="mt-0.5 text-[11px] text-white/80">
              {requiredPerMonth <= avgNet
                ? '✓ masih dalam kapasitas proyeksimu'
                : `perlu ~${rupiah(requiredPerMonth - avgNet)}/bln di atas proyeksi`}
            </p>
          </div>
        </div>
      )}

      {/* Progres NYATA */}
      <SectionTitle
        action={
          <button onClick={() => setShowSaving(true)} className="btn-primary !px-3 !py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Catat saldo
          </button>
        }
      >
        Progres Nyata
      </SectionTitle>
      {latest ? (
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Saldo / tabungan nyata
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-ink-900">{rupiah(actualBalance)}</p>
              <p className="text-[11px] text-ink-400">per {tanggal(latest.date)}</p>
            </div>
            <span
              className={`badge ${selisih >= 0 ? 'bg-brand-100 text-brand-700' : 'bg-gold-100 text-gold-700'}`}
            >
              {selisih >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {selisih >= 0 ? 'di atas' : 'di bawah'} proyeksi
            </span>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-ink-500">{pctTarget}% dari target minimum</span>
              <span className="font-semibold text-ink-700">{rupiah(targetMin)}</span>
            </div>
            <ProgressBar value={actualBalance} max={targetMin} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-ink-50 px-3 py-2">
              <p className="text-[11px] text-ink-400">Selisih vs proyeksi</p>
              <p className={`font-bold ${selisih >= 0 ? 'text-brand-600' : 'text-gold-600'}`}>
                {selisih >= 0 ? '+' : '−'}
                {rupiah(Math.abs(selisih))}
              </p>
            </div>
            <div className="rounded-2xl bg-ink-50 px-3 py-2">
              <p className="text-[11px] text-ink-400">Kurang ke target</p>
              <p className="font-bold text-ink-800">{rupiah(kurang)}</p>
            </div>
          </div>

          {/* Riwayat catatan saldo (+ hapus) */}
          {snaps.length > 0 && (
            <div className="mt-3 border-t border-ink-50 pt-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Riwayat catatan
              </p>
              <div className="divide-y divide-ink-50">
                {[...snaps]
                  .reverse()
                  .slice(0, 6)
                  .map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-ink-500">
                        {tanggal(sp.date)}
                        {sp.note ? <span className="text-ink-400"> · {sp.note}</span> : null}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-ink-700">{rupiah(sp.amount)}</span>
                        <button
                          onClick={async () => {
                            await api.del(`/savings/${sp.id}`)
                            reload()
                          }}
                          className="rounded-md p-1 text-red-400 hover:bg-red-50"
                          title="Hapus catatan ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3 py-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">
            <LineChart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-700">Belum ada catatan saldo</p>
            <p className="text-xs text-ink-400">Catat tabungan nyatamu untuk lihat progres vs proyeksi.</p>
          </div>
          <button onClick={() => setShowSaving(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Catat saldo pertama
          </button>
        </div>
      )}

      {/* Stat ringkas */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Saldo Awal" value={rupiah(saldoAwal)} />
        <Stat
          label="Proyeksi Tabungan"
          value={rupiah(d.proyeksiAkhir)}
          accent="text-brand-600"
          sub={
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> akhir periode
            </span>
          }
        />
      </div>

      {/* Proyeksi cashflow + aktual */}
      <SectionTitle>Akumulasi Tabungan: Proyeksi vs Aktual</SectionTitle>
      <div className="card">
        <ProjectionChart data={chartData} hasActual={snaps.length > 0} />
      </div>

      {/* Patokan harga emas */}
      <SectionTitle>Patokan Harga Emas</SectionTitle>
      <div className="card overflow-hidden bg-gradient-to-br from-gold-50 to-surface dark:from-gold-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-white shadow-glow-gold">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Emas murni / gram</p>
              <p className="text-2xl font-extrabold tracking-tight text-ink-900">
                {rupiah(d.gold.spot_per_gram)}
              </p>
            </div>
          </div>
          <span className="badge bg-gold-100 text-gold-700">
            {d.gold.source === 'pasar' ? '● live pasar' : d.gold.source}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface/70 px-3 py-2.5 ring-1 ring-gold-100">
            <p className="text-[11px] text-ink-400">Estimasi retail (Antam/UBS)</p>
            <p className="text-sm font-bold text-ink-800">{rupiah(d.gold.retail_per_gram)}/gr</p>
            <p className="text-[10px] text-ink-400">+{d.gold.premium_pct}% dari pasar</p>
          </div>
          <div className="rounded-2xl bg-surface/70 px-3 py-2.5 ring-1 ring-gold-100">
            <p className="text-[11px] text-ink-400">Patokan mahar {d.gold.mahar_target_gram} gram</p>
            <p className="text-sm font-bold text-gold-700">{rupiah(d.gold.mahar_estimate)}</p>
            <p className="text-[10px] text-ink-400">untuk anggaran nikah</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-ink-400">
          Diperbarui otomatis {tanggal(new Date(d.gold.updated_at).toISOString().slice(0, 10))} · patokan
          pengeluaran, bukan tabungan.
        </p>
      </div>

      {/* Anggaran pernikahan */}
      <SectionTitle>Anggaran Pernikahan</SectionTitle>
      <div className="card space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">Realisasi vs Estimasi</span>
          <span className="font-semibold">
            {rupiah(totalRealisasi)} / {rupiah(totalEstimasi)}
          </span>
        </div>
        <ProgressBar value={totalRealisasi} max={totalEstimasi} />
        <div className="divide-y divide-ink-50">
          {d.budget.map((b) => {
            const sisa = (b.estimated || 0) - (b.actual || 0)
            return (
              <div key={b.id} className="py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-700">{b.item}</span>
                  <span className="text-xs font-semibold text-ink-500">{rupiah(b.estimated)}</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={b.actual || 0} max={b.estimated || 1} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-ink-400">
                  <span>Realisasi {rupiah(b.actual || 0)}</span>
                  <span>{sisa >= 0 ? `Sisa ${rupiah(sisa)}` : `Lebih ${rupiah(-sisa)}`}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">
          Total pengeluaran bertanda “pernikahan”: <b>{rupiah(d.weddingSpent)}</b>
        </p>
      </div>

      {/* Sumber penghasilan */}
      <SectionTitle>Sumber Penghasilan</SectionTitle>
      <div className="card divide-y divide-ink-50">
        {d.income.map((i) => (
          <div key={i.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-ink-300" />
              <div>
                <p className="text-sm font-medium text-ink-700">{i.name}</p>
                <p className="text-[11px] text-ink-400">
                  {i.frequency} · {i.month_pattern}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-brand-600">{rupiah(i.amount)}</span>
          </div>
        ))}
      </div>

      <Modal open={showSaving} onClose={() => setShowSaving(false)} title="Catat Saldo Nyata">
        <SavingForm
          onSaved={() => {
            setShowSaving(false)
            reload()
          }}
          defaultAmount={actualBalance || saldoAwal}
        />
      </Modal>
    </div>
  )
}

function SavingForm({ onSaved, defaultAmount }: { onSaved: () => void; defaultAmount: number }) {
  const [date, setDate] = useState(todayISO())
  const [amountStr, setAmountStr] = useState(defaultAmount ? ribuan(defaultAmount) : '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseRupiah(amountStr)
    if (amount <= 0) {
      setError('Nominal harus lebih dari 0')
      return
    }
    setSaving(true)
    try {
      await api.post('/savings', { date, amount, note })
      onSaved()
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
        Isi total tabungan/saldo nyatamu saat ini. Catat rutin (mis. tiap akhir bulan) untuk melihat
        progres vs proyeksi.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">Saldo (Rp)</label>
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
        <label className="label">Catatan</label>
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="mis. setelah gajian Juli"
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? 'Menyimpan…' : 'Simpan'}
      </button>
    </form>
  )
}
