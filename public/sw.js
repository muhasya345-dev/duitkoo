// Service worker Duitkoo — installability PWA + cache app shell & aset statis.
// Strategi: API tidak pernah di-cache; navigasi = network-first (fallback cache);
// aset statis = cache-first (stale-while-revalidate ringan).

const VERSION = 'duitkoo-v1'
const STATIC_CACHE = `${VERSION}-static`
const PAGES_CACHE = `${VERSION}-pages`

// Halaman inti untuk fallback offline.
const APP_SHELL = ['/', '/login', '/pengeluaran', '/laporan', '/pengaturan']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Hanya tangani origin sendiri.
  if (url.origin !== self.location.origin) return
  // JANGAN cache API (data dinamis + ter-auth).
  if (url.pathname.startsWith('/api/')) return

  // Navigasi halaman → network-first, fallback ke cache lalu ke '/'.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(PAGES_CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/')) || Response.error()),
    )
    return
  }

  // Aset statis (_next/static, ikon, font, gambar) → cache-first.
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
  }
})
