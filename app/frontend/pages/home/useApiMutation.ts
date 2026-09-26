import { type UseMutationOptions, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

type Options<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  'mutationFn'
> & {
  successMessage?: string
}

// Shared success/error toast for the /api/v1 mutations under pages/home —
// they hit the JSON API via fetch, not an Inertia visit, so they never get
// the flash prop the entrypoint's router.on('flash', ...) toasts.
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  { successMessage, onSuccess, ...options }: Options<TData, TVariables> = {}
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (...args) => {
      if (successMessage) toast.success(successMessage)
      return onSuccess?.(...args)
    },
    ...options,
  })
}
