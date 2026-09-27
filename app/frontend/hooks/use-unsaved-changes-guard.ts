import { router } from '@inertiajs/react'
import { useEffect } from 'react'

/**
 * Confirms before an Inertia visit or a tab close discards dirty form state.
 * Pass `useForm().isDirty` (or an equivalent boolean).
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  message = 'Leave page? You have unsaved changes.'
) {
  useEffect(() => {
    if (!isDirty) return

    const removeListener = router.on('before', (event) => {
      if (!window.confirm(message)) {
        event.preventDefault()
      }
    })

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      removeListener()
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [isDirty, message])
}
