#!/usr/bin/env node
// Generate ikon PWA (tema "uang": koin Rupiah + uang kertas) → PNG.
// Jalankan: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')

// Motif uang digambar pada kanvas 512. `maskable` = latar penuh (tanpa sudut
// membulat) & motif diperkecil agar aman di "safe zone" launcher.
function buildSvg({ maskable = false } = {}) {
  const rx = maskable ? 0 : 116
  const scale = maskable ? 0.74 : 0.92 // perkecil motif untuk maskable
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="0.55" stop-color="#0e9f6e"/>
      <stop offset="1" stop-color="#0e7a55"/>
    </linearGradient>
    <linearGradient id="coin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="0.5" stop-color="#fcd34d"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>

  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <!-- Uang kertas (dua lembar, difan di belakang koin) -->
    <g transform="rotate(-15 256 250)">
      <rect x="96" y="196" width="320" height="150" rx="22" fill="#ffffff" opacity="0.5"/>
    </g>
    <g transform="rotate(13 256 250)">
      <rect x="96" y="196" width="320" height="150" rx="22" fill="#ffffff" opacity="0.78"/>
      <rect x="96" y="196" width="320" height="150" rx="22" fill="none" stroke="#0e7a55" stroke-opacity="0.18" stroke-width="4"/>
      <circle cx="256" cy="271" r="34" fill="none" stroke="#0e7a55" stroke-opacity="0.22" stroke-width="5"/>
    </g>

    <!-- Koin Rupiah (hero) -->
    <circle cx="256" cy="286" r="104" fill="#0b6a4a" opacity="0.25"/>
    <circle cx="256" cy="280" r="104" fill="url(#coin)"/>
    <circle cx="256" cy="280" r="104" fill="none" stroke="#ffffff" stroke-width="12"/>
    <circle cx="256" cy="280" r="86" fill="none" stroke="#b45309" stroke-opacity="0.35" stroke-width="5"/>

    <!-- Lambang "Rp" (vektor murni, tanpa font) -->
    <g fill="#0e7a55">
      <!-- R -->
      <path d="M196 232
               h44
               a40 40 0 0 1 0 80
               h-18
               l44 46
               h-40
               l-44 -46
               v46
               h-30
               v-126
               z
               M222 260 v26 h18 a13 13 0 0 0 0 -26 z" fill-rule="evenodd"/>
      <!-- p -->
      <path d="M286 256
               h28
               v8
               a34 34 0 0 1 26 -12
               a44 46 0 0 1 0 92
               a34 34 0 0 1 -26 -12
               v34
               h-28
               z
               M314 286 v44 a20 22 0 0 0 0 -44 z" fill-rule="evenodd"/>
    </g>
  </g>
</svg>`
}

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
  { name: 'favicon-32.png', size: 32, maskable: false },
]

await mkdir(outDir, { recursive: true })
for (const t of targets) {
  const svg = Buffer.from(buildSvg({ maskable: t.maskable }))
  await sharp(svg).resize(t.size, t.size).png().toFile(join(outDir, t.name))
  console.log('✓', t.name)
}
// Simpan juga SVG sumber (berguna untuk favicon vektor).
await writeFile(join(outDir, 'icon.svg'), buildSvg({ maskable: false }))
console.log('✓ icon.svg')
console.log('\nSelesai. Ikon ada di public/icons/')
