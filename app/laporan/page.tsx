'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { CategoryPie, MonthlyBar } from '@/components/Charts'
import { PageLoader, ProgressBar, SectionTitle } from '@/components/ui'
import { api, exportUrl } from '@/lib/api'
import { bulanTahun, rupiah, todayISO } from '@/lib/format'
import type { CategoryBudgetStatus } from '@/lib/types'

interface Summary {
  by_category: { category_id: number | null; category_name: string; color?: string | null; icon?: string | null; total: number; count: number }[]
  by_month: { month: string; total: number }[]
  totals: { total_all: number; wedding_total: number; count: number }
}

export default function LaporanPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [budgets, setBudgets] = useState<CategoryBudgetStatus[]>([])
  const [loading, setLoading] = useState(true)
  const thisMonth = todayISO().slice(0, 7)

  useEffect(() => {
    Promise.all([
      api.get<Summary>('/reports/summary'),
      api.get<{ categories: CategoryBudgetStatus[] }>(`/reports/category-budget?month=${thisMonth}`),
    ])
      .then(([sum, bud]) => {
        setData(sum)
        setBudgets(bud.categories)
      })
      .finally(() => setLoading(false))
  }, [thisMonth])

  const monthData = (data?.by_month || []).map((m) => ({ month: bulanTahun(m.month), total: m.total }))

  return (
    <AppShell>
      <h1 className="text-xl font-extrabold">Laporan</h1>

      {loading || !data ? (
        <PageLoader />
      ) : (
        <>
          {/* Ringkasan total */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="card">
              <p className="text-xs text-ink-400">Total Pengeluaran</p>
              <p className="mt-1 text-lg font-extrabold text-ink-800">{rupiah(data.totals.total_all)}</p>
              <p className="text-[11px] text-ink-400">{data.totals.count} transaksi</p>
            </div>
            <div className="card">
              <p className="text-xs text-ink-400">Untuk Pernikahan</p>
              <p className="mt-1 text-lg font-extrabold text-gold-600">{rupiah(data.totals.wedding_total)}</p>
            </div>
          </div>

          {/* Budget bulanan per kategori */}
          {budgets.length > 0 && (
            <>
              <SectionTitle>Budget Bulanan · {bulanTahun(thisMonth)}</SectionTitle>
              <div className="card space-y-3.5">
                {budgets.map((b) => {
                  const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0
                  const over = b.spent > b.budget
                  const warn = pct >= 80 && !over
                  const grad = over
                    ? 'from-red-400 to-red-600'
                    : warn
                      ? 'from-gold-300 to-gold-500'
                      : 'from-brand-400 to-brand-600'
                  return (
                    <div key={b.category_id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="grid h-7 w-7 place-items-center rounded-lg text-base ring-1 ring-ink-100"
                            style={{ backgroundColor: `${b.color || '#94a3b8'}1a` }}
                          >
                            {b.icon || '📦'}
                          </span>
                          <span className="font-medium text-ink-700">{b.name}</span>
                        </span>
                        <span
                          className={`text-xs font-semibold ${over ? 'text-red-600' : warn ? 'text-gold-600' : 'text-ink-500'}`}
                        >
                          {rupiah(b.spent)} / {rupiah(b.budget)}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={b.spent} max={b.budget} gradient={grad} />
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px]">
                        {over ? (
                          <>
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="font-medium text-red-600">
                              Lewat budget {rupiah(b.spent - b.budget)} ({pct}%)
                            </span>
                          </>
                        ) : warn ? (
                          <>
                            <AlertTriangle className="h-3 w-3 text-gold-500" />
                            <span className="font-medium text-gold-600">Hampir habis ({pct}%)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-brand-500" />
                            <span className="text-ink-400">
                              Sisa {rupiah(b.budget - b.spent)} ({pct}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Export */}
          <SectionTitle>Export Excel</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <ExportButton href={exportUrl('/export/expenses.xlsx')} label="Data Pengeluaran" />
            <ExportButton href={exportUrl('/export/report.xlsx')} label="Laporan Bulanan (rekap)" />
            <ExportButton href={exportUrl('/export/plan.xlsx')} label="Rencana & Proyeksi Cashflow" />
          </div>

          {/* Pie per kategori */}
          <SectionTitle>Per Kategori</SectionTitle>
          <div className="card">
            <CategoryPie data={data.by_category} />
            <div className="mt-3 divide-y divide-ink-50">
              {data.by_category.map((c) => (
                <div key={c.category_id ?? 'none'} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg text-base ring-1 ring-ink-100"
                      style={{ backgroundColor: `${c.color || '#94a3b8'}1a` }}
                    >
                      {c.icon || '📦'}
                    </span>
                    {c.category_name}
                  </span>
                  <span className="font-semibold">{rupiah(c.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar per bulan */}
          <SectionTitle>Per Bulan</SectionTitle>
          <div className="card">
            <MonthlyBar data={monthData} />
          </div>
        </>
      )}
    </AppShell>
  )
}

function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-sm ring-1 ring-ink-100 transition hover:ring-brand-200"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
        <FileSpreadsheet className="h-5 w-5 text-brand-600" />
        {label}
      </span>
      <Download className="h-4 w-4 text-ink-400" />
    </a>
  )
}
