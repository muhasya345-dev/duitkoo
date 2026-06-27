'use client'

import { Loader2 } from 'lucide-react'

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-20 text-brand-500">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h2 className="section-title">
        <span className="h-4 w-1.5 rounded-full bg-gradient-to-b from-brand-400 to-brand-600" />
        {children}
      </h2>
      {action}
    </div>
  )
}

export function ProgressBar({
  value,
  max,
  className = '',
  gradient = 'from-brand-400 to-brand-600',
}: {
  value: number
  max: number
  className?: string
  gradient?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-ink-100 ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  accent = 'text-ink-900',
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: string
}) {
  return (
    <div className="card">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tracking-tight ${accent}`}>{value}</p>
      {sub != null && <p className="mt-0.5 text-xs text-ink-400">{sub}</p>}
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">
      {message}
    </div>
  )
}
