// Keel block: page frame + header, in shadcn's compound-part style (PageHeader, PageHeaderHeading, PageHeaderDescription, PageActions).

import { ArrowLeftIcon } from 'lucide-react'
import type * as React from 'react'
import { AppLink } from '@/components/app-link'
import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

/** Width by page type: narrow (create/edit, errors) · default (detail, settings) · wide (index, dashboard) · full. */
function Page({
  width = 'default',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { width?: 'narrow' | 'default' | 'wide' | 'full' }) {
  return (
    <Container data-slot="page" size={width} className={cn('pb-16', className)} {...props}>
      <div className="flex flex-col gap-6">{children}</div>
    </Container>
  )
}

/** Title row: where am I, what is this, what can I do. Sits on the background, never in a Card. */
function PageHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        '-mb-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 pt-6',
        className
      )}
      {...props}
    />
  )
}

/** Left side: optional back link, then heading block. */
function PageHeaderContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-content"
      className={cn('flex min-w-0 items-start gap-2', className)}
      {...props}
    />
  )
}

/** Back to the parent page (one level up). Deeper hierarchies use Breadcrumb above the header. */
function PageHeaderBack({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  return (
    <AppLink
      href={href}
      aria-label={`Back to ${label}`}
      className={cn(
        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className
      )}
    >
      <ArrowLeftIcon className="size-4" />
    </AppLink>
  )
}

/** The page's h1 — plus status badges as siblings inside it. */
function PageHeaderHeading({
  className,
  children,
  badges,
  ...props
}: React.ComponentProps<'h1'> & { badges?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <h1
        data-slot="page-header-heading"
        className={cn('m-0 text-xl font-semibold break-words text-foreground', className)}
        {...props}
      >
        {children}
      </h1>
      {badges && <div className="flex items-center gap-1.5">{badges}</div>}
    </div>
  )
}

/** One line of metadata under the title. */
function PageHeaderDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="page-header-description"
      className={cn('m-0 mt-0.5 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/** Right side: ≤ 2 outline buttons, a "More actions" DropdownMenu, then the ONE default (primary) Button last. */
function PageActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-actions"
      className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

export {
  Page,
  PageActions,
  PageHeader,
  PageHeaderBack,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderHeading,
}
