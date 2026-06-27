'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, User } from 'lucide-react'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/login', { nip, password })
      router.replace('/')
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-3xl font-extrabold">
            D
          </div>
          <h1 className="text-2xl font-extrabold">Duitkoo</h1>
          <p className="text-sm text-white/70">Manajemen Keuangan Pribadi</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">NIP</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="199911222025051007"
                inputMode="numeric"
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className="input pl-9"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Masuk'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-white/50">Akses pribadi — single user</p>
      </div>
    </div>
  )
}
