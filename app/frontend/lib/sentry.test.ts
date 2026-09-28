import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockInit, mockCaptureException } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCaptureException: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  init: mockInit,
  captureException: mockCaptureException,
}))

beforeEach(async () => {
  vi.resetModules()
  mockInit.mockClear()
  mockCaptureException.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('initSentry', () => {
  it('does not initialize Sentry when no DSN is configured', async () => {
    const { initSentry } = await import('./sentry')
    await initSentry()
    expect(mockInit).not.toHaveBeenCalled()
  })

  it('initializes Sentry once when a DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/123')
    const { initSentry } = await import('./sentry')
    await initSentry()
    await initSentry()
    expect(mockInit).toHaveBeenCalledTimes(1)
  })

  it('initializes Sentry once even when called twice before either resolves', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/123')
    const { initSentry } = await import('./sentry')
    await Promise.all([initSentry(), initSentry()])
    expect(mockInit).toHaveBeenCalledTimes(1)
  })
})

describe('reportError', () => {
  it('does not forward errors before Sentry is initialized', async () => {
    const { reportError } = await import('./sentry')
    reportError(new Error('boom'))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('forwards errors to Sentry once initialized', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://key@sentry.io/123')
    const { initSentry, reportError } = await import('./sentry')
    await initSentry()
    const error = new Error('boom')
    reportError(error)
    expect(mockCaptureException).toHaveBeenCalledWith(error)
  })
})
