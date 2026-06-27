'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/**
 * Month-picker custom (kalender bulan-tahun). Pengganti <input type="month">
 * yang TIDAK didukung Firefox. Nilai berformat 'YYYY-MM'.
 */
export default function MonthPicker({
  value,
  onChange,
  placeholder = 'Pilih bulan',
}: {
  value: string | null | undefined
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState<'down' | 'up'>('down')
  const thisYear = new Date().getFullYear()
  const selY = value && /^\d{4}-\d{2}$/.test(value) ? parseInt(value.slice(0, 4), 10) : null
  const selM = value && /^\d{4}-\d{2}$/.test(value) ? parseInt(value.slice(5, 7), 10) : null
  const [viewYear, setViewYear] = useState(selY ?? thisYear)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    if (selY) setViewYear(selY)
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, selY])

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDrop(window.innerHeight - rect.bottom < 300 ? 'up' : 'down')
    }
    setOpen((v) => !v)
  }

  function pick(month: number) {
    onChange(`${viewYear}-${String(month).padStart(2, '0')}`)
    setOpen(false)
  }

  const label = selY && selM ? `${MONTHS_FULL[selM - 1]} ${selY}` : placeholder

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border bg-surface px-3.5 py-2.5 text-left text-sm transition ${
          open ? 'border-brand-400 ring-4 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        }`}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-ink-400" />
          <span className={selY ? 'text-ink-900' : 'text-ink-400'}>{label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-full min-w-[260px] rounded-2xl border border-ink-100 bg-surface p-3 shadow-card animate-pop-in ${
            drop === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {/* Navigasi tahun */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold text-ink-800">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grid bulan */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS_SHORT.map((m, i) => {
              const active = selY === viewYear && selM === i + 1
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => pick(i + 1)}
                  className={`rounded-xl py-2 text-sm font-semibold transition ${
                    active ? 'bg-brand-600 text-white shadow-glow' : 'text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
