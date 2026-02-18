/**
 * API base URL: use VITE_API_URL in production, or relative /api (dev proxy) when unset.
 */
export function getBaseUrl(): string {
  const env = import.meta.env.VITE_API_URL
  if (env && typeof env === 'string') return env.replace(/\/$/, '')
  return ''
}

const base = () => getBaseUrl()

/** Set by app when Clerk is ready; used to add Authorization header to API requests. */
let authTokenGetter: (() => Promise<string | null>) | null = null
export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  authTokenGetter = getter
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = authTokenGetter ? await authTokenGetter() : null
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: async <T>(path: string) => {
    const headers = await authHeaders()
    return fetch(`${base()}${path}`, { headers }).then(handleResponse<T>)
  },
  post: async <T>(path: string, body: unknown) => {
    const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) }
    return fetch(`${base()}${path}`, { method: 'POST', headers, body: JSON.stringify(body) }).then(handleResponse<T>)
  },
  patch: async <T>(path: string, body: unknown) => {
    const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) }
    return fetch(`${base()}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) }).then(handleResponse<T>)
  },
  delete: async (path: string) => {
    const headers = await authHeaders()
    const res = await fetch(`${base()}${path}`, { method: 'DELETE', headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error((err as { error?: string }).error ?? res.statusText)
    }
    return res.json()
  },
}
