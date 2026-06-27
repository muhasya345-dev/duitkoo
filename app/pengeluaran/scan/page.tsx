'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ImageUp, Loader2, ScanLine, Sparkles } from 'lucide-react'
import AppShell from '@/components/AppShell'
import ExpenseForm from '@/components/ExpenseForm'
import { ErrorBox } from '@/components/ui'
import { api } from '@/lib/api'
import { rupiah } from '@/lib/format'
import { parseReceiptText } from '@/lib/receiptParser'
import type { Category, ReceiptExtraction } from '@/lib/types'

type Phase = 'idle' | 'processing' | 'review' | 'done'

export default function ScanPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [receiptId, setReceiptId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((r) => setCategories(r.categories))
  }, [])

  async function handleFile(file: File) {
    setError('')
    setExtraction(null)
    setReceiptId(null)
    setProgress(0)
    setPreviewUrl(URL.createObjectURL(file))
    setPhase('processing')

    try {
      // 1) Unggah gambar ke R2 (untuk thumbnail & arsip). OCR tetap di browser.
      setStage('Mengunggah struk…')
      const up = await api.upload<{ receipt_id: number }>('/receipts/upload', file)
      setReceiptId(up.receipt_id)

      let result: ReceiptExtraction
      if (file.type === 'application/pdf') {
        // PDF tidak diproses OCR di browser — isi manual.
        result = { merchant: null, date: null, total: null, currency: 'IDR', items: [], category_guess: null }
      } else {
        // 2) OCR GRATIS di browser dengan Tesseract.js (tanpa API berbayar).
        setStage('Membaca teks struk (OCR)…')
        const { default: Tesseract } = await import('tesseract.js')
        const { data } = await Tesseract.recognize(file, 'ind+eng', {
          logger: (m: any) => {
            if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
          },
        })
        // 3) Parse teks mentah → data terstruktur (heuristik struk Indonesia).
        result = parseReceiptText(data.text)
      }

      // 4) Simpan hasil ekstraksi ke receipt (status → done).
      await api.put(`/receipts/${up.receipt_id}`, result).catch(() => {})

      setExtraction(result)
      setPhase('review')
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses struk')
      setPhase('idle')
    }
  }

  function guessCategoryId(): number | null {
    const guess = extraction?.category_guess?.toLowerCase()
    if (!guess) return null
    return categories.find((c) => c.name.toLowerCase() === guess)?.id ?? null
  }

  function reset() {
    setExtraction(null)
    setReceiptId(null)
    setPhase('idle')
    setError('')
    setProgress(0)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <AppShell>
      <h1 className="text-xl font-extrabold">Scan Struk</h1>
      <p className="mt-1 text-sm text-slate-400">
        Foto/unggah struk — teksnya dibaca <b>gratis langsung di HP-mu</b> (tanpa biaya), lalu kamu konfirmasi.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {error && (
        <div className="mt-4">
          <ErrorBox message={error} />
        </div>
      )}

      {/* IDLE */}
      {phase === 'idle' && (
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-5 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 py-12 text-brand-600 transition hover:bg-brand-50"
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white">
            <ScanLine className="h-8 w-8" />
          </div>
          <span className="font-semibold">Ambil / Pilih Foto Struk</span>
          <span className="flex items-center gap-1 text-xs text-brand-500">
            <ImageUp className="h-3.5 w-3.5" /> JPG, PNG, atau PDF (maks 10MB)
          </span>
        </button>
      )}

      {/* PROCESSING */}
      {phase === 'processing' && (
        <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl bg-white py-12 shadow-sm ring-1 ring-slate-100">
          {previewUrl && (
            <img src={previewUrl} alt="struk" className="h-32 w-32 rounded-xl object-cover ring-1 ring-slate-100" />
          )}
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-slate-600">{stage}</p>
          {progress > 0 && (
            <div className="w-48">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-center text-xs text-slate-400">{progress}%</p>
            </div>
          )}
          <p className="px-6 text-center text-[11px] text-slate-400">
            Pertama kali butuh beberapa detik untuk mengunduh mesin OCR. Selanjutnya lebih cepat.
          </p>
        </div>
      )}

      {/* REVIEW */}
      {phase === 'review' && extraction && receiptId && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            {previewUrl && (
              <img src={previewUrl} alt="struk" className="h-28 w-28 rounded-xl object-cover ring-1 ring-slate-100" />
            )}
            <div className="text-sm">
              <p className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                <Sparkles className="h-3.5 w-3.5" /> Hasil pembacaan
              </p>
              {extraction.total || extraction.merchant ? (
                <>
                  <p className="mt-1 font-semibold">{extraction.merchant || 'Merchant tidak terbaca'}</p>
                  <p className="text-slate-500">{extraction.date || 'Tanggal tidak terbaca'}</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-800">{rupiah(extraction.total || 0)}</p>
                </>
              ) : (
                <p className="text-gold-600">
                  Teks struk kurang jelas terbaca. Silakan periksa & isi data di bawah.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <p className="mb-3 text-sm font-bold text-slate-700">Konfirmasi & Simpan</p>
            <ExpenseForm
              categories={categories}
              submitLabel="Simpan Pengeluaran"
              initial={{
                date: extraction.date || undefined,
                amount: extraction.total || 0,
                description: extraction.merchant || '',
                category_id: guessCategoryId(),
                receipt_id: receiptId,
              }}
              onCancel={reset}
              onSaved={() => setPhase('done')}
            />
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl bg-white py-16 shadow-sm ring-1 ring-slate-100">
          <CheckCircle2 className="h-12 w-12 text-brand-500" />
          <p className="font-semibold text-slate-700">Pengeluaran tersimpan!</p>
          <button className="btn-primary mt-2" onClick={reset}>
            <ScanLine className="h-4 w-4" /> Scan Lagi
          </button>
        </div>
      )}
    </AppShell>
  )
}
