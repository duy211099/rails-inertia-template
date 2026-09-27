// Keel addition: free text with suggestions (Combobox = must pick an option; Autocomplete = typed text is valid).
'use client'

import { Popover as PopoverPrimitive } from 'radix-ui'
import * as React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type Suggestion = { value: string; label: string; description?: string }

type AutocompleteProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'onSelect'> & {
  value: string
  onValueChange: (value: string) => void
  /** Suggestions for the current text — the app filters them (usually server-side, debounced 250 ms). */
  suggestions: Suggestion[]
  onSuggestionSelect?: (s: Suggestion) => void
  loading?: boolean
  emptyMessage?: string
  /** Controlled list visibility (previews/tests). */
  open?: boolean
}

/** The input is the ARIA combobox; ↓/↑ move through suggestions, Enter picks, Esc hides the list. */
function Autocomplete({
  value,
  onValueChange,
  suggestions,
  onSuggestionSelect,
  loading,
  emptyMessage = 'No suggestions',
  open: openProp,
  className,
  ...props
}: AutocompleteProps) {
  const [focused, setFocused] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const open = openProp ?? (focused && !dismissed && value.trim().length > 0)
  const listId = React.useId()
  const pick = (s: Suggestion) => {
    onValueChange(s.label)
    onSuggestionSelect?.(s)
    setDismissed(true)
  }
  return (
    <PopoverPrimitive.Root open={open}>
      <PopoverPrimitive.Anchor asChild>
        <input
          data-slot="autocomplete"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            onValueChange(e.target.value)
            setDismissed(false)
            setActive(-1)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setDismissed(false)
              setActive((a) => Math.min(a + 1, suggestions.length - 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            }
            if (e.key === 'Escape') setDismissed(true)
            if (e.key === 'Enter' && open && suggestions[active]) {
              e.preventDefault()
              pick(suggestions[active])
            }
          }}
          className={cn(
            'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground md:text-sm',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-(--radix-popover-trigger-width) min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none"
        >
          <div role="listbox" id={listId} className="m-0 max-h-64 list-none overflow-y-auto p-0">
            {loading && (
              <div
                role="presentation"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground"
              >
                <Spinner /> Searching…
              </div>
            )}
            {!loading && suggestions.length === 0 && (
              <div role="presentation" className="px-2 py-1.5 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            )}
            {!loading &&
              suggestions.map((s, i) => (
                // biome-ignore lint/a11y/useFocusableInteractive: Focus stays on the input using aria-activedescendant.
                // biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard selection is handled by the combobox input via aria-activedescendant.
                <div
                  role="option"
                  key={s.value}
                  id={`${listId}-${i}`}
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => pick(s)}
                  className={cn(
                    'cursor-default rounded-sm px-2 py-1.5 text-sm',
                    i === active && 'bg-accent text-accent-foreground'
                  )}
                >
                  {s.label}
                  {s.description && (
                    <span className="block text-xs text-muted-foreground">{s.description}</span>
                  )}
                </div>
              ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { Autocomplete, type Suggestion }
