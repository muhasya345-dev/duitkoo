'use client'

import { useEffect, useState } from 'react'
import { Gem, Target, TrendingUp, Wallet } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { ProjectionChart } from '@/components/Charts'
import { PageLoader, ProgressBar, SectionTitle, Stat } from '@/components/ui'
import { api } from '@/lib/api'
import { rupiah } from '@/lib/format'
import type { BudgetItem, IncomeSource, ProjectionMonth } from '@/lib/types'

interface DashData {
  settings: Record<string, string>
  projection: ProjectionMonth[]
  proyeksiAkhir: number
  totalGrams: number
  budget: BudgetItem[]
  weddingSpent: number
  income: IncomeSource[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ settings: Record<string, string> }>('/plan'),
      api.get<{ projection: ProjectionMonth[]; proyeksi_akhir: number }>('/reports/projection'),
      api.get<{ total_grams: number }>('/gold'),
      api.get<{ budget: BudgetItem[]; total_wedding_spent: number }>('/budget'),
      api.get<{ income: IncomeSource[] }>('/income'),
    ])
      .then(([plan, proj, gold, bud, inc]) => {
        setData({
          settings: plan.settings,
          projection: proj.projection,
          proyeksiAkhir: proj.proyeksi_akhir,
          totalGrams: gold.total_grams,
          budget: bud.budget,
          weddingSpent: bud.total_wedding_spent,
          income: inc.income,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      {loading || !data ? <PageLoader /> : <Dashboard d={data} />}
    </AppShell>
  )
}

function Dashboard({ d }: { d: DashData }) {
  const s = d.settings
  const num = (k: string) => Number(s[k]) || 0
  const targetMin = num('target_min')
  const targetMax = num('target_max')
  const saldoAwal = num('saldo_awal')

  // Mahar emas
  const maharTargetGram = num('mahar_target_gram')
  const hargaEmas = num('harga_emas_per_gram')
  const nilaiEmas = d.totalGrams * hargaEmas

  // Anggaran pernikahan
  const totalEstimasi = d.budget.reduce((a, b) => a + (b.estimated || 0), 0)
  const totalRealisasi = d.budget.reduce((a, b) => a + (b.actual || 0), 0)

  return (
    <div className="space-y-2">
      {/* Ringkasan target */}
      <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white ring-0">
        <div className="flex items-center gap-2 text-white/80">
          <Target className="h-4 w-4" />
          <span className="text-sm font-medium">Target Dana Nikah · {s['target_periode'] || '—'}</span>
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

      {/* Stat ringkas */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Saldo Awal" value={rupiah(saldoAwal)} accent="text-slate-800" />
        <Stat
          label="Proyeksi Tabungan"
          value={rupiah(d.proyeksiAkhir)}
          accent="text-brand-600"
          sub={<span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> akhir periode</span>}
        />
      </div>

      {/* Proyeksi cashflow */}
      <SectionTitle>Proyeksi Akumulasi Tabungan</SectionTitle>
      <div className="card">
        <ProjectionChart data={d.projection} />
      </div>

      {/* Mahar emas */}
      <SectionTitle>Tracker Mahar Emas</SectionTitle>
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-50 text-gold-500">
              <Gem className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {d.totalGrams.toFixed(1)} / {maharTargetGram} gram
              </p>
              <p className="text-xs text-slate-400">Harga: {rupiah(hargaEmas)}/gram</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Nilai terkumpul</p>
            <p className="text-sm font-bold text-gold-600">{rupiah(nilaiEmas)}</p>
          </div>
        </div>
        <ProgressBar value={d.totalGrams} max={maharTargetGram} gradient="from-gold-300 to-gold-500" />
        <p className="mt-2 text-xs text-slate-400">
          Cicilan: {num('mahar_cicil_per_bulan_gram')} gram/bulan ·{' '}
          {maharTargetGram > 0 ? Math.round((d.totalGrams / maharTargetGram) * 100) : 0}% tercapai
        </p>
      </div>

      {/* Anggaran pernikahan */}
      <SectionTitle>Anggaran Pernikahan</SectionTitle>
      <div className="card space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Realisasi vs Estimasi</span>
          <span className="font-semibold">
            {rupiah(totalRealisasi)} / {rupiah(totalEstimasi)}
          </span>
        </div>
        <ProgressBar value={totalRealisasi} max={totalEstimasi} />
        <div className="divide-y divide-slate-50">
          {d.budget.map((b) => {
            const sisa = (b.estimated || 0) - (b.actual || 0)
            return (
              <div key={b.id} className="py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{b.item}</span>
                  <span className="text-xs font-semibold text-slate-500">{rupiah(b.estimated)}</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={b.actual || 0} max={b.estimated || 1} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>Realisasi {rupiah(b.actual || 0)}</span>
                  <span>{sisa >= 0 ? `Sisa ${rupiah(sisa)}` : `Lebih ${rupiah(-sisa)}`}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-700">
          Total pengeluaran bertanda “pernikahan”: <b>{rupiah(d.weddingSpent)}</b>
        </p>
      </div>

      {/* Sumber penghasilan */}
      <SectionTitle>Sumber Penghasilan</SectionTitle>
      <div className="card divide-y divide-slate-50">
        {d.income.map((i) => (
          <div key={i.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-300" />
              <div>
                <p className="text-sm font-medium text-slate-700">{i.name}</p>
                <p className="text-[11px] text-slate-400">
                  {i.frequency} · {i.month_pattern}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-brand-600">{rupiah(i.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
