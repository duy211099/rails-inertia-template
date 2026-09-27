import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '@/lib/utils'

/** Keel type roles expressed in Tailwind's default scale — the same classes shadcn components use. */
const textVariants = cva('m-0', {
  variants: {
    variant: {
      display: 'text-3xl font-semibold tracking-tight',
      'page-title': 'text-xl font-semibold',
      heading: 'text-base font-semibold',
      subheading: 'text-sm font-semibold',
      body: 'text-sm',
      label: 'text-sm font-medium',
      caption: 'text-xs',
      metric: 'text-2xl font-semibold tracking-tight tabular-nums',
      code: 'font-mono text-xs',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
      warning: 'text-warning',
      inherit: '',
    },
  },
  defaultVariants: { variant: 'body', tone: 'default' },
})

const defaultElement = {
  display: 'h1',
  'page-title': 'h1',
  heading: 'h2',
  subheading: 'h3',
  body: 'p',
  label: 'span',
  caption: 'span',
  metric: 'span',
  code: 'code',
} as const

/** All product text by role. Headings pick their element; override `as` to keep the outline correct. */
function Text({
  as,
  variant = 'body',
  tone,
  truncate,
  numeric,
  className,
  ...props
}: React.ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    as?: React.ElementType
    truncate?: boolean
    numeric?: boolean
  }) {
  const Comp = as ?? defaultElement[variant ?? 'body']
  return (
    <Comp
      data-slot="text"
      className={cn(
        textVariants({ variant, tone: tone ?? (variant === 'caption' ? 'muted' : 'default') }),
        truncate && 'block truncate',
        numeric && 'tabular-nums',
        className
      )}
      {...props}
    />
  )
}

export { Text, textVariants }
