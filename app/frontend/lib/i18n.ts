import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from '@/locales/common/en.json'

// Each namespace mirrors a folder under app/frontend/locales/, the same
// way config/locales/<controller-path>/en.yml mirrors app/controllers/ on
// the backend. "common" holds UI strings shared across pages (e.g. the
// locale switcher); a page-specific namespace (e.g. "items") is added the
// same way once that page has copy to translate.
const resources = {
  en: { common },
}

let initialized = false

export async function initI18n(locale: string): Promise<void> {
  if (initialized) {
    syncLocale(locale)
    return
  }
  initialized = true
  await i18next.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'en',
    ns: Object.keys(resources.en),
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
}

export function syncLocale(locale: string): void {
  if (i18next.language !== locale) {
    i18next.changeLanguage(locale)
  }
}

export default i18next
