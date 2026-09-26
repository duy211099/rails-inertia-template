import { usePage } from '@inertiajs/react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SharedProps } from '@/types'
import { AuthNav } from './auth-nav'

// Only replace the server-provided page context; keep Inertia's real Link.
vi.mock('@inertiajs/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inertiajs/react')>()
  return { ...actual, usePage: vi.fn() }
})

function setPage(props: SharedProps) {
  vi.mocked(usePage).mockReturnValue({
    component: 'items/index',
    url: '/items',
    version: null,
    props: { errors: {}, ...props },
    clearHistory: false,
    encryptHistory: false,
  } as ReturnType<typeof usePage>)
}

const user = { id: 1, name: 'Ada', email: 'ada@example.com', avatarUrl: null }

beforeEach(() => {
  setPage({})
})

describe('AuthNav', () => {
  it('offers a sign-in link to guests', () => {
    render(<AuthNav />)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/users/sign_in')
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  })

  it('shows the signed-in profile and submits logout with method override and CSRF token', () => {
    setPage({ user: { ...user, avatarUrl: 'https://example.com/avatar.png' } })
    document.cookie = 'XSRF-TOKEN=test-csrf-token'
    render(<AuthNav />)
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ada' })).toHaveAttribute(
      'src',
      'https://example.com/avatar.png'
    )
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Sign out' })
    expect(button).toHaveAttribute('type', 'submit')
    const form = button.form
    expect(form).toHaveAttribute('action', '/users/sign_out')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).not.toBeNull()
    if (!form) throw new Error('Sign out must belong to a form')
    const data = new FormData(form)
    expect(data.get('_method')).toBe('delete')
    expect(data.get('authenticity_token')).toBe('test-csrf-token')
  })

  it('handles missing avatars and a missing CSRF cookie', () => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setPage({ user })
    render(<AuthNav />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const form = screen.getByRole<HTMLButtonElement>('button', { name: 'Sign out' }).form
    if (!form) throw new Error('Sign out must belong to a form')
    expect(new FormData(form).get('authenticity_token')).toBe('')
  })
})
