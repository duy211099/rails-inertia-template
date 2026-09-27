// Keel DataTable — the shadcn "Data Table" guide (TanStack Table + <Table>) made server-driven:
// manual sorting/pagination (Inertia props), row links, selection with "select all N", bulk actions, skeleton & empty states.
'use client'

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { type LucideIcon, MoreHorizontalIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { AppLink } from '@/components/app-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type BulkAction = {
  label: string
  icon?: LucideIcon
  onAction: (ids: string[]) => void
  destructive?: boolean
}
export type RowAction = { label: string; onSelect?: () => void; destructive?: boolean }

/** Column meta Keel reads: align "end" for numbers/money; hideBelow drops a column on small screens; primary marks the row-header cell. */
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    align?: 'start' | 'end'
    hideBelow?: 'md' | 'lg'
    primary?: boolean
    width?: string | number
  }
}

export type DataTableProps<TData> = {
  /** Accessible name (visually hidden caption), e.g. "Orders". */
  label: string
  columns: ColumnDef<TData, any>[]
  data: TData[]
  getRowId: (row: TData) => string
  /** Row click → detail page. The primary cell renders a real link. */
  rowHref?: (row: TData) => string
  /** Server sort state (Inertia query param). */
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  /** Selection. Keys are row ids. */
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  /** Total matching records across pages → enables "Select all N". */
  totalCount?: number
  allMatchingSelected?: boolean
  onAllMatchingSelectedChange?: (v: boolean) => void
  bulkActions?: BulkAction[]
  rowActions?: (row: TData) => RowAction[][]
  loading?: boolean
  busy?: boolean
  emptyState?: React.ReactNode
  noun?: { one: string; other: string }
}

const INTERACTIVE = 'a,button,input,select,textarea,label,[role=checkbox],[role=menuitem]'
const hide = (h?: 'md' | 'lg') => (h === 'md' ? 'max-md:hidden' : h === 'lg' ? 'max-lg:hidden' : '')

