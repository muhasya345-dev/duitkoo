'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/** Tombol ganti tema (light/dark). Preferensi disimpan di localStorage. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* abaikan */
    }
  }

  return (
    <button
      onClick={toggle}
      className={`grid place-items-center rounded-xl bg-ink-100 p-2.5 text-ink-500 transition active:scale-95 hover:text-ink-800 ${className}`}
      title={dark ? 'Mode terang' : 'Mode gelap'}
      aria-label="Ganti tema"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
