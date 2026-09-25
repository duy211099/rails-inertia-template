import { Head, Link, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { AuthNav } from '@/components/auth-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { editItemPath, itemPath, itemsPath } from '@/lib/routes'
import type { Item } from '@/types'

type Props = {
  item: Item
}

export default function ItemShow({ item }: Props) {
  const { t } = useTranslation('items/show')

  const handleDelete = () => {
    if (confirm(t('confirmDelete'))) {
      router.delete(itemPath(item.id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Head title={item.name} />

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href={itemsPath()}>
              <Button variant="ghost" size="sm">
                &larr; {t('back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('heading')}</h1>
          </div>
          <AuthNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{item.name}</CardTitle>
            {item.description && (
              <CardDescription className="text-base">{item.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {item.phoneNumber && (
              <div className="mb-4">
                <p className="text-sm font-medium">{t('phoneNumberLabel')}</p>
                <p>{item.phoneNumber}</p>
              </div>
            )}
            <div className="mb-6 text-sm text-muted-foreground">
              <p>{t('created', { date: new Date(item.createdAt).toLocaleString() })}</p>
              <p>{t('updated', { date: new Date(item.updatedAt).toLocaleString() })}</p>
            </div>
            <div className="flex gap-2">
              <Link href={editItemPath(item.id)}>
                <Button>{t('edit')}</Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                {t('delete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
