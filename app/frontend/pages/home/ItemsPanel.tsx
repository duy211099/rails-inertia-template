import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Item } from '@/types'

type Props = {
  items: Item[]
  onCreate: (name: string) => void
  onDelete: (id: number) => void
}

export function ItemsPanel({ items, onCreate, onDelete }: Props) {
  const [name, setName] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onCreate(name)
    setName('')
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              required
            />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between py-4">
              <span>{item.name}</span>
              <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground">No items yet.</p>}
      </div>
    </>
  )
}
