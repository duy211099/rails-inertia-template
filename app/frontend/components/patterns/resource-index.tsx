// Keel block: every list-of-records page = header → saved views (Tabs line) → one Card: toolbar · DataTable · pagination.
import type * as React from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type View = { value: string; label: string; count?: number }

/** Wrap in <Page width="wide"> after a PageHeader. state="empty" = the account has no records at all (first-use Empty replaces everything). */
function ResourceIndex({
  views,
  activeView,
  onViewChange,
  viewActions,
  toolbar,
  children,
  pagination,
  state = 'ready',
  empty,
  error,
  label,
}: {
  label: string
  views?: View[]
  activeView?: string
  onViewChange?: (v: string) => void
  viewActions?: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  pagination?: React.ReactNode
  state?: 'ready' | 'empty' | 'error'
  empty?: React.ReactNode
  error?: React.ReactNode
}) {
  if (state === 'empty')
    return (
      <Card data-slot="resource-index" className="py-0">
        {empty}
      </Card>
    )
  return (
    <Card data-slot="resource-index" className="gap-0 overflow-hidden py-0">
      {views && views.length > 0 && (
        <Tabs value={activeView} onValueChange={onViewChange}>
          <div className="flex items-center justify-between gap-2 border-b px-2">
            <TabsList variant="line" aria-label={`${label} views`} className="h-10">
              {views.map((v) => (
                <TabsTrigger key={v.value} value={v.value}>
                  {v.label}
                  {v.count !== undefined && (
                    <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                      {v.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {viewActions}
          </div>
        </Tabs>
      )}
      {toolbar}
      {state === 'error' ? error : children}
      {state !== 'error' && pagination}
    </Card>
  )
}

export { ResourceIndex }
