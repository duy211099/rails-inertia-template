import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { initI18n } from '@/lib/i18n'

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }))

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  router: { get: mockGet },
}))

beforeAll(async () => {
  await initI18n('en')
})

import AdminUsersIndex from './index'

const pagy = {
  count: 1,
  page: 1,
  limit: 12,
  pages: 1,
  last: 1,
  in: 1,
  from: 1,
  to: 1,
  next: null,
  prev: null,
}

const users = [
  {
    id: '1',
    name: 'Ada',
    email: 'ada@example.com',
    avatarUrl: null,
    roles: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    itemsCount: 0,
  },
]

describe('AdminUsersIndex search debounce', () => {
  it('does not call router.get for every keystroke', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} />)

    const input = screen.getByPlaceholderText('Search by name or email')
    await userEvent.type(input, 'ab', { delay: null })

    expect(mockGet).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      { q: 'ab' },
      expect.objectContaining({ preserveState: true, preserveScroll: true, replace: true })
    )
    vi.useRealTimers()
  })

  it('keeps the search toolbar visible while clearing a query that had zero results', () => {
    // pagy reflects the server's last response to q="asdf" (zero matches);
    // local `query` has already been cleared by the user but the debounced
    // request hasn't resolved yet — the toolbar must not disappear.
    render(<AdminUsersIndex users={[]} pagy={{ ...pagy, count: 0, from: 0, to: 0 }} q="asdf" />)
    const input = screen.getByPlaceholderText('Search by name or email') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })

    expect(screen.getByPlaceholderText('Search by name or email')).toBeInTheDocument()
  })

  it('does not fire a request on mount for an already-applied query', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} q="ada" />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(mockGet).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('sorts by a column when its header is clicked', () => {
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} />)

    fireEvent.click(screen.getByRole('button', { name: 'Name' }))

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ sort: 'name', direction: 'asc' }),
      expect.objectContaining({ preserveState: true, preserveScroll: true, replace: true })
    )
  })

  it('sorts by the Joined column using the snake_case DB column name', () => {
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} />)

    fireEvent.click(screen.getByRole('button', { name: 'Joined' }))

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ sort: 'created_at', direction: 'asc' }),
      expect.anything()
    )
  })

  it('reverses sort direction on a second click of the same header', () => {
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} sort="name" direction="asc" />)

    fireEvent.click(screen.getByRole('button', { name: 'Name' }))

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ sort: 'name', direction: 'desc' }),
      expect.anything()
    )
  })

  it('filters by role when a role option is selected', async () => {
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} />)

    await userEvent.click(screen.getByRole('button', { name: 'Roles' }))
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Admin' }))

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ role: ['admin'] }),
      expect.anything()
    )
  })

  it('clears search and role filter when Reset is clicked', async () => {
    mockGet.mockClear()
    render(<AdminUsersIndex users={users} pagy={pagy} q="ada" role={['admin']} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByPlaceholderText('Search by name or email')).toHaveValue('')
  })
})
