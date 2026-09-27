// Keel addition: the shadcn "date picker" recipe (Popover + Calendar) made typeable, with ISO values.
'use client'

import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** "YYYY-MM-DD" — no time zone, posts to Rails as a Date param unchanged. */
type ISODate = string
const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromISO = (s?: string | null) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getMonth() === m - 1 ? dt : undefined
}

type DatePickerProps = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'min' | 'max'
> & {
  value?: ISODate | null
  onValueChange?: (value: ISODate | null) => void
  min?: ISODate
  max?: ISODate
  locale?: string
  /** Controlled calendar (previews/tests). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Type a date or pick it. Typing accepts ISO and locale formats; the calendar is keyboard-navigable (react-day-picker). */
function DatePicker({
  value = null,
  onValueChange,
  min,
  max,
  locale = 'en-US',
  open: openProp,
  onOpenChange,
  placeholder = 'YYYY-MM-DD',
  ...props
}: DatePickerProps) {
  const fmt = (iso: string | null) =>
    fromISO(iso)?.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) ??
    ''
  const [text, setText] = React.useState(fmt(value))
  const [openState, setOpenState] = React.useState(false)
  const open = openProp ?? openState
  const setOpen = (o: boolean) => {
    setOpenState(o)
    onOpenChange?.(o)
  }
  React.useEffect(() => setText(fmt(value)), [value, fmt])
  const commit = () => {
    if (!text.trim()) return onValueChange?.(null)
    const iso =
      fromISO(text) ?? (Number.isNaN(Date.parse(text)) ? undefined : new Date(Date.parse(text)))
    if (iso) onValueChange?.(toISO(iso))
  }
  const selected = fromISO(value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup data-slot="date-picker">
          <InputGroupInput
            value={text}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'ArrowDown' && e.altKey) {
                e.preventDefault()
                setOpen(true)
              }
            }}
            {...props}
          />
          <InputGroupAddon align="inline-end">
            <PopoverTrigger asChild>
              <InputGroupButton size="icon-xs" aria-label="Choose date">
                <CalendarIcon />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={[
            ...(min ? [{ before: fromISO(min)! }] : []),
            ...(max ? [{ after: fromISO(max)! }] : []),
          ]}
          onSelect={(d) => {
            if (d) {
              onValueChange?.(toISO(d))
              setOpen(false)
            }
          }}
          weekStartsOn={1}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, type ISODate }
