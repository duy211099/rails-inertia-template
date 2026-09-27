import { Head, router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable, DataTablePagination, DataTableToolbar } from '@/components/patterns/data-table'
import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { ResourceIndex } from '@/components/patterns/resource-index'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { adminUserPath, adminUsersPath } from '@/lib/routes'
import type { Pagy, User } from '@/types'

type Props = {
  users: User[]
  pagy: Pagy
  q?: string
}

export default function AdminUsersIndex({ users, pagy, q }: Props) {
  const { t } = useTranslation('admin/users/index')
  const [rowSelection, setRowSelection] = useState({})
  const [query, setQuery] = useState(q ?? '')

  const handleQueryChange = (value: string) => {
    setQuery(value)
    router.get(
      adminUsersPath(),
      { q: value || undefined },
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }

  const columns: ColumnDef<User, any>[] = [
    {
      accessorKey: 'name',
      header: t('columnName'),
      meta: { primary: true },
      cell: ({ row }) => row.original.name || row.original.email,
    },
    { accessorKey: 'email', header: t('columnEmail'), meta: { hideBelow: 'md' } },
    {
      accessorKey: 'roles',
      header: t('columnRoles'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('columnCreated'),
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
        state={pagy.count === 0 && !query ? 'empty' : 'ready'}
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
            onQueryChange={handleQueryChange}
            searchPlaceholder={t('searchPlaceholder')}
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
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
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
