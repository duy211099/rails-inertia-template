import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Item } from '@/types'

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

  // This CRUD hits /api/v1 via fetch, not an Inertia visit, so it never
  // gets the flash prop the entrypoint's router.on('flash', ...) toasts —
  // fire the toast here instead.
  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api('/items', { method: 'POST', body: JSON.stringify({ item: { name } }) }),
    onSuccess: () => {
      toast.success('Item created')
      itemsQuery.refetch()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api(`/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Item deleted')
      itemsQuery.refetch()
    },
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
