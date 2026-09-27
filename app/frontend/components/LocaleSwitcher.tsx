import { router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localePath } from '@/lib/routes'

interface LocaleSwitcherPageProps {
  availableLocales?: string[]
  [key: string]: unknown
}

export default function LocaleSwitcher() {
  const { t, i18n } = useTranslation()
  const { availableLocales = ['en'] } = usePage<LocaleSwitcherPageProps>().props

  // LocaleController renders a plain 204, not an Inertia response, so a
  // router.patch (Inertia) visit treats it as a non-Inertia response and
  // shows an error dialog instead of running onSuccess. A plain fetch with
  // the CSRF token (same pattern as the demo page's client-fetch example)
  // avoids that entirely.
  const handleChange = async (locale: string) => {
    const csrfToken =
      document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
    await fetch(localePath(), {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    router.reload()
  }

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger size="sm" aria-label={t('switcher.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {availableLocales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {locale.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
