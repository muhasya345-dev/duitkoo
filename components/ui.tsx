'use client'

import { Loader2 } from 'lucide-react'

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-16 text-slate-400">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between">
      <h2 className="text-base font-bold text-slate-700">{children}</h2>
      {action}
    </div>
  )
}

export function ProgressBar({
  value,
  max,
  color = 'bg-brand-500',
}: {
  value: number
  max: number
  color?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  accent = 'text-slate-800',
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: string
}) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${accent}`}>{value}</p>
      {sub != null && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{message}</div>
  )
}
