// Cursor pagination for server-driven tables (built from shadcn Button; shadcn's Pagination parts suit numbered pages).

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type * as React from 'react'
import { AppLink } from '@/components/app-link'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

/** "51–100 of 1,204" + previous/next. Pass Inertia hrefs carrying the cursor. */
function DataTablePagination({
  label,
  previousHref,
  nextHref,
}: {
  label: React.ReactNode
  previousHref?: string | null
  nextHref?: string | null
}) {
  return (
    <nav
      aria-label="Pagination"
      data-slot="data-table-pagination"
      className="flex items-center justify-between gap-3 border-t px-3 py-2"
    >
      <span className="text-sm text-muted-foreground tabular-nums">{label}</span>
      <ButtonGroup>
        {previousHref ? (
          <Button variant="outline" size="icon-sm" asChild>
            <AppLink href={previousHref} aria-label="Previous page">
              <ChevronLeftIcon />
            </AppLink>
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled aria-label="Previous page">
            <ChevronLeftIcon />
          </Button>
        )}
        {nextHref ? (
          <Button variant="outline" size="icon-sm" asChild>
            <AppLink href={nextHref} aria-label="Next page">
              <ChevronRightIcon />
            </AppLink>
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled aria-label="Next page">
            <ChevronRightIcon />
          </Button>
        )}
      </ButtonGroup>
    </nav>
  )
}

export { DataTablePagination }
