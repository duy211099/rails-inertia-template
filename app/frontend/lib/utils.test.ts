import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('combines conditional and nested class names', () => {
    expect(cn('base', ['rounded', null], { hidden: false, flex: true }, undefined)).toBe(
      'base rounded flex'
    )
  })

  it('lets later Tailwind utilities override conflicting values', () => {
    expect(cn('px-2 py-4 text-red-500', 'px-6 text-blue-500')).toBe('py-4 px-6 text-blue-500')
  })

  it('keeps responsive and state variants independent', () => {
    expect(cn('p-2 hover:bg-red-500 md:p-4', 'p-6 hover:bg-blue-500')).toBe(
      'md:p-4 p-6 hover:bg-blue-500'
    )
  })

  it('returns an empty string for absent classes', () => {
    expect(cn(null, undefined, false)).toBe('')
  })
})
