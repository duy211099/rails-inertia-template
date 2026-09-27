import { Head, router } from '@inertiajs/react'
import type { VariantProps } from 'class-variance-authority'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { versionsPath } from '@/lib/routes'
import type { Pagy, Version } from '@/types'

type Props = {
  versions: Version[]
  pagy: Pagy
}

function formatEvent(
  event: string,
  t: TFunction
): { label: string; variant: VariantProps<typeof badgeVariants>['variant'] } {
  switch (event) {
    case 'create':
      return { label: t('eventCreated'), variant: 'success' }
    case 'update':
      return { label: t('eventUpdated'), variant: 'info' }
    case 'destroy':
      return { label: t('eventDeleted'), variant: 'destructive' }
    default:
      return { label: event, variant: 'secondary' }
  }
}

function formatChanges(objectChanges: Record<string, [unknown, unknown]> | null, t: TFunction) {
  if (!objectChanges) return null

  return Object.entries(objectChanges).map(([key, [from, to]]) => ({
    field: key.replace(/_/g, ' '),
    from: from ?? t('emptyValue'),
    to: to ?? t('emptyValue'),
  }))
}

export default function VersionsIndex({ versions, pagy }: Props) {
  const { t } = useTranslation('versions/index')

  const goToPage = (page: number | null = 1) => {
    router.get(versionsPath(), { page }, { preserveState: true })
  }

  return (
    <Page width="wide">
      <Head title={t('pageTitle')} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderHeading>{t('heading')}</PageHeaderHeading>
        </PageHeaderContent>
      </PageHeader>

      <p className="text-sm text-muted-foreground">
        {t('changeCount', { count: pagy.count })}
        {pagy.pages > 1 && ` ${t('showingRange', { from: pagy.from, to: pagy.to })}`}
      </p>

      {versions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('empty')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => {
            const eventInfo = formatEvent(version.event, t)
            const changes = formatChanges(version.objectChanges, t)

            return (
              <Card key={version.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {version.itemType} #{version.itemId}
                    </CardTitle>
                    <Badge variant={eventInfo.variant}>{eventInfo.label}</Badge>
                  </div>
                  <CardDescription>{new Date(version.createdAt).toLocaleString()}</CardDescription>
                </CardHeader>
                {changes && changes.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {changes.map((change) => (
                        <div key={change.field} className="text-sm">
                          <span className="font-medium capitalize">{change.field}:</span>{' '}
                          {version.event === 'create' ? (
                            <span className="text-success">{String(change.to)}</span>
                          ) : version.event === 'destroy' ? (
                            <span className="text-destructive line-through">
                              {String(change.from)}
                            </span>
                          ) : (
                            <>
                              <span className="text-destructive line-through">
                                {String(change.from)}
                              </span>
                              {' → '}
                              <span className="text-success">{String(change.to)}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {pagy.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
    </Page>
  )
}
