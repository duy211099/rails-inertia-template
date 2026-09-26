import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Item } from '@/types'
import { useApiMutation } from './useApiMutation'

const ITEMS_KEY = ['items']

export function useItems() {
  const itemsQuery = useQuery({
    queryKey: ITEMS_KEY,
    queryFn: async (): Promise<Item[]> => {
      const data = await api('/items')
      return data.items
    },
    // Only fetch once the caller has a token — LoginCard flips this on.
    // queryClient.refetchQueries/invalidateQueries both skip disabled
    // queries by design, so refetching this one has to go through the
    // observer's own refetch() (itemsQuery.refetch), never those.
    enabled: false,
  })

  const createMutation = useApiMutation(
    (name: string) => api('/items', { method: 'POST', body: JSON.stringify({ item: { name } }) }),
    { successMessage: 'Item created', onSuccess: () => itemsQuery.refetch() }
  )

  const deleteMutation = useApiMutation((id: number) => api(`/items/${id}`, { method: 'DELETE' }), {
    successMessage: 'Item deleted',
    onSuccess: () => itemsQuery.refetch(),
  })

  const error =
    (itemsQuery.error as Error | null)?.message ??
    (createMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    null

  return {
    items: itemsQuery.data ?? [],
    error,
    loadItems: async () => {
      await itemsQuery.refetch()
    },
    // Callers (ItemsPanel) fire-and-forget these — errors surface via
    // mutation.error above, so swallow the rejection here to avoid an
    // unhandled promise rejection on top of that.
    handleCreate: (name: string) => createMutation.mutateAsync(name).catch(() => {}),
    handleDelete: (id: number) => deleteMutation.mutateAsync(id).catch(() => {}),
  }
}
