import { describe, expect, it } from 'vitest'
import i18n, { initI18n, syncLocale } from './i18n'

describe('i18n', () => {
  it('initializes with the given locale as the active language', async () => {
    await initI18n('en')
    expect(i18n.language).toBe('en')
  })

  it('exposes the seeded translation bundle', async () => {
    await initI18n('en')
    expect(i18n.t('switcher.label')).toBe('Language')
  })

  it('syncLocale changes the active language', async () => {
    await initI18n('en')
    syncLocale('en')
    expect(i18n.language).toBe('en')
  })
})
