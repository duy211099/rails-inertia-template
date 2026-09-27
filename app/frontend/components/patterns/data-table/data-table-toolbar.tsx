// Search + faceted filter pills + sort — named after the shadcn Data Table guide's DataTableToolbar / DataTableFacetedFilter.
// State lives in the URL: every change → router.get(url, params, { preserveState: true, preserveScroll: true, replace: true }).
'use client'

import { ArrowUpDownIcon, CheckIcon, PlusCircleIcon, SearchIcon, XIcon } from 'lucide-react'
import type * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export type FacetOption = { label: string; value: string; count?: number }

/** One filter dimension as a pill. Multi-select options apply immediately. */
function DataTableFacetedFilter({
  title,
  options,
  selected,
  onSelectedChange,
}: {
  title: string
  options: FacetOption[]
  selected: string[]
  onSelectedChange: (values: string[]) => void
}) {
  const active = selected.length > 0
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'border-dashed',
            active && 'border-solid border-primary bg-selected hover:bg-selected'
          )}
        >
          <PlusCircleIcon className={cn(active && 'hidden')} />
          {title}
          {active && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              {selected.length > 2 ? (
                <Badge variant="secondary" className="px-1 font-normal">
                  {selected.length} selected
                </Badge>
              ) : (
                options
                  .filter((o) => selected.includes(o.value))
                  .map((o) => (
                    <Badge key={o.value} variant="secondary" className="px-1 font-normal">
                      {o.label}
                    </Badge>
                  ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start" aria-label={`${title} filter`}>
        {/* biome-ignore lint/a11y/useSemanticElements: This is a generic group of filter buttons. */}
        <div role="group" aria-label={title} className="flex flex-col">
          {options.map((o) => {
            const on = selected.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() =>
                  onSelectedChange(
                    on ? selected.filter((v) => v !== o.value) : [...selected, o.value]
                  )
                }
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-lg border border-input',
                    on && 'border-primary bg-primary text-primary-foreground'
                  )}
                >
                  {on && <CheckIcon className="size-3" />}
                </span>
                <span className="flex-1">{o.label}</span>
                {o.count !== undefined && (
                  <span className="font-mono text-xs text-muted-foreground">{o.count}</span>
                )}
              </button>
            )
          })}
          {active && (
            <>
              <Separator className="my-1" />
              <button
                type="button"
                onClick={() => onSelectedChange([])}
                className="rounded-sm px-2 py-1.5 text-center text-sm hover:bg-accent"
              >
                Clear filter
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** The index toolbar. Put DataTableFacetedFilter pills (3–5 pinned dimensions) in `filters`. */
function DataTableToolbar({
  query,
  onQueryChange,
  searchPlaceholder = 'Search',
  filters,
  isFiltered,
  onReset,
  sort,
  actions,
  className,
}: {
  query: string
  onQueryChange: (q: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  isFiltered?: boolean
  onReset?: () => void
  sort?: {
    options: { value: string; label: string }[]
    value: string
    onValueChange: (v: string) => void
  }
  actions?: React.ReactNode
  className?: string
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Preserve the div ref/props API of this composable wrapper.
    <div
      role="search"
      data-slot="data-table-toolbar"
      className={cn('flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2', className)}
    >
      <InputGroup className="h-8 min-w-48 flex-1 basis-60">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </InputGroup>
      {filters}
      {isFiltered && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
          <XIcon />
        </Button>
      )}
      {sort && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDownIcon />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort.value} onValueChange={sort.onValueChange}>
              {sort.options.map((o) => (
                <DropdownMenuRadioItem key={o.value} value={o.value}>
                  {o.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {actions}
    </div>
  )
}

export { DataTableFacetedFilter, DataTableToolbar }
