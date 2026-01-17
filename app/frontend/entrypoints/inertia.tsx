import type { RequestPayload } from '@inertiajs/core'
import { createInertiaApp, type ResolvedComponent, router, usePage } from '@inertiajs/react'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { type ReactNode, StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import snakecaseKeys from 'snakecase-keys'
import { Toaster, toast } from 'sonner'
import type { SharedProps } from '@/types'

// Configure NProgress
NProgress.configure({ showSpinner: false })

// Set up NProgress for Inertia page transitions
let progressTimeout: ReturnType<typeof setTimeout> | null = null

router.on('start', () => {
  progressTimeout = setTimeout(() => NProgress.start(), 250)
})

router.on('finish', (event) => {
  if (progressTimeout) {
    clearTimeout(progressTimeout)
    progressTimeout = null
  }
  if (event.detail.visit.completed) {
    NProgress.done()
  } else if (event.detail.visit.interrupted) {
    NProgress.set(0)
  } else if (event.detail.visit.cancelled) {
    NProgress.done()
    NProgress.remove()
  }
})

// Convert camelCase form data to snake_case before sending to Rails
router.on('before', (event) => {
  const { visit } = event.detail
  if (visit.data && typeof visit.data === 'object') {
    visit.data = snakecaseKeys(visit.data as any, {
      deep: true,
      exclude: [/^_/], // Preserve Rails internal params (_method, etc.)
    }) as RequestPayload
  }
})

// Flash toast component - shows flash messages and renders Toaster
function FlashToaster() {
  const { flash } = usePage<SharedProps>().props
  const shownRef = useRef<{ notice?: string; alert?: string }>({})

  useEffect(() => {
    if (flash?.notice && flash.notice !== shownRef.current.notice) {
      shownRef.current.notice = flash.notice
      toast.success(flash.notice)
    }
    if (flash?.alert && flash.alert !== shownRef.current.alert) {
      shownRef.current.alert = flash.alert
      toast.error(flash.alert)
    }
  }, [flash])

  return <Toaster position="top-right" richColors closeButton />
}

// Wrapper to provide flash messages within Inertia context
function AppWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <FlashToaster />
      {children}
    </>
  )
}

void createInertiaApp({
  // Set default page title
  // see https://inertia-rails.dev/guide/title-and-meta
  //
  // title: title => title ? `${title} - App` : 'App',

  // Disable progress bar
  //
  // see https://inertia-rails.dev/guide/progress-indicators
  // progress: false,

  resolve: (name) => {
    const pages = import.meta.glob<{ default: ResolvedComponent }>('../pages/**/*.tsx', {
      eager: true,
    })
    const page = pages[`../pages/${name}.tsx`]
    if (!page) {
      console.error(`Missing Inertia page component: '${name}.tsx'`)
    }

    // Wrap all pages with AppWrapper for flash messages
    page.default.layout ||= (page: ReactNode) => <AppWrapper>{page}</AppWrapper>

    return page
  },

  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <App {...props} />
      </StrictMode>
    )
  },

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
    },
    future: {
      useScriptElementForInitialPage: true,
      useDataInertiaHeadAttribute: true,
      useDialogForErrorModal: true,
      preserveEqualProps: true,
    },
  },
}).catch((error) => {
  // This ensures this entrypoint is only loaded on Inertia pages
  // by checking for the presence of the root element (#app by default).
  // Feel free to remove this `catch` if you don't need it.
  if (document.getElementById('app')) {
    throw error
  } else {
    console.error(
      'Missing root element.\n\n' +
        'If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n' +
        'Consider moving <%= vite_typescript_tag "inertia.tsx" %> to the Inertia-specific layout instead.'
    )
  }
})
