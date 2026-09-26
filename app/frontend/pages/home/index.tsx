import { Head } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { ItemsPanel } from './ItemsPanel'
import { LoginCard } from './LoginCard'
import { useClientAuth } from './useClientAuth'
import { useItems } from './useItems'

export default function Home() {
  const items = useItems()
  const auth = useClientAuth(items.loadItems)
  const error = auth.error ?? items.error

  return (
    <div className="min-h-screen bg-background">
      <Head title="Home" />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">Items</h1>
        <p className="mb-6 text-muted-foreground">
          A React client talking to <code>/api/v1</code> with a JWT bearer token.
        </p>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {!auth.user ? (
          <LoginCard onLogin={auth.handleLogin} />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p>
                Signed in as <strong>{auth.user.email}</strong>
              </p>
              <Button variant="outline" onClick={auth.handleLogout}>
                Log out
              </Button>
            </div>

            <ItemsPanel
              items={items.items}
              onCreate={items.handleCreate}
              onDelete={items.handleDelete}
            />
          </>
        )}
      </main>
    </div>
  )
}
