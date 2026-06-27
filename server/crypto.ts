// Hashing & verifikasi password memakai Web Crypto (PBKDF2-SHA256).
// Cloudflare Workers/Pages tidak punya `node:crypto` penuh, jadi memakai
// crypto.subtle yang tersedia di runtime.
//
// Format string tersimpan: `pbkdf2$<iterations>$<saltHex>$<hashHex>`
// (sama persis dengan output scripts/hash-password.mjs).

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function deriveHex(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return bytesToHex(bits)
}

/** Verifikasi password terhadap hash tersimpan; timing-safe compare. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, iterStr, saltHex, hashHex] = stored.split('$')
    if (algo !== 'pbkdf2' || !iterStr || !saltHex || !hashHex) return false
    const iterations = parseInt(iterStr, 10)
    const salt = hexToBytes(saltHex)
    const computed = await deriveHex(password, salt, iterations)
    return timingSafeEqual(computed, hashHex)
  } catch {
    return false
  }
}

/** Perbandingan string hex dengan waktu konstan untuk mencegah timing attack. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
