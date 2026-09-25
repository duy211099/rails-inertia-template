import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { initI18n } from '@/lib/i18n'
import LocaleSwitcher from './LocaleSwitcher'

vi.mock('@inertiajs/react', () => ({
  router: { patch: vi.fn(), reload: vi.fn() },
}))

beforeAll(async () => {
  await initI18n('en')
})

describe('LocaleSwitcher', () => {
  it('renders the current locale as selected', () => {
    render(<LocaleSwitcher />)
    expect(screen.getByRole('combobox')).toHaveValue('en')
  })

  it('calls the locale endpoint and reloads on change', async () => {
    const { router } = await import('@inertiajs/react')
    render(<LocaleSwitcher />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'en')
    expect(router.patch).toHaveBeenCalled()
  })
})
