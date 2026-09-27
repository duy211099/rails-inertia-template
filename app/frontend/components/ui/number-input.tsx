// Keel addition (not in shadcn/ui). Built on InputGroup; same conventions as the shadcn files around it.
'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import * as React from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

type NumberInputProps = Omit<
  React.ComponentProps<'input'>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'prefix'
> & {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Text before the value ("$"). */
  prefix?: React.ReactNode
  /** Text after the value ("kg", "%"). */
  suffix?: React.ReactNode
  /** −/+ steppers. Default true; hide for money and measurements. ↑/↓ keys always step, Shift ×10. */
  steppers?: boolean
}

/** Numeric entry: inputMode="decimal" (not type="number"), keyboard stepping, clamps on blur. */
function NumberInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  steppers = true,
  className,
  ...props
}: NumberInputProps) {
  const controlled = value !== undefined
  const [inner, setInner] = React.useState<number | null>(defaultValue)
  const current = controlled ? value! : inner
  const [text, setText] = React.useState(current == null ? '' : String(current))
  React.useEffect(() => setText(current == null ? '' : String(current)), [current])
  const commit = (n: number | null) => {
    const next =
      n == null || Number.isNaN(n)
        ? null
        : Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(n.toFixed(6))))
    if (!controlled) setInner(next)
    onValueChange?.(next)
    setText(next == null ? '' : String(next))
  }
  const bump = (dir: 1 | -1, mult = 1) => commit((current ?? min ?? 0) + dir * step * mult)
  return (
    <InputGroup data-slot="number-input" className={className}>
      {prefix != null && (
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text.trim() === '' ? null : Number(text.replace(/,/g, '')))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            bump(1, e.shiftKey ? 10 : 1)
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            bump(-1, e.shiftKey ? 10 : 1)
          }
          if (e.key === 'Enter') commit(text.trim() === '' ? null : Number(text))
        }}
        className="tabular-nums"
        {...props}
      />
      {suffix != null && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      )}
      {steppers && (
        <InputGroupAddon align="inline-end" className="gap-0 pr-1">
          <span className="flex flex-col">
            {[1, -1].map((d) => (
              <button
                key={d}
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => bump(d as 1 | -1)}
                className={cn(
                  'flex h-3.5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {d === 1 ? (
                  <ChevronUpIcon className="size-3" />
                ) : (
                  <ChevronDownIcon className="size-3" />
                )}
              </button>
            ))}
          </span>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export { NumberInput }
