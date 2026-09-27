// Keel layout primitives (not part of shadcn/ui). Same file conventions: kebab-case file, named exports, data-slot, className last.
import type * as React from 'react'
import { cn } from '@/lib/utils'

/** The only gaps layout primitives accept: 2xs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32. */
export type Gap = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export const gapClass: Record<Gap, string> = {
  none: 'gap-0',
  '2xs': 'gap-1',
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

type Polymorphic = { asChild?: never; as?: React.ElementType }

/** Vertical flow with one gap. Default md (16px) = between form fields and cards; lg (24px) = page sections. */
function Stack({
  as: Comp = 'div',
  gap = 'md',
  align = 'stretch',
  className,
  ...props
}: React.ComponentProps<'div'> &
  Polymorphic & { gap?: Gap; align?: 'start' | 'center' | 'end' | 'stretch' }) {
  return (
    <Comp
      data-slot="stack"
      className={cn(
        'flex min-w-0 flex-col',
        gapClass[gap],
        {
          start: 'items-start',
          center: 'items-center',
          end: 'items-end',
          stretch: 'items-stretch',
        }[align],
        className
      )}
      {...props}
    />
  )
}

/** Horizontal flow that wraps (Keel has no separate Cluster). Default xs (8px) = between buttons and badges. */
function Inline({
  as: Comp = 'div',
  gap = 'xs',
  align = 'center',
  justify = 'start',
  wrap = true,
  className,
  ...props
}: React.ComponentProps<'div'> &
  Polymorphic & {
    gap?: Gap
    align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
    justify?: 'start' | 'center' | 'end' | 'between'
    wrap?: boolean
  }) {
  return (
    <Comp
      data-slot="inline"
      className={cn(
        'flex min-w-0 flex-row',
        wrap ? 'flex-wrap' : 'flex-nowrap',
        gapClass[gap],
        {
          start: 'items-start',
          center: 'items-center',
          end: 'items-end',
          baseline: 'items-baseline',
          stretch: 'items-stretch',
        }[align],
        {
          start: 'justify-start',
          center: 'justify-center',
          end: 'justify-end',
          between: 'justify-between',
        }[justify],
        className
      )}
      {...props}
    />
  )
}

export { Inline, Stack }
