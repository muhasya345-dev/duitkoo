'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-card animate-slide-up sm:rounded-3xl sm:animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Dialog konfirmasi sederhana. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-1 text-sm text-ink-500">{message}</p>
        <div className="mt-4 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onCancel}>
            Batal
          </button>
          <button className="btn-danger flex-1" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
