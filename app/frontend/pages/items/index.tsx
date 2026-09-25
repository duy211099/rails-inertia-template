import { Head, Link, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { AuthNav } from '@/components/auth-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { editItemPath, itemPath, itemsPath, newItemPath } from '@/lib/routes'
import type { Item, Pagy } from '@/types'

type Props = {
  items: Item[]
  pagy: Pagy
}

export default function ItemsIndex({ items, pagy }: Props) {
  const { t } = useTranslation('items/index')

  const handleDelete = (id: number) => {
    if (confirm(t('confirmDelete'))) {
      router.delete(itemPath(id))
    }
  }

  const goToPage = (page: number | null = 1) => {
    router.get(itemsPath(), { page }, { preserveState: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <Head title={t('pageTitle')} />

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">{t('heading')}</h1>
          <AuthNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            {t('itemCount', { count: pagy.count })}
            {pagy.pages > 1 && ` ${t('showingRange', { from: pagy.from, to: pagy.to })}`}
          </p>
          <Link href={newItemPath()}>
            <Button>{t('newItem')}</Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('empty')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    {item.description && <CardDescription>{item.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Link href={itemPath(item.id)}>
                        <Button variant="outline" size="sm">
                          {t('view')}
                        </Button>
                      </Link>
                      <Link href={editItemPath(item.id)}>
                        <Button variant="outline" size="sm">
                          {t('edit')}
                        </Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        {t('delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagy.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagy?.prev)}
                  disabled={!pagy.prev}
                >
                  {t('previous')}
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  {t('pageOf', { page: pagy.page, pages: pagy.pages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagy?.next)}
                  disabled={!pagy.next}
                >
                  {t('next')}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
