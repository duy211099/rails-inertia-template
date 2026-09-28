let initialized = false
// Dynamically imported only when a DSN is configured, so @sentry/react
// (and its dependency weight) isn't bundled into the initial load for
// deployments that never set VITE_SENTRY_DSN.
let sentry: typeof import('@sentry/react') | null = null
let initPromise: Promise<void> | null = null

export function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || initialized) return Promise.resolve()
  // Guards synchronously (before the await below) so two calls made in the
  // same tick — e.g. initSentry() called twice before either resolves —
  // still only import and init once.
  if (initPromise) return initPromise

  initPromise = (async () => {
    sentry = await import('@sentry/react')
    sentry.init({ dsn, environment: import.meta.env.MODE })
    initialized = true
  })()
  return initPromise
}

export function reportError(error: unknown): void {
  if (!initialized || !sentry) return
  sentry.captureException(error)
}
