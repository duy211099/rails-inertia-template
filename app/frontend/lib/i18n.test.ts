import { beforeAll, describe, expect, it } from 'vitest'
import i18n, { initI18n } from '@/lib/i18n'

beforeAll(async () => {
  await initI18n('en')
})

describe('initI18n', () => {
  it('registers the admin/users/index namespace with real translations', () => {
    expect(i18n.t('heading', { ns: 'admin/users/index' })).toBe('Users')
  })

  it('registers the admin/users/show namespace with real translations', () => {
    expect(i18n.t('heading', { ns: 'admin/users/show' })).toBe('User details')
  })
})
