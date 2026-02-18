/**
 * API base URL: use VITE_API_URL in production, or relative /api (dev proxy) when unset.
 */
export function getBaseUrl(): string {
  const env = import.meta.env.VITE_API_URL
  if (env && typeof env === 'string') return env.replace(/\/$/, '')
  return ''
}

const base = () => getBaseUrl()

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) =>
    fetch(`${base()}${path}`).then(handleResponse<T>),
  post: <T>(path: string, body: unknown) =>
    fetch(`${base()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handleResponse<T>),
  patch: <T>(path: string, body: unknown) =>
    fetch(`${base()}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handleResponse<T>),
  delete: (path: string) =>
    fetch(`${base()}${path}`, { method: 'DELETE' }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error((err as { error?: string }).error ?? res.statusText)
      }
      return res.json()
    }),
}
