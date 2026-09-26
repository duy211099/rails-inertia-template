import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import authLogin from '@/locales/auth/login/en.json'
import common from '@/locales/common/en.json'
import itemsEdit from '@/locales/items/edit/en.json'
import itemsForm from '@/locales/items/form/en.json'
import itemsIndex from '@/locales/items/index/en.json'
import itemsNew from '@/locales/items/new/en.json'
import itemsShow from '@/locales/items/show/en.json'
import versionsIndex from '@/locales/versions/index/en.json'

// Each namespace mirrors a page or shared folder under app/frontend/locales/,
// the same way config/locales/<controller-path>/en.yml mirrors
// app/controllers/ on the backend. "common" holds UI strings shared across
// pages (e.g. the locale switcher); every other namespace corresponds
// exactly to one page under app/frontend/pages/, named after its path
// (e.g. "items/index" for app/frontend/pages/items/index.tsx).
const resources = {
  en: {
    common,
    'auth/login': authLogin,
    'items/index': itemsIndex,
    'items/show': itemsShow,
    'items/form': itemsForm,
    'items/new': itemsNew,
    'items/edit': itemsEdit,
    'versions/index': versionsIndex,
  },
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
