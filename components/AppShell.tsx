'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  LayoutDashboard,
  Loader2,
  LogOut,
  ScanLine,
  Settings,
  Wallet,
} from 'lucide-react'
import { api } from '@/lib/api'
import ThemeToggle from '@/components/ThemeToggle'

const NAV = [
  { href: '/', label: 'Rencana', icon: LayoutDashboard },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: Wallet },
  { href: '/pengeluaran/scan', label: 'Scan', icon: ScanLine },
  { href: '/laporan', label: 'Laporan', icon: BarChart3 },
  { href: '/pengaturan', label: 'Atur', icon: Settings },
]

function useActive() {
  const pathname = usePathname()
  return (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/pengeluaran') return pathname === '/pengeluaran'
    return pathname.startsWith(href)
  }
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`grid place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-extrabold text-white shadow-glow ${
          small ? 'h-9 w-9 text-base' : 'h-11 w-11 text-lg'
        }`}
      >
        D
      </div>
      <div className="leading-tight">
        <p className={`font-extrabold tracking-tight ${small ? 'text-sm' : 'text-base'}`}>Duitkoo</p>
        <p className="text-[11px] text-ink-400">Manajemen Keuangan</p>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isActive = useActive()
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
      <div className="flex min-h-screen items-center justify-center text-brand-500">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    )
  }

  const firstName = user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Pengguna'

  return (
    <div className="min-h-screen">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-100 bg-surface/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${active ? '' : 'text-ink-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-4 rounded-2xl bg-ink-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
              {firstName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink-700">{firstName}</p>
              <p className="text-[10px] text-ink-400">Akun pribadi</p>
            </div>
            <ThemeToggle className="!bg-transparent !p-2" />
            <button onClick={logout} className="rounded-xl p-2 text-ink-400 transition hover:bg-surface hover:text-red-500" title="Keluar">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Header (mobile) ===== */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-surface/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo small />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={logout} className="rounded-xl bg-ink-100 p-2.5 text-ink-500 transition active:scale-95" title="Keluar">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ===== Konten ===== */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 lg:px-8 lg:pb-12 lg:pt-10">{children}</div>
      </main>

      {/* ===== Bottom nav (mobile) ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold"
              >
                {active && <span className="absolute top-0 h-1 w-8 rounded-full bg-brand-500" />}
                <span
                  className={`grid h-9 w-9 place-items-center rounded-2xl transition-all ${
                    active ? 'bg-brand-50 text-brand-600' : 'text-ink-400'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? 'stroke-[2.4]' : ''}`} />
                </span>
                <span className={active ? 'text-brand-600' : 'text-ink-400'}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
