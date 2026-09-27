import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('combines conditional and nested class names', () => {
    expect(cn('base', ['rounded', null], { hidden: false, flex: true }, undefined)).toBe(
      'base rounded flex'
    )
  })

  it('lets later Tailwind utilities override conflicting values', () => {
    expect(cn('text-red-500 px-2 py-4', 'text-blue-500 px-6')).toBe('py-4 text-blue-500 px-6')
  })

  it('keeps responsive and state variants independent', () => {
    expect(cn('hover:bg-red-500 p-2 md:p-4', 'hover:bg-blue-500 p-6')).toBe(
      'md:p-4 hover:bg-blue-500 p-6'
    )
  })

  it('returns an empty string for absent classes', () => {
    expect(cn(null, undefined, false)).toBe('')
  })
})
