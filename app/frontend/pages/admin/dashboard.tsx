import { Head, router } from '@inertiajs/react'
import { AuthNav } from '@/components/auth-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Item, Pagy } from '@/types'

type Props = {
  items: Item[]
  pagy: Pagy
}

export default function AdminDashboard({ items, pagy }: Props) {
  const goToPage = (page: number | null = 1) => {
    router.get('/admin', { page }, { preserveState: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <Head title="Admin" />

      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Admin</h1>
          <AuthNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <p className="mb-6 text-muted-foreground">
          All items across every user ({pagy.count} total)
          {pagy.pages > 1 && ` — showing ${pagy.from}-${pagy.to}`}
        </p>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No items yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    {item.description && <CardDescription>{item.description}</CardDescription>}
                  </CardHeader>
                </Card>
              ))}
            </div>

            {pagy.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagy?.prev)}
                  disabled={!pagy.prev}
                >
                  Previous
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {pagy.page} of {pagy.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagy?.next)}
                  disabled={!pagy.next}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
