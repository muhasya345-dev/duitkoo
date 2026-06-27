'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Wallet,
  ScanLine,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'

const NAV = [
  { href: '/', label: 'Rencana', icon: LayoutDashboard },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Wallet },
  { href: '/pengeluaran/scan', label: 'Scan', icon: ScanLine },
  { href: '/laporan', label: 'Laporan', icon: BarChart3 },
  { href: '/pengaturan', label: 'Atur', icon: Settings },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api
      .get<{ user: { name: string } }>('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => router.replace('/login'))
      .finally(() => setChecking(false))
  }, [router])

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    router.replace('/login')
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-base font-extrabold text-white">
            D
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Duitkoo</p>
            <p className="text-[11px] leading-tight text-slate-400">
              {user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Keuangan'}
            </p>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary !px-3 !py-2" title="Keluar">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="px-4 py-4">{children}</main>

      {/* Bottom nav (mobile-first) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl border-t border-slate-100 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const active =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.4]' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
