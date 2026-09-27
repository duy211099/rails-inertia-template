// Keel blocks for settings pages.

import { LockIcon } from 'lucide-react'
import * as React from 'react'
import { AppLink } from '@/components/app-link'
import { cn } from '@/lib/utils'

/** Annotation (title + what it affects) beside a card of controls; stacks under 768px of its own width (container query). */
function SettingsSection({
  title,
  description,
  children,
  variant = 'default',
  lockedReason,
  footer,
  className,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  /** destructive: the danger zone (last on the page). */
  variant?: 'default' | 'destructive'
  /** Permission-sensitive: controls disabled, reason shown ("Only owners can change billing."). */
  lockedReason?: React.ReactNode
  /** Section-level Cancel/Save for sections that save explicitly. */
  footer?: React.ReactNode
  className?: string
}) {
  const id = React.useId()
  return (
    <section
      data-slot="settings-section"
      aria-labelledby={id}
      className={cn('@container', className)}
    >
      <div className="grid grid-cols-1 gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @3xl:gap-8">
        <div className="@3xl:pt-1">
          <h2
            id={id}
            className={cn(
              'm-0 text-base font-semibold',
              variant === 'destructive' ? 'text-destructive' : 'text-foreground'
            )}
          >
            {title}
          </h2>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        <div
          className={cn(
            'min-w-0 overflow-hidden rounded-lg border bg-card',
            variant === 'destructive' && 'border-destructive/50'
          )}
        >
          {lockedReason && (
            <p className="m-0 flex items-center gap-2 border-b bg-surface px-4 py-2 text-sm text-muted-foreground">
              <LockIcon className="size-3.5 shrink-0" />
              {lockedReason}
            </p>
          )}
          <fieldset disabled={!!lockedReason} className="m-0 min-w-0 border-0 p-4">
            <legend className="sr-only">{title}</legend>
            {children}
          </fieldset>
          {footer && (
            <div className="flex justify-end gap-2 border-t bg-surface px-4 py-3">{footer}</div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Local navigation of the settings area (each item a real URL). Hidden under 1024px — /settings then renders it as a page. */
function SettingsNav({
  groups,
  currentPath,
  className,
}: {
  groups: { label?: string; items: { title: string; url: string }[] }[]
  currentPath: string
  className?: string
}) {
  return (
    <nav aria-label="Settings" data-slot="settings-nav" className={cn('max-lg:hidden', className)}>
      {groups.map((g) => (
        <div key={JSON.stringify(g.items.map((item) => item.url))} className="mb-4">
          {g.label && (
            <h2 className="m-0 px-2 pb-1 text-xs font-medium text-muted-foreground">{g.label}</h2>
          )}
          <ul className="m-0 flex list-none flex-col gap-px p-0">
            {g.items.map((it) => {
              const active = currentPath === it.url || currentPath.startsWith(`${it.url}/`)
              return (
                <li key={it.url}>
                  <AppLink
                    href={it.url}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-8 items-center rounded-md px-2 text-sm no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                      active
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {it.title}
                  </AppLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** Settings nav column + settings content. */
function SettingsLayout({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      data-slot="settings-layout"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10"
    >
      {nav}
      <div className="flex min-w-0 flex-col gap-8">{children}</div>
    </div>
  )
}

export { SettingsLayout, SettingsNav, SettingsSection }
