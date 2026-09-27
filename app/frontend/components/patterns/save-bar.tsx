// Keel block: contextual save bar for EDIT pages (create pages end with Cancel · Create …).
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

/** Sticks over the site header while the form is dirty (render from form state: open={form.isDirty}). */
function SaveBar({
  open,
  message = 'Unsaved changes',
  onDiscard,
  onSave,
  form,
  saving,
  saveLabel = 'Save',
}: {
  open: boolean
  message?: string
  onDiscard: () => void
  onSave?: () => void
  form?: string
  saving?: boolean
  saveLabel?: string
}) {
  if (!open) return null
  return (
    // biome-ignore lint/a11y/useSemanticElements: Preserve the div ref/props API of this composable wrapper.
    <div
      role="region"
      aria-label="Unsaved changes"
      data-slot="save-bar"
      className="fixed inset-x-0 top-0 z-40 flex h-12 items-center border-b bg-foreground px-4 text-background shadow-sm md:left-(--sidebar-width,0px)"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <p className="m-0 flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className="size-2 rounded-full bg-warning" />
          {message}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDiscard}
            disabled={saving}
            className="text-background hover:bg-background/15 hover:text-background"
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            type={form ? 'submit' : 'button'}
            form={form}
            disabled={saving}
          >
            {saving && <Spinner />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { SaveBar }
