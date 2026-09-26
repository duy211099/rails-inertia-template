import { useState } from 'react'
import { api } from '@/lib/api'
import type { Item } from '@/types'

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadItems = async () => {
    const data = await api('/items')
    setItems(data.items)
  }

  const handleCreate = async (name: string) => {
    setError(null)
    try {
      await api('/items', { method: 'POST', body: JSON.stringify({ item: { name } }) })
      await loadItems()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDelete = async (id: number) => {
    await api(`/items/${id}`, { method: 'DELETE' })
    await loadItems()
  }

  return { items, error, loadItems, handleCreate, handleDelete }
}
