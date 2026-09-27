import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { DetailLayout } from '@/components/patterns/detail-layout'
import {
  Page,
  PageHeader,
  PageHeaderBack,
  PageHeaderContent,
  PageHeaderHeading,
} from '@/components/patterns/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from '@/components/ui/description-list'
import { adminUsersPath } from '@/lib/routes'
import type { User } from '@/types'

type Props = {
  user: User
}

export default function AdminUserShow({ user }: Props) {
  const { t } = useTranslation('admin/users/show')
  const displayName = user.name || user.email

  return (
    <Page>
      <Head title={displayName} />
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderBack href={adminUsersPath()} label={t('heading')} />
          <PageHeaderHeading>{displayName}</PageHeaderHeading>
        </PageHeaderContent>
      </PageHeader>

      <DetailLayout>
        <Card>
          <CardHeader>
            <CardTitle>{t('heading')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList>
              <DescriptionItem>
                <DescriptionTerm>{t('emailLabel')}</DescriptionTerm>
                <DescriptionDetails>{user.email}</DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('rolesLabel')}</DescriptionTerm>
                <DescriptionDetails>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('joinedLabel')}</DescriptionTerm>
                <DescriptionDetails>{new Date(user.createdAt).toLocaleString()}</DescriptionDetails>
              </DescriptionItem>
            </DescriptionList>
          </CardContent>
        </Card>
      </DetailLayout>
    </Page>
  )
}
