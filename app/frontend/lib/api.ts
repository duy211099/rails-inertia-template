// Talks to the JSON API (/api/v1) with a JWT bearer token — the same
// mechanism a native mobile client would use. Token lives only in
// localStorage, never in a cookie, so there's nothing for the server to
// CSRF-protect on these requests.
const TOKEN_KEY = 'client_jwt'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function api(path: string, options: RequestInit = {}) {
  const token = getToken()

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...options.headers,
    },
  })

  const newToken = response.headers.get('Authorization')
  if (newToken) setToken(newToken)

  if (response.status === 204) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.error?.details?.name?.[0] || 'Request failed')
  }
  return body
}
