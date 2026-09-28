import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

const baseProps = {
  workspace: { name: 'Acme' },
  navigation: [{ items: [{ title: 'Items', url: '/items' }] }],
  user: { name: 'Ada', email: 'ada@example.com', menu: [] },
}

describe('AppShell focus management', () => {
  it('moves focus to main on a real navigation (different path)', () => {
    const { rerender } = render(
      <AppShell {...baseProps} currentPath="/items">
        <input placeholder="page content" />
      </AppShell>
    )
    rerender(
      <AppShell {...baseProps} currentPath="/admin/users">
        <input placeholder="page content" />
      </AppShell>
    )
    expect(document.activeElement).toBe(document.getElementById('main'))
  })

  it('does not steal focus from a search input while the URL changes from typing (same page, query only)', () => {
    const { rerender } = render(
      <AppShell {...baseProps} currentPath="/admin/users">
        <input placeholder="Search by name or email" />
      </AppShell>
    )
    const searchInput = screen.getByPlaceholderText('Search by name or email')
    searchInput.focus()
    expect(document.activeElement).toBe(searchInput)

    rerender(
      <AppShell {...baseProps} currentPath="/admin/users?q=d">
        <input placeholder="Search by name or email" />
      </AppShell>
    )

    expect(document.activeElement).toBe(searchInput)
  })

  it('does not focus main on the initial mount, even under StrictMode double-invoked effects', () => {
    render(
      <StrictMode>
        <AppShell {...baseProps} currentPath="/admin/users">
          <input placeholder="page content" />
        </AppShell>
      </StrictMode>
    )
    expect(document.activeElement).not.toBe(document.getElementById('main'))
  })
})
