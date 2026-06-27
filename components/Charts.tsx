'use client'

import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { rupiah } from '@/lib/format'
import type { ProjectionMonth } from '@/lib/types'

// Hindari render chart saat prerender build (recharts butuh DOM).
function useMounted() {
  const [m, setM] = useState(false)
  useEffect(() => setM(true), [])
  return m
}

const juta = (v: number) => `${Math.round(v / 1_000_000)}jt`

export function ProjectionChart({ data }: { data: ProjectionMonth[] }) {
  const mounted = useMounted()
  if (!mounted) return <div className="h-56" />
  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e9f6e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0e9f6e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.split(' ')[0]} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={juta} width={36} />
        <Tooltip
          formatter={(v: any) => rupiah(Number(v))}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
        />
        <Area type="monotone" dataKey="cumulative" name="Akumulasi" stroke="#0e9f6e" strokeWidth={2} fill="url(#grad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function CategoryPie({
  data,
}: {
  data: { category_name: string; total: number; color?: string | null }[]
}) {
  const mounted = useMounted()
  const palette = ['#0e9f6e', '#34d399', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#6b7280']
  if (!mounted) return <div className="h-56" />
  if (!data.length) return <p className="py-10 text-center text-sm text-slate-400">Belum ada data</p>
  return (
    <ResponsiveContainer width="100%" height={224}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category_name" cx="50%" cy="50%" innerRadius={48} outerRadius={84} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: any) => rupiah(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyBar({ data }: { data: { month: string; total: number }[] }) {
  const mounted = useMounted()
  if (!mounted) return <div className="h-56" />
  if (!data.length) return <p className="py-10 text-center text-sm text-slate-400">Belum ada data</p>
  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={juta} width={36} />
        <Tooltip formatter={(v: any) => rupiah(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="total" name="Total" fill="#0e9f6e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
