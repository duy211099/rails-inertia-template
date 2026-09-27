import type * as React from 'react'
import { cn } from '@/lib/utils'
import { type Gap, gapClass } from './stack'

type Cols = 1 | 2 | 3 | 4 | 6 | 12
const COLS: Record<string, Record<Cols, string>> = {
  base: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  },
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    6: 'sm:grid-cols-6',
    12: 'sm:grid-cols-12',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    6: 'xl:grid-cols-6',
    12: 'xl:grid-cols-12',
  },
}

/** 2–3 short fields per row, equal tiles. Mobile-first columns: { base: 1, sm: 2 }. */
function Grid({
  columns = 1,
  gap = 'md',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  columns?: Cols | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', Cols>>
  gap?: Gap
}) {
  const cols =
    typeof columns === 'number'
      ? [COLS.base[columns]]
      : Object.entries(columns).map(([bp, n]) => COLS[bp][n as Cols])
  return (
    <div
      data-slot="grid"
      className={cn('grid min-w-0', gapClass[gap], cols, className)}
      {...props}
    />
  )
}

export { Grid }
