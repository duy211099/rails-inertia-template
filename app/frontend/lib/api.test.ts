import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, clearToken, getToken, setToken } from './api'

describe('token storage', () => {
  afterEach(() => localStorage.clear())

  it('round-trips through localStorage', () => {
    expect(getToken()).toBeNull()
    setToken('Bearer abc')
    expect(getToken()).toBe('Bearer abc')
    clearToken()
    expect(getToken()).toBeNull()
  })
})

describe('api()', () => {
  beforeEach(() => localStorage.clear())

  function mockFetch(response: Partial<Response> & { json?: () => unknown }) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({}),
      ...response,
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('sends no Authorization header when there is no stored token', async () => {
    const fetchMock = mockFetch({})
    await api('/items')
    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.Authorization).toBeUndefined()
  })

  it('attaches the stored token as a Bearer Authorization header', async () => {
    setToken('Bearer stored-token')
    const fetchMock = mockFetch({})
    await api('/items')
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/items')
    expect(options.headers.Authorization).toBe('Bearer stored-token')
  })

  it('stores a new token from the response Authorization header', async () => {
    mockFetch({ headers: new Headers({ Authorization: 'Bearer fresh-token' }) })
    await api('/session', { method: 'POST' })
    expect(getToken()).toBe('Bearer fresh-token')
  })

  it('returns null for a 204 response without parsing a body', async () => {
    const json = vi.fn()
    mockFetch({ status: 204, json })
    const result = await api('/session', { method: 'DELETE' })
    expect(result).toBeNull()
    expect(json).not.toHaveBeenCalled()
  })

  it('returns the parsed JSON body on success', async () => {
    mockFetch({ json: async () => ({ items: [1, 2] }) })
    const result = await api('/items')
    expect(result).toEqual({ items: [1, 2] })
  })

  it('raises the server error message on failure', async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Sign in to continue.' } }),
    })
    await expect(api('/items')).rejects.toThrow('Sign in to continue.')
  })

  it('falls back to the first validation detail when there is no top-level message', async () => {
    mockFetch({
      ok: false,
      status: 422,
      json: async () => ({ error: { details: { name: ["can't be blank"] } } }),
    })
    await expect(api('/items', { method: 'POST' })).rejects.toThrow("can't be blank")
  })

  it('falls back to a generic message when the error body is unparseable', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json')
      },
    })
    await expect(api('/items')).rejects.toThrow('Request failed')
  })
})
