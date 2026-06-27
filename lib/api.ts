// Klien fetch tipis untuk API same-origin (/api/*). Cookie dikirim otomatis.

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function handle<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || ''
  if (!res.ok) {
    let msg = `Error ${res.status}`
    if (ct.includes('application/json')) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      if (body?.error) msg = body.error
    }
    throw new ApiError(msg, res.status)
  }
  if (ct.includes('application/json')) return res.json() as Promise<T>
  return undefined as T
}

export const api = {
  get: <T>(path: string) => fetch(`/api${path}`, { credentials: 'same-origin' }).then((r) => handle<T>(r)),

  post: <T>(path: string, body?: any) =>
    fetch(`/api${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r)),

  put: <T>(path: string, body?: any) =>
    fetch(`/api${path}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r)),

  del: <T>(path: string) =>
    fetch(`/api${path}`, { method: 'DELETE', credentials: 'same-origin' }).then((r) => handle<T>(r)),

  upload: <T>(path: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`/api${path}`, { method: 'POST', credentials: 'same-origin', body: fd }).then((r) =>
      handle<T>(r),
    )
  },
}

/** URL absolut endpoint export (dipakai untuk anchor download). */
export function exportUrl(path: string, params?: Record<string, string>): string {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return `/api${path}${qs}`
}
