import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from './date-picker'

describe('DatePicker', () => {
  it('preserves a typed date until it is committed on blur', () => {
    const onValueChange = vi.fn()
    render(<DatePicker aria-label="Date" onValueChange={onValueChange} />)
    const input = screen.getByRole('textbox', { name: 'Date' })
    fireEvent.change(input, { target: { value: '2026-09-27' } })
    expect(input).toHaveValue('2026-09-27')
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenCalledWith('2026-09-27')
  })
})
