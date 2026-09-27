import { Head, router } from '@inertiajs/react'
import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { adminRootPath } from '@/lib/routes'
import type { Item, Pagy } from '@/types'

type Props = {
  items: Item[]
  pagy: Pagy
}

export default function AdminDashboard({ items, pagy }: Props) {
  const goToPage = (page: number | null = 1) => {
    router.get(adminRootPath(), { page }, { preserveState: true })
  }

  return (
    <Page width="wide">
      <Head title="Admin" />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderHeading>Admin</PageHeaderHeading>
        </PageHeaderContent>
      </PageHeader>

      <p className="text-sm text-muted-foreground">
        All items across every user ({pagy.count} total)
        {pagy.pages > 1 && ` — showing ${pagy.from}-${pagy.to}`}
      </p>

      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No items yet</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  {item.description && <CardDescription>{item.description}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>

          {pagy.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagy?.prev)}
                disabled={!pagy.prev}
              >
                Previous
              </Button>
              <span className="px-4 text-sm text-muted-foreground">
                Page {pagy.page} of {pagy.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagy?.next)}
                disabled={!pagy.next}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </Page>
  )
}
