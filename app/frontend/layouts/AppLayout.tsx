import { usePage } from '@inertiajs/react'
import { HistoryIcon, LogOutIcon, PackageIcon, ShieldIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { AppShell } from '@/components/patterns/app-shell'
import type { NavSection } from '@/components/patterns/app-sidebar'
import { getCsrfToken } from '@/lib/csrf'
import { adminRootPath, itemsPath, versionsPath } from '@/lib/routes'
import type { SharedProps } from '@/types'

function signOut() {
  const form = document.createElement('form')
  form.method = 'post'
  form.action = '/users/sign_out'
  form.style.display = 'none'

  const method = document.createElement('input')
  method.type = 'hidden'
  method.name = '_method'
  method.value = 'delete'
  form.appendChild(method)

  const token = document.createElement('input')
  token.type = 'hidden'
  token.name = 'authenticity_token'
  token.value = getCsrfToken()
  form.appendChild(token)

  document.body.appendChild(form)
  form.submit()
}

function buildNavigation(isAdmin: boolean): NavSection[] {
  const items = [{ title: 'Items', url: itemsPath(), icon: PackageIcon }]
  if (isAdmin) {
    items.push(
      { title: 'Admin', url: adminRootPath(), icon: ShieldIcon },
      { title: 'Versions', url: versionsPath(), icon: HistoryIcon }
    )
  }
  return [{ items }]
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { url, props } = usePage<SharedProps>()
  const isAdmin = props.user?.roles?.includes('admin') ?? false
  const navigation = useMemo(() => buildNavigation(isAdmin), [isAdmin])

  return (
    <AppShell
      currentPath={url}
      workspace={{ name: 'Rails Inertia Template' }}
      navigation={navigation}
      user={{
        name: props.user?.name ?? props.user?.email ?? 'Guest',
        email: props.user?.email,
        avatarUrl: props.user?.avatarUrl ?? undefined,
        menu: [[{ label: 'Sign out', icon: LogOutIcon, onSelect: signOut }]],
      }}
      headerActions={<LocaleSwitcher />}
    >
      {children}
    </AppShell>
  )
}
