import * as Sentry from '@sentry/react'

let initialized = false

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || initialized) return

  Sentry.init({ dsn, environment: import.meta.env.MODE })
  initialized = true
}

export function reportError(error: unknown): void {
  if (!initialized) return
  Sentry.captureException(error)
}
