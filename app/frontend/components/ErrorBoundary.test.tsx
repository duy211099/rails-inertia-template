import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function BrokenChild({ message }: { message: string }): never {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  it('renders children when they are healthy', () => {
    render(
      <ErrorBoundary>
        <p>Page content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('Page content')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('replaces a broken subtree with the error message', () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <BrokenChild message="Could not load items" />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByText('Could not load items')).toBeInTheDocument()
    expect(errorLog).toHaveBeenCalledWith(
      'Unhandled UI error',
      expect.objectContaining({ message: 'Could not load items' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('provides a fallback for errors without a message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <BrokenChild message="" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Unexpected error')).toBeInTheDocument()
  })
})
