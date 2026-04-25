import './application.css'
import { createInertiaApp, router } from '@inertiajs/react'
import { createElement, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import snakecaseKeys from 'snakecase-keys'
import ErrorBoundary from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'

const MissingPage: any = () =>
  createElement(
    'div',
    { className: 'min-h-screen bg-background' },
    createElement(
      'div',
      { className: 'container mx-auto px-4 py-12 max-w-3xl space-y-3' },
      createElement('h1', { className: 'text-2xl font-bold' }, 'Page not found'),
      createElement(
        'p',
        { className: 'text-muted-foreground' },
        'The page you requested is missing or not registered yet.'
      )
    )
  )

MissingPage.layout = (page: ReactNode) => createElement(Layout, null, page)

let root: ReturnType<typeof createRoot> | null = null

createInertiaApp({
  title: (title) => (title ? `${title} - WithDui` : 'WithDui'),

  progress: {
    color: '#6b7280',
  },

  resolve: async (name) => {
    const pages = import.meta.glob('../pages/**/*.tsx')
    const pageLoader = pages[`../pages/${name}.tsx`]

    if (!pageLoader) {
      console.error(`Missing Inertia page component: '${name}.tsx'`)
      return MissingPage
    }

    const page: any = await pageLoader()

    const Component = page.default ?? page

    const WrappedComponent: any = (props: any) => {
      return createElement(Layout, null, createElement(Component, props))
    }

    WrappedComponent.layout =
      Component.layout || ((page: ReactNode) => createElement(Layout, null, page))

    return WrappedComponent
  },

  setup({ el, App, props }) {
    if (el) {
      if (!root) {
        root = createRoot(el)
      }
      root.render(createElement(ErrorBoundary, null, createElement(App, props)))
    } else {
      console.error(
        'Missing root element.\n\n' +
          'If you see this error, it probably means you load Inertia.js on non-Inertia pages.\n' +
          'Consider moving <%= vite_typescript_tag "inertia" %> to the Inertia-specific layout instead.'
      )
    }
  },
})

// Transform all outgoing requests: camelCase → snake_case
router.on('before', (event) => {
  const visit = event.detail.visit

  if (visit.data instanceof FormData) {
    return
  }

  if (visit.data && typeof visit.data === 'object') {
    visit.data = snakecaseKeys(visit.data, {
      deep: true,
      exclude: [/^_/],
    })
  }
})

const redirectToErrorPage = (event: Event) => {
  const detail = (event as CustomEvent<{ response?: { status?: number } }>).detail
  if (detail?.response?.status && detail.response.status >= 500) {
    window.location.assign('/500.html')
  }
}

document.addEventListener('inertia:exception', redirectToErrorPage)
document.addEventListener('inertia:invalid', redirectToErrorPage)
