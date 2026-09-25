import { Head, Link, useForm } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { AuthNav } from '@/components/auth-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { itemPath, itemsPath } from '@/lib/routes'
import type { Item } from '@/types'

type Props = {
  item: Item
}

export default function ItemEdit({ item }: Props) {
  const { t } = useTranslation(['items/edit', 'items/form'])
  const { data, setData, patch, processing, errors } = useForm({
    ...item,
    description: item.description ?? '',
    phoneNumber: item.phoneNumber ?? '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch(itemPath(item.id))
  }

  return (
    <div className="min-h-screen bg-background">
      <Head title={t('items/edit:pageTitleTemplate', { name: item.name })} />

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href={itemsPath()}>
              <Button variant="ghost" size="sm">
                &larr; {t('items/edit:back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('items/edit:heading')}</h1>
          </div>
          <AuthNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('items/edit:cardTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('items/form:nameLabel')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder={t('items/form:namePlaceholder')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('items/form:descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder={t('items/form:descriptionPlaceholder')}
                  rows={4}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('items/form:phoneNumberLabel')}</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={data.phoneNumber}
                  onChange={(e) => setData('phoneNumber', e.target.value)}
                  placeholder={t('items/form:phoneNumberPlaceholder')}
                  aria-invalid={!!errors.phoneNumber}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={processing}>
                  {processing ? t('items/edit:submitting') : t('items/edit:submit')}
                </Button>
                <Link href={itemsPath()}>
                  <Button type="button" variant="outline">
                    {t('items/form:cancel')}
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
