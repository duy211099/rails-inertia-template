import { createInertiaApp, type ResolvedComponent, usePage } from '@inertiajs/react'
import { StrictMode, useEffect, useRef, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster, toast } from 'sonner'
import type { SharedProps } from '@/types'

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
    const pages = import.meta.glob<{default: ResolvedComponent}>('../pages/**/*.tsx', {
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
  if (document.getElementById("app")) {
    throw error
  } else {
    console.error(
      "Missing root element.\n\n" +
      "If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n" +
      'Consider moving <%= vite_typescript_tag "inertia.tsx" %> to the Inertia-specific layout instead.',
    )
  }
})