function DataTable<TData>({
  label,
  columns,
  data,
  getRowId,
  rowHref,
  sorting = [],
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  totalCount,
  allMatchingSelected,
  onAllMatchingSelectedChange,
  bulkActions = [],
  rowActions,
  loading,
  busy,
  emptyState,
  noun = { one: 'item', other: 'items' },
}: DataTableProps<TData>) {
  const selectable = !!onRowSelectionChange
  const allColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    const cols: ColumnDef<TData, any>[] = []
    if (selectable)
      cols.push({
        id: 'select',
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label={`Select all ${noun.other} on this page`}
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(v) => {
              onAllMatchingSelectedChange?.(false)
              table.toggleAllPageRowsSelected(!!v)
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-labelledby={`${row.id}-primary`}
            checked={row.getIsSelected()}
            onCheckedChange={(v) => {
              onAllMatchingSelectedChange?.(false)
              row.toggleSelected(!!v)
            }}
          />
        ),
        meta: { width: 40 },
      })
    cols.push(...columns)
    if (rowActions)
      cols.push({
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {rowActions(row.original).map((group, gi) => (
                <React.Fragment key={JSON.stringify(group.map((action) => action.label))}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  {group.map((a) => (
                    <DropdownMenuItem
                      key={a.label}
                      variant={a.destructive ? 'destructive' : 'default'}
                      onSelect={a.onSelect}
                    >
                      {a.label}
                    </DropdownMenuItem>
                  ))}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        meta: { width: 48, align: 'end' },
      })
    return cols
  }, [columns, selectable, rowActions, noun.other, onAllMatchingSelectedChange])

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId: (r) => getRowId(r),
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    enableRowSelection: selectable,
    state: { sorting, rowSelection: rowSelection ?? {} },
    onSortingChange,
    onRowSelectionChange,
  })

  const selectedIds = Object.keys(rowSelection ?? {}).filter((k) => rowSelection?.[k])
  const count = allMatchingSelected && totalCount ? totalCount : selectedIds.length
  const plural = (n: number) => `${n.toLocaleString()} ${n === 1 ? noun.one : noun.other}`
  const primaryId =
    columns.find((c) => c.meta?.primary)?.id ??
    (columns[0] as any)?.id ??
    (columns[0] as any)?.accessorKey
  const visibleBulk = bulkActions.filter((a) => !a.destructive).slice(0, 2)
  const overflowBulk = bulkActions.filter((a) => !visibleBulk.includes(a))

  return (
    <div data-slot="data-table" className="relative">
      {count > 0 && (
        // biome-ignore lint/a11y/useSemanticElements: Preserve the div ref/props API of this composable wrapper.
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex min-h-11 flex-wrap items-center gap-2 border-b bg-selected px-3 py-1.5"
        >
          <span className="text-sm font-medium" aria-live="polite">
            {plural(count)} selected
          </span>
          {table.getIsAllPageRowsSelected() &&
            totalCount &&
            totalCount > data.length &&
            !allMatchingSelected && (
              <Button variant="link" size="sm" onClick={() => onAllMatchingSelectedChange?.(true)}>
                Select all {plural(totalCount)}
              </Button>
            )}
          <div className="ml-auto flex items-center gap-2">
            {visibleBulk.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant="outline"
                onClick={() => a.onAction(selectedIds)}
              >
                {a.icon && <a.icon />}
                {a.label}
              </Button>
            ))}
            {overflowBulk.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    More actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowBulk.map((a) => (
                    <DropdownMenuItem
                      key={a.label}
                      variant={a.destructive ? 'destructive' : 'default'}
                      onSelect={() => a.onAction(selectedIds)}
                    >
                      {a.icon && <a.icon />}
                      {a.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selection"
              onClick={() => {
                onAllMatchingSelectedChange?.(false)
                table.resetRowSelection()
              }}
            >
              <XIcon />
            </Button>
          </div>
        </div>
      )}
      <Table
        aria-busy={loading || busy || undefined}
        className={cn(busy && 'opacity-60 transition-opacity')}
      >
        <TableCaption className="sr-only">{label}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => {
                const m = h.column.columnDef.meta
                const sorted = h.column.getIsSorted()
                return (
                  <TableHead
                    key={h.id}
                    style={{ width: m?.width }}
                    aria-sort={
                      sorted
                        ? sorted === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : h.column.getCanSort()
                          ? 'none'
                          : undefined
                    }
                    className={cn(m?.align === 'end' && 'text-right', hide(m?.hideBelow))}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.max(data.length, 6) }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Loading placeholders have no record identity or state.
              <TableRow key={`sk${i}`} className="hover:bg-transparent">
                {table.getVisibleFlatColumns().map((c, ci) => (
                  <TableCell key={c.id} className={hide(c.columnDef.meta?.hideBelow)}>
                    <Skeleton
                      className={cn(
                        'h-3',
                        c.id === 'select' ? 'size-4' : ci <= 1 ? 'w-3/4' : 'w-1/2',
                        c.columnDef.meta?.align === 'end' && 'ml-auto'
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={allColumns.length} className="h-auto whitespace-normal">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const href = rowHref?.(row.original)
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() || allMatchingSelected ? 'selected' : undefined}
                  onClick={(e) => {
                    if (!href || (e.target as HTMLElement).closest(INTERACTIVE)) return
                    ;(
                      e.currentTarget.querySelector('[data-row-link]') as HTMLElement | null
                    )?.click()
                  }}
                  className={cn(href && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => {
                    const m = cell.column.columnDef.meta
                    const isPrimary = cell.column.id === primaryId
                    const content = flexRender(cell.column.columnDef.cell, cell.getContext())
                    return (
                      <TableCell
                        key={cell.id}
                        id={isPrimary ? `${row.id}-primary` : undefined}
                        className={cn(
                          m?.align === 'end' && 'text-right tabular-nums',
                          hide(m?.hideBelow)
                        )}
                      >
                        {isPrimary && href ? (
                          <AppLink
                            data-row-link
                            href={href}
                            className="rounded-sm font-medium text-foreground no-underline hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            {content}
                          </AppLink>
                        ) : isPrimary ? (
                          <span className="font-medium">{content}</span>
                        ) : (
                          content
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
