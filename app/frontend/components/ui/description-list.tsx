// Keel addition (not in shadcn/ui).
import type * as React from 'react'
import { cn } from '@/lib/utils'

/** Read-only facts about a record. layout "stacked" (asides) or "inline" (term column + value). */
function DescriptionList({
  layout = 'stacked',
  className,
  ...props
}: React.ComponentProps<'dl'> & { layout?: 'stacked' | 'inline' }) {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      className={cn(
        'group/dl m-0',
        layout === 'inline'
          ? 'grid grid-cols-[minmax(120px,max-content)_1fr] gap-x-6 gap-y-2'
          : 'flex flex-col gap-3',
        className
      )}
      {...props}
    />
  )
}

function DescriptionItem({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="description-item"
      className={cn('flex flex-col gap-0.5 group-data-[layout=inline]/dl:contents', className)}
      {...props}
    />
  )
}

function DescriptionTerm({ className, ...props }: React.ComponentProps<'dt'>) {
  return (
    <dt
      data-slot="description-term"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function DescriptionDetails({ className, ...props }: React.ComponentProps<'dd'>) {
  return (
    <dd
      data-slot="description-details"
      className={cn('m-0 min-w-0 text-sm text-foreground', className)}
      {...props}
    />
  )
}

export { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm }
