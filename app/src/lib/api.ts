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
  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const text = await res.text()

  if (!res.ok) {
    const err = isJson ? (JSON.parse(text) as { error?: string }) : { error: res.statusText }
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }

  if (text.trim() === '') return {} as T
  if (!isJson || text.trimStart().startsWith('<')) {
    throw new Error(
      "API returned HTML instead of JSON. Set VITE_API_URL to your Worker URL (e.g. https://bike-build-api.<subdomain>.workers.dev) in your deployment environment variables and redeploy."
    )
  }
  return JSON.parse(text) as T
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
  put: async <T>(path: string, body: unknown) => {
    const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) }
    return fetch(`${base()}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) }).then(handleResponse<T>)
  },
  delete: async (path: string) => {
    const headers = await authHeaders()
    const res = await fetch(`${base()}${path}`, { method: 'DELETE', headers })
    const contentType = res.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const text = await res.text()
    if (!res.ok) {
      const err = isJson ? (JSON.parse(text) as { error?: string }) : { error: res.statusText }
      throw new Error((err as { error?: string }).error ?? res.statusText)
    }
    if (!isJson || text.trimStart().startsWith('<')) {
      throw new Error(
        "API returned HTML instead of JSON. Set VITE_API_URL to your Worker URL in your deployment environment variables and redeploy."
      )
    }
    return text ? (JSON.parse(text) as { deleted?: boolean }) : {}
  },
}
