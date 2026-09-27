import type * as React from 'react'
import { cn } from '@/lib/utils'

const sizes = {
  auth: 'max-w-[400px]',
  narrow: 'max-w-[720px]',
  default: 'max-w-[1040px]',
  wide: 'max-w-[1400px]',
  full: 'max-w-none',
} as const

/** Centers content at a product width (container-* tokens) with the page gutter (px-4 → md:px-6). */
function Container({
  size = 'default',
  gutter = true,
  className,
  ...props
}: React.ComponentProps<'div'> & { size?: keyof typeof sizes; gutter?: boolean }) {
  return (
    <div
      data-slot="container"
      data-size={size}
      className={cn('mx-auto w-full', sizes[size], gutter && 'px-4 md:px-6', className)}
      {...props}
    />
  )
}

export { Container }
