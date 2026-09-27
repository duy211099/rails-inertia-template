// Keel dashboard blocks.
'use client'

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
} from 'lucide-react'
import * as React from 'react'
import { AppLink } from '@/components/app-link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type Metric = {
  label: string
  value: string
  /** direction = arrow; sentiment = colour (a rising refund rate is up AND negative). */
  change?: {
    value: string
    direction: 'up' | 'down' | 'flat'
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  comparison?: string
  href?: string
}

/** 3–5 key numbers in ONE bordered strip divided by rules — not a grid of cards. */
function MetricStrip({
  metrics,
  label = 'Key metrics',
  className,
}: {
  metrics: Metric[]
  label?: string
  className?: string
}) {
  return (
    <section
      data-slot="metric-strip"
      aria-label={label}
      className={cn('overflow-hidden rounded-lg border bg-card', className)}
    >
      <dl className="m-0 grid grid-cols-2 md:flex md:divide-x">
        {metrics.map((m, i) => {
          const body = (
            <>
              <dt className="text-sm text-muted-foreground">{m.label}</dt>
              <dd className="m-0 mt-0.5 flex flex-wrap items-baseline gap-x-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {m.value}
                </span>
                {m.change && (
                  <span
                    className={cn(
                      'inline-flex items-center text-xs font-medium tabular-nums',
                      {
                        positive: 'text-success',
                        negative: 'text-destructive',
                        neutral: 'text-muted-foreground',
                      }[m.change.sentiment]
                    )}
                  >
                    {m.change.direction === 'up' && <ArrowUpRightIcon className="size-3.5" />}
                    {m.change.direction === 'down' && <ArrowDownRightIcon className="size-3.5" />}
                    <span className="sr-only">
                      {{ up: 'Up', down: 'Down', flat: 'No change' }[m.change.direction]}{' '}
                    </span>
                    {m.change.value}
                    {m.comparison && <span className="sr-only"> {m.comparison}</span>}
                  </span>
                )}
              </dd>
            </>
          )
          return (
            <div
              key={m.label}
              className={cn('min-w-0 flex-1 max-md:border-b', i % 2 === 0 && 'max-md:border-r')}
            >
              {m.href ? (
                <AppLink
                  href={m.href}
                  className="block h-full px-4 py-3 no-underline hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  {body}
                </AppLink>
              ) : (
                <div className="px-4 py-3">{body}</div>
              )}
            </div>
          )
        })}
      </dl>
    </section>
  )
}

export type SetupStep = {
  id: string
  title: string
  description?: React.ReactNode
  complete: boolean
  action?: React.ReactNode
}

/** Onboarding checklist on the dashboard until setup is done. One step open (the first incomplete). */
function SetupGuide({
  title = 'Set up your workspace',
  steps,
  onDismiss,
  className,
}: {
  title?: string
  steps: SetupStep[]
  onDismiss?: () => void
  className?: string
}) {
  const done = steps.filter((s) => s.complete).length
  const [openId, setOpenId] = React.useState(steps.find((s) => !s.complete)?.id)
  const [expanded, setExpanded] = React.useState(true)
  const hid = React.useId()
  return (
    <section
      data-slot="setup-guide"
      aria-labelledby={hid}
      className={cn('rounded-lg border bg-card', className)}
    >
      <div className="flex items-start gap-2 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <h2 id={hid} className="m-0 text-base font-semibold">
            {title}
          </h2>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
            {done} of {steps.length} tasks complete
          </p>
          <Progress
            value={(done / steps.length) * 100}
            aria-label={`${done} of ${steps.length} tasks complete`}
            className="mt-2 h-1.5 max-w-72"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={expanded ? 'Collapse setup guide' : 'Expand setup guide'}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
        {onDismiss && done > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss setup guide"
            onClick={onDismiss}
          >
            <XIcon />
          </Button>
        )}
      </div>
      {expanded && (
        <ol className="m-0 list-none border-t p-2">
          {steps.map((s) => {
            const open = openId === s.id
            return (
              <li key={s.id} className={cn('rounded-md', open && 'bg-surface')}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? undefined : s.id)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border',
                      s.complete
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-dashed border-input'
                    )}
                  >
                    {s.complete && <CheckIcon className="size-3" strokeWidth={3} />}
                  </span>
                  <span
                    className={cn('text-sm', s.complete ? 'text-muted-foreground' : 'font-medium')}
                  >
                    {s.title}
                    <span className="sr-only">
                      {s.complete ? ' (complete)' : ' (not complete)'}
                    </span>
                  </span>
                </button>
                {open && (s.description || s.action) && (
                  <div className="pr-3 pb-3 pl-10">
                    {s.description && (
                      <p className="m-0 text-sm text-muted-foreground">{s.description}</p>
                    )}
                    {s.action && <div className="mt-2.5">{s.action}</div>}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export { MetricStrip, SetupGuide }
