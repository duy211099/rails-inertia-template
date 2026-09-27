import { Head, Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthNav } from '@/components/auth-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PublicLayout from '@/layouts/PublicLayout'
import { itemsPath } from '@/lib/routes'
import type { SharedProps } from '@/types'

export default function Home() {
  const { t } = useTranslation('home/index')
  const { user } = usePage<SharedProps>().props

  return (
    <div className="min-h-screen bg-background">
      <Head title={t('pageTitle')} />

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">{t('heading')}</h1>
          <AuthNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
            <h2 className="text-3xl font-bold">{t('heading')}</h2>
            <p className="max-w-md text-muted-foreground">{t('tagline')}</p>

            {user ? (
              <Link href={itemsPath()}>
                <Button size="lg">{t('viewItems')}</Button>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">{t('signInPrompt')}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

Home.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>
