import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { localePath } from '@/lib/routes'

export default function LocaleSwitcher() {
  const { t, i18n } = useTranslation()

  const availableLocales = ['en']

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = event.target.value
    router.patch(
      localePath(),
      { locale },
      {
        onSuccess: () => router.reload(),
        preserveState: false,
      }
    )
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
