import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DetailLayout } from '@/components/patterns/detail-layout'
import {
  Page,
  PageActions,
  PageHeader,
  PageHeaderBack,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from '@/components/ui/description-list'
import { editItemPath, itemPath, itemsPath } from '@/lib/routes'
import type { Item } from '@/types'

type Props = {
  item: Item
}

export default function ItemShow({ item }: Props) {
  const { t } = useTranslation('items/show')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <Page>
      <Head title={item.name} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderBack href={itemsPath()} label={t('heading')} />
          <PageHeaderHeading>{item.name}</PageHeaderHeading>
        </PageHeaderContent>
        <PageActions>
          <Button variant="outline" asChild>
            <a href={editItemPath(item.id)}>{t('edit')}</a>
          </Button>
          <Button variant="destructive-outline" onClick={() => setConfirmingDelete(true)}>
            {t('delete')}
          </Button>
        </PageActions>
      </PageHeader>

      <DetailLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('heading')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList>
              {item.description && (
                <DescriptionItem>
                  <DescriptionTerm>{t('descriptionLabel')}</DescriptionTerm>
                  <DescriptionDetails>{item.description}</DescriptionDetails>
                </DescriptionItem>
              )}
              {item.phoneNumber && (
                <DescriptionItem>
                  <DescriptionTerm>{t('phoneNumberLabel')}</DescriptionTerm>
                  <DescriptionDetails>{item.phoneNumber}</DescriptionDetails>
                </DescriptionItem>
              )}
              <DescriptionItem>
                <DescriptionTerm>{t('createdLabel')}</DescriptionTerm>
                <DescriptionDetails>{new Date(item.createdAt).toLocaleString()}</DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('updatedLabel')}</DescriptionTerm>
                <DescriptionDetails>{new Date(item.updatedAt).toLocaleString()}</DescriptionDetails>
              </DescriptionItem>
            </DescriptionList>
          </CardContent>
        </Card>
      </DetailLayout>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteTitle', { name: item.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => router.delete(itemPath(item.id))}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
