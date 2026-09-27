import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Autocomplete } from './autocomplete'

describe('Autocomplete', () => {
  it('exposes options and selects the active suggestion from the keyboard', () => {
    const onValueChange = vi.fn()
    render(
      <Autocomplete
        aria-label="Fruit"
        value="Ap"
        open
        suggestions={[{ value: 'apple', label: 'Apple' }]}
        onValueChange={onValueChange}
      />
    )
    const input = screen.getByRole('combobox', { name: 'Fruit' })
    const option = within(screen.getByRole('listbox')).getByRole('option', { name: 'Apple' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', option.id)
    expect(option).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('Apple')
  })
})
