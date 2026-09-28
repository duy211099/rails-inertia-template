import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetAnalyticsForTests, initAnalytics, trackPageview } from './analytics'

beforeEach(() => {
  document.head.innerHTML = ''
  window.gtag = undefined
  window.dataLayer = undefined
  __resetAnalyticsForTests()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('initAnalytics', () => {
  it('does nothing when no measurement id is configured', () => {
    initAnalytics()
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
  })

  it('injects the gtag script and configures it when a measurement id is set', () => {
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123')
    initAnalytics()
    expect(document.querySelector('script[src*="G-TEST123"]')).not.toBeNull()
    expect(window.gtag).toBeInstanceOf(Function)
  })

  it('pushes real arguments objects to dataLayer, not arrays, so gtag.js recognizes them as commands', () => {
    // gtag.js only treats an `arguments` object pushed onto dataLayer as a
    // command; pushing a real Array (e.g. from a rest-args `(...args) =>
    // dataLayer.push(args)` shim) is silently ignored by the real script.
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123')
    initAnalytics()
    expect(Array.isArray(window.dataLayer?.[0])).toBe(false)
  })
})

describe('trackPageview', () => {
  it('is a no-op before analytics is initialized', () => {
    trackPageview('/items')
    expect(window.gtag).toBeUndefined()
  })

  it('pushes a page_view event once analytics is initialized', () => {
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123')
    initAnalytics()
    const spy = vi.spyOn(window, 'gtag')
    trackPageview('/items')
    expect(spy).toHaveBeenCalledWith('event', 'page_view', { page_path: '/items' })
  })
})
