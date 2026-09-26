import { afterEach, describe, expect, it } from 'vitest'
import { getCsrfToken } from './csrf'

function clearCookies() {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

describe('getCsrfToken', () => {
  afterEach(clearCookies)

  it('returns an empty string when there is no cookie', () => {
    expect(getCsrfToken()).toBe('')
  })

  it('reads the XSRF-TOKEN cookie', () => {
    document.cookie = 'XSRF-TOKEN=raw-token-value'
    expect(getCsrfToken()).toBe('raw-token-value')
  })

  it('URL-decodes the cookie value', () => {
    document.cookie = `XSRF-TOKEN=${encodeURIComponent('token/with+special==chars')}`
    expect(getCsrfToken()).toBe('token/with+special==chars')
  })

  it('picks XSRF-TOKEN out among other cookies', () => {
    document.cookie = 'other=1'
    document.cookie = 'XSRF-TOKEN=the-real-token'
    document.cookie = 'another=2'
    expect(getCsrfToken()).toBe('the-real-token')
  })
})
