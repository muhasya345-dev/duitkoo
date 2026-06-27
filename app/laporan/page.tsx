'use client'

import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { CategoryPie, MonthlyBar } from '@/components/Charts'
import { PageLoader, SectionTitle } from '@/components/ui'
import { api, exportUrl } from '@/lib/api'
import { bulanTahun, rupiah } from '@/lib/format'

interface Summary {
  by_category: { category_id: number | null; category_name: string; color?: string | null; total: number; count: number }[]
  by_month: { month: string; total: number }[]
  totals: { total_all: number; wedding_total: number; count: number }
}

export default function LaporanPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Summary>('/reports/summary')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

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
              <p className="text-xs text-slate-400">Total Pengeluaran</p>
              <p className="mt-1 text-lg font-extrabold text-slate-800">{rupiah(data.totals.total_all)}</p>
              <p className="text-[11px] text-slate-400">{data.totals.count} transaksi</p>
            </div>
            <div className="card">
              <p className="text-xs text-slate-400">Untuk Pernikahan</p>
              <p className="mt-1 text-lg font-extrabold text-amber-600">{rupiah(data.totals.wedding_total)}</p>
            </div>
          </div>

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
            <div className="mt-3 divide-y divide-slate-50">
              {data.by_category.map((c) => (
                <div key={c.category_id ?? 'none'} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color || '#94a3b8' }} />
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
      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-200"
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
        <FileSpreadsheet className="h-5 w-5 text-brand-600" />
        {label}
      </span>
      <Download className="h-4 w-4 text-slate-400" />
    </a>
  )
}
