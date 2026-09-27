import { Head, router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { PackageIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable, DataTablePagination } from '@/components/patterns/data-table'
import {
  Page,
  PageActions,
  PageHeader,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { ResourceIndex } from '@/components/patterns/resource-index'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { editItemPath, itemPath, itemsPath, newItemPath } from '@/lib/routes'
import type { Item, Pagy } from '@/types'

type Props = {
  items: Item[]
  pagy: Pagy
}

export default function ItemsIndex({ items, pagy }: Props) {
  const { t } = useTranslation('items/index')
  const [rowSelection, setRowSelection] = useState({})

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      router.delete(itemPath(id))
    }
  }

  const columns: ColumnDef<Item, any>[] = [
    { accessorKey: 'name', header: t('columnName'), meta: { primary: true } },
    { accessorKey: 'description', header: t('columnDescription'), meta: { hideBelow: 'md' } },
    { accessorKey: 'phoneNumber', header: t('columnPhone'), meta: { hideBelow: 'md' } },
  ]

  return (
    <Page width="wide">
      <Head title={t('pageTitle')} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderHeading>{t('heading')}</PageHeaderHeading>
        </PageHeaderContent>
        <PageActions>
          <Button asChild>
            <a href={newItemPath()}>
              <PlusIcon />
              {t('newItem')}
            </a>
          </Button>
        </PageActions>
      </PageHeader>

      <ResourceIndex
        label={t('heading')}
        state={pagy.count === 0 ? 'empty' : 'ready'}
        empty={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>{t('empty')}</EmptyTitle>
              <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <a href={newItemPath()}>{t('newItem')}</a>
              </Button>
            </EmptyContent>
          </Empty>
        }
        pagination={
          pagy.pages > 1 ? (
            <DataTablePagination
              label={t('showingRange', { from: pagy.from, to: pagy.to, count: pagy.count })}
              previousHref={pagy.prev ? itemsPath({ page: pagy.prev }) : null}
              nextHref={pagy.next ? itemsPath({ page: pagy.next }) : null}
            />
          ) : undefined
        }
      >
        <DataTable<Item>
          label={t('heading')}
          noun={{ one: t('itemNoun'), other: t('itemNounPlural') }}
          columns={columns}
          data={items}
          getRowId={(item) => item.id}
          rowHref={(item) => itemPath(item.id)}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          rowActions={(item) => [
            [{ label: t('edit'), onSelect: () => router.visit(editItemPath(item.id)) }],
            [{ label: t('delete'), destructive: true, onSelect: () => handleDelete(item.id) }],
          ]}
          emptyState={
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('empty')}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          }
        />
      </ResourceIndex>
    </Page>
  )
}
