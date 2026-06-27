'use client'

import { useEffect } from 'react'

/**
 * Mendaftarkan service worker (/sw.js) agar aplikasi bisa di-install (PWA)
 * & punya cache app shell. Hanya jalan di production (https/localhost).
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* abaikan: SW opsional, app tetap jalan tanpa offline */
      })
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
