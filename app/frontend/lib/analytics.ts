declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

function pushToDataLayer(...args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
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
