'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  color?: string | null
  emoji?: string | null
  hint?: string
}

/**
 * Dropdown custom (pengganti <select> native) agar:
 *  1. Teks option selalu ter-render di font kita (fix glyph rusak di Windows).
 *  2. Bisa diberi titik warna kategori, animasi, & gaya konsisten.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Pilih…',
  className = '',
  allowEmpty = false,
  emptyLabel = '— Semua —',
}: {
  value: string | number | null | undefined
  onChange: (value: string | number | null) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  allowEmpty?: boolean
  emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState<'down' | 'up'>('down')
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    if (!open) return
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
  }, [open])

  function toggle() {
    // Buka ke atas bila ruang di bawah sempit (mis. dekat bottom nav).
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDrop(window.innerHeight - rect.bottom < 280 ? 'up' : 'down')
    }
    setOpen((v) => !v)
  }

  function pick(v: string | number | null) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border bg-surface px-3.5 py-2.5 text-left text-sm transition ${
          open ? 'border-brand-400 ring-4 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.emoji ? (
            <span className="flex-shrink-0 text-base leading-none">{selected.emoji}</span>
          ) : (
            selected?.color && (
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
            )
          )}
          <span className={`truncate ${selected ? 'text-ink-900' : 'text-ink-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 max-h-64 w-full overflow-y-auto rounded-2xl border border-ink-100 bg-surface p-1.5 shadow-card animate-pop-in ${
            drop === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {allowEmpty && (
            <Item
              active={value == null || value === ''}
              onClick={() => pick(null)}
              label={emptyLabel}
            />
          )}
          {options.map((o) => (
            <Item
              key={o.value}
              active={String(o.value) === String(value)}
              onClick={() => pick(o.value)}
              label={o.label}
              color={o.color}
              emoji={o.emoji}
              hint={o.hint}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Item({
  active,
  onClick,
  label,
  color,
  emoji,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string | null
  emoji?: string | null
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
        active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-700 hover:bg-ink-50'
      }`}
    >
      {emoji ? (
        <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg text-base leading-none" style={{ backgroundColor: color ? `${color}1a` : undefined }}>
          {emoji}
        </span>
      ) : (
        color != null && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
      {active && <Check className="h-4 w-4 flex-shrink-0 text-brand-500" />}
    </button>
  )
}
