import { Head, Link, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthNav } from '@/components/auth-nav'
import type { Item } from '@/types'

type Props = {
  item: Item
}

export default function ItemShow({ item }: Props) {
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      router.delete(`/items/${item.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Head title={item.name} />

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/items">
              <Button variant="ghost" size="sm">&larr; Back</Button>
            </Link>
            <h1 className="text-2xl font-bold">Item Details</h1>
          </div>
          <AuthNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{item.name}</CardTitle>
            {item.description && (
              <CardDescription className="text-base">{item.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-sm text-muted-foreground">
              <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(item.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/items/${item.id}/edit`}>
                <Button>Edit</Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
