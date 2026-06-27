import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

// Plus Jakarta Sans — di-self-host oleh next/font (kompatibel static export),
// tanpa request eksternal & tanpa FOUT.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Duitkoo — Manajemen Keuangan',
  description: 'Rencana dana nikah & pencatatan pengeluaran pribadi',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0e7a55',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  )
}
