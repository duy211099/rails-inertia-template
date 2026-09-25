import { router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
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
  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = event.target.value
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
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('switcher.label')}</span>
      <select
        value={i18n.language}
        onChange={handleChange}
        className="rounded border bg-background px-2 py-1 text-sm"
      >
        {availableLocales.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )
}
