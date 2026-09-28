declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

// gtag.js only recognizes a pushed `arguments` object as a command, not a
// plain Array — a rest-args `(...args) => dataLayer.push(args)` shim gets
// silently ignored by the real script.
function pushToDataLayer() {
  window.dataLayer = window.dataLayer || []
  // biome-ignore lint/complexity/noArguments: gtag.js requires a real Arguments object, not an Array
  window.dataLayer.push(arguments)
}

export function initAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined
  if (!measurementId || initialized) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.gtag = pushToDataLayer
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })
  initialized = true
}

export function trackPageview(path: string): void {
  if (!initialized || !window.gtag) return
  window.gtag('event', 'page_view', { page_path: path })
}

export function __resetAnalyticsForTests(): void {
  initialized = false
}
