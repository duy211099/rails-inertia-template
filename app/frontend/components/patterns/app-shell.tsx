// Keel block: the persistent application frame = SidebarProvider + AppSidebar + SidebarInset(SiteHeader + main) + Toaster.
'use client'

import * as React from 'react'
import { AppSidebar, type AppSidebarProps } from '@/components/patterns/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

/** Top bar of the content column: sidebar toggle · search · page-independent actions. */
function SiteHeader({
  search,
  actions,
  className,
}: {
  search?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      data-slot="site-header"
      className={`sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4 ${className ?? ''}`}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
      <div data-keel-search className="flex min-w-0 flex-1 items-center">
        {search}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  )
}

/** Closes the mobile sidebar Sheet after each visit. */
function CloseMobileOnNavigate({ path }: { path: string }) {
  const { setOpenMobile } = useSidebar()
  // biome-ignore lint/correctness/useExhaustiveDependencies: A path change intentionally closes mobile navigation.
  React.useEffect(() => setOpenMobile(false), [path, setOpenMobile])
  return null
}

export type AppShellProps = AppSidebarProps & {
  search?: React.ReactNode
  headerActions?: React.ReactNode
  /** Start collapsed to icons (read the sidebar_state cookie on the server). */
  defaultOpen?: boolean
  children: React.ReactNode
}

/**
 * Mount ONCE as an Inertia persistent layout so visits swap only <main>: no sidebar flicker or remount.
 * Moves focus to <main> after each visit and binds "/" to the search field.
 */
function AppShell({
  search,
  headerActions,
  defaultOpen = true,
  children,
  ...sidebar
}: AppShellProps) {
  const previousPath = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (previousPath.current === sidebar.currentPath) return
    const isInitialMount = previousPath.current === null
    previousPath.current = sidebar.currentPath
    if (isInitialMount) return
    // A same-page visit (e.g. a live search reflecting its query in the URL)
    // changes currentPath without the user leaving the field they're typing
    // in — don't steal focus from it.
    const active = document.activeElement
    if (active?.closest('input,textarea,select,[contenteditable=true]')) return
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [sidebar.currentPath])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (
        e.key !== '/' ||
        e.metaKey ||
        e.ctrlKey ||
        t.closest('input,textarea,select,[contenteditable=true]')
      )
        return
      const input = document.querySelector<HTMLInputElement>('[data-keel-search] input')
      if (input) {
        e.preventDefault()
        input.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-popover focus:px-3 focus:py-2 focus:shadow-md"
      >
        Skip to content
      </a>
      <CloseMobileOnNavigate path={sidebar.currentPath} />
      <AppSidebar {...sidebar} />
      <SidebarInset>
        <SiteHeader search={search} actions={headerActions} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="bottom-center" />
    </SidebarProvider>
  )
}

export { AppShell, SiteHeader }
