import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { initI18n } from '@/lib/i18n'
import LocaleSwitcher from './LocaleSwitcher'

const { mockReload } = vi.hoisted(() => ({ mockReload: vi.fn() }))

vi.mock('@inertiajs/react', () => ({
  router: { reload: mockReload },
  usePage: () => ({ props: { availableLocales: ['en'] } }),
}))

beforeAll(async () => {
  await initI18n('en')
})

beforeEach(() => {
  mockReload.mockClear()
  document.head.innerHTML = '<meta name="csrf-token" content="test-token">'
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
  )
})

describe('LocaleSwitcher', () => {
  it('renders the current locale as selected', () => {
    render(<LocaleSwitcher />)
    expect(screen.getByRole('combobox')).toHaveValue('en')
  })

  it('renders an option for every available locale from Inertia props', () => {
    render(<LocaleSwitcher />)
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('PATCHes the locale endpoint with a CSRF token and reloads on success', async () => {
    render(<LocaleSwitcher />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'en')

    expect(fetch).toHaveBeenCalledWith(
      '/locale',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ 'X-CSRF-Token': 'test-token' }),
      })
    )
    expect(mockReload).toHaveBeenCalled()
  })
})
