import { Head, router } from '@inertiajs/react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { UsersIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Inline } from '@/components/layout/stack'
import {
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableToolbar,
} from '@/components/patterns/data-table'
import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { ResourceIndex } from '@/components/patterns/resource-index'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { adminUserPath, adminUsersPath } from '@/lib/routes'
import type { Pagy, User } from '@/types'

type Props = {
  users: User[]
  pagy: Pagy
  q?: string
  role?: string[]
  sort?: string
  direction?: string
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'dev', label: 'Dev' },
  { value: 'admin', label: 'Admin' },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function AdminUsersIndex({ users, pagy, q, role, sort, direction }: Props) {
  const { t } = useTranslation('admin/users/index')
  const [query, setQuery] = useState(q ?? '')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [roleFilter, setRoleFilter] = useState<string[]>(role ?? [])
  const [sorting, setSorting] = useState<SortingState>(
    sort ? [{ id: sort, desc: direction === 'desc' }] : []
  )
  const lastSentKey = useRef(
    JSON.stringify({ q: q ?? '', role: [...(role ?? [])].sort(), sort, direction })
  )

  useEffect(() => {
    const activeSort = sorting[0]
    const key = JSON.stringify({
      q: debouncedQuery,
      role: [...roleFilter].sort(),
      sort: activeSort?.id,
      direction: activeSort ? (activeSort.desc ? 'desc' : 'asc') : undefined,
    })
    if (key === lastSentKey.current) return
    lastSentKey.current = key
    router.get(
      adminUsersPath(),
      {
        q: debouncedQuery || undefined,
        role: roleFilter.length ? roleFilter : undefined,
        sort: activeSort?.id,
        direction: activeSort ? (activeSort.desc ? 'desc' : 'asc') : undefined,
      },
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }, [debouncedQuery, roleFilter, sorting])

  const isFiltered = query !== '' || roleFilter.length > 0

  const columns: ColumnDef<User, any>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columnName')} />,
      meta: { primary: true },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={row.original.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {initials(row.original.name || row.original.email)}
            </AvatarFallback>
          </Avatar>
          <span>{row.original.name || row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columnEmail')} />,
      meta: { hideBelow: 'md' },
    },
    {
      accessorKey: 'roles',
      header: t('columnRoles'),
      enableSorting: false,
      cell: ({ row }) => (
        <Inline gap="2xs">
          {row.original.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </Inline>
      ),
    },
    {
      id: 'created_at',
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columnCreated')} />,
      meta: { hideBelow: 'md' },
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <Page width="wide">
      <Head title={t('pageTitle')} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderHeading>{t('heading')}</PageHeaderHeading>
        </PageHeaderContent>
      </PageHeader>

      <ResourceIndex
        label={t('heading')}
        state={pagy.count === 0 && !q ? 'empty' : 'ready'}
        empty={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
        toolbar={
          <DataTableToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder={t('searchPlaceholder')}
            isFiltered={isFiltered}
            onReset={() => {
              setQuery('')
              setRoleFilter([])
            }}
            filters={
              <DataTableFacetedFilter
                title={t('columnRoles')}
                options={ROLE_OPTIONS}
                selected={roleFilter}
                onSelectedChange={setRoleFilter}
              />
            }
          />
        }
        pagination={
          pagy.pages > 1 ? (
            <DataTablePagination
              label={t('showingRange', { from: pagy.from, to: pagy.to, count: pagy.count })}
              previousHref={pagy.prev ? adminUsersPath({ page: pagy.prev, q: query }) : null}
              nextHref={pagy.next ? adminUsersPath({ page: pagy.next, q: query }) : null}
            />
          ) : undefined
        }
      >
        <DataTable<User>
          label={t('heading')}
          noun={{ one: t('userNoun'), other: t('userNounPlural') }}
          columns={columns}
          data={users}
          getRowId={(user) => user.id}
          rowHref={(user) => adminUserPath(user.id)}
          sorting={sorting}
          onSortingChange={setSorting}
          emptyState={
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('empty')}</EmptyTitle>
                <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          }
        />
      </ResourceIndex>
    </Page>
  )
}
