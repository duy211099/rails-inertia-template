import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Item } from '@/types'

const ITEMS_KEY = ['items']

export function useItems() {
  const queryClient = useQueryClient()

  const itemsQuery = useQuery({
    queryKey: ITEMS_KEY,
    queryFn: async (): Promise<Item[]> => {
      const data = await api('/items')
      return data.items
    },
    // Only fetch once the caller has a token — LoginCard flips this on.
    enabled: false,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api('/items', { method: 'POST', body: JSON.stringify({ item: { name } }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api(`/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  })

  const error =
    (itemsQuery.error as Error | null)?.message ??
    (createMutation.error as Error | null)?.message ??
    (deleteMutation.error as Error | null)?.message ??
    null

  return {
    items: itemsQuery.data ?? [],
    error,
    loadItems: () => queryClient.refetchQueries({ queryKey: ITEMS_KEY }),
    // Callers (ItemsPanel) fire-and-forget these — errors surface via
    // mutation.error above, so swallow the rejection here to avoid an
    // unhandled promise rejection on top of that.
    handleCreate: (name: string) => createMutation.mutateAsync(name).catch(() => {}),
    handleDelete: (id: number) => deleteMutation.mutateAsync(id).catch(() => {}),
  }
}
