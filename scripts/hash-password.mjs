#!/usr/bin/env node
// Membuat hash password (PBKDF2-SHA256) memakai Web Crypto — kompatibel dengan
// verifikasi di Cloudflare Workers/Pages Functions (lihat server/crypto.ts).
//
// Pakai:
//   npm run hash-password -- "passwordku"
//   node scripts/hash-password.mjs "passwordku"
//
// Output adalah string lengkap (algo$iter$salt$hash) yang ditaruh ke secret:
//   npx wrangler pages secret put ADMIN_PASSWORD_HASH
// lalu tempel hasilnya saat diminta.

const ITERATIONS = 100000

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password) {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return `pbkdf2$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(bits)}`
}

const password = process.argv[2]
if (!password) {
  console.error('Penggunaan: node scripts/hash-password.mjs "<password>"')
  console.error('Default (single-user): password = NIP = 199911222025051007')
  process.exit(1)
}

const hash = await hashPassword(password)
console.log('\nADMIN_PASSWORD_HASH:\n')
console.log(hash)
console.log('\nSalin string di atas, lalu jalankan:')
console.log('  npx wrangler pages secret put ADMIN_PASSWORD_HASH')
console.log('Untuk lokal, tempel ke .dev.vars sebagai ADMIN_PASSWORD_HASH="..."\n')
