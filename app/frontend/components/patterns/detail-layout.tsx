// Keel blocks for resource detail pages.
import type * as React from 'react'
import { cn } from '@/lib/utils'

/** Main (≈⅔, the work) + aside (320px, the glance). Main first in DOM; aside stacks below it under 1024px. */
function DetailLayout({
  aside,
  className,
  children,
}: {
  aside?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  if (!aside)
    return (
      <div data-slot="detail-layout" className={cn('flex flex-col gap-4', className)}>
        {children}
      </div>
    )
  return (
    <div
      data-slot="detail-layout"
      className={cn(
        'grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6',
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
      <aside className="flex min-w-0 flex-col gap-4">{aside}</aside>
    </div>
  )
}

export type ActivityItem = {
  id: string
  message: React.ReactNode
  time: string
  dateTime?: string
  actor?: React.ReactNode
}

/** What happened to a record, newest first. "Actor + past-tense verb + object". */
function ActivityFeed({
  items,
  label = 'Activity',
  className,
}: {
  items: ActivityItem[]
  label?: string
  className?: string
}) {
  return (
    <ol
      data-slot="activity-feed"
      aria-label={label}
      className={cn('m-0 flex list-none flex-col p-0', className)}
    >
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span aria-hidden className="absolute top-6 bottom-0 left-[11px] w-px bg-border" />
          )}
          <span className="relative flex size-6 shrink-0 items-center justify-center">
            {it.actor ?? <span className="size-2 rounded-full bg-input" />}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="m-0 text-sm text-foreground">{it.message}</p>
            <time dateTime={it.dateTime} className="text-xs text-muted-foreground">
              {it.time}
            </time>
          </div>
        </li>
      ))}
    </ol>
  )
}

export { ActivityFeed, DetailLayout }
