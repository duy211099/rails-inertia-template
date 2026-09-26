import { Head, router } from '@inertiajs/react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, clearToken, getToken } from '@/lib/api'
import { getCsrfToken } from '@/lib/csrf'
import type { Item, User } from '@/types'

const USER_KEY = 'client_user'

function storedUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export default function Home() {
  const [user, setUser] = useState<User | null>(storedUser)
  const [items, setItems] = useState<Item[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  // A one-time code must only ever be redeemed once per page load — guards
  // against firing twice (e.g. a dev-mode double-render) racing each other
  // before either has finished writing to localStorage.
  const codeExchangeStarted = useRef(false)

  const loadItems = async () => {
    const data = await api('/items')
    setItems(data.items)
  }

  const exchangeCode = async (code: string) => {
    // The code is single-use and dead in 60s — the actual JWT only ever
    // arrives via the Authorization response header, never in the URL.
    const data = await api('/session/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
    await loadItems()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only
  useEffect(() => {
    // Google login redirects back here with a one-time code (and any error)
    // in the URL fragment, since a full-page OAuth redirect can't return a
    // response body a fetch() call could read. Inertia's own history layer
    // re-applies window.location.hash onto the URL asynchronously on initial
    // load (it preserves hashes across visits by design), which races and
    // overwrites a plain history.replaceState() call made from here — so the
    // cleanup has to happen inside the `navigate` event, which fires only
    // after Inertia's own history write has settled.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const codeFromGoogle = hash.get('code')
    const errorFromGoogle = hash.get('error')

    if (codeFromGoogle || errorFromGoogle) {
      const stopListening = router.on('navigate', () => {
        window.history.replaceState(null, '', window.location.pathname)
        stopListening()
      })
    }

    if (errorFromGoogle) {
      setError(errorFromGoogle)
    } else if (codeFromGoogle && getToken()) {
      // Already logged in (a prior run already redeemed this code) — a
      // stray leftover fragment shouldn't retry the now-dead code and
      // surface a confusing error over what is actually a successful login.
      loadItems().catch(() => setUser(null))
    } else if (codeFromGoogle && !codeExchangeStarted.current) {
      codeExchangeStarted.current = true
      exchangeCode(codeFromGoogle).catch((err) => setError((err as Error).message))
    } else if (getToken()) {
      loadItems().catch(() => setUser(null))
    }
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const data = await api('/session', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      await loadItems()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleLogout = async () => {
    await api('/session', { method: 'DELETE' })
    clearToken()
    localStorage.removeItem(USER_KEY)
    // Logging out resets the whole Rails session (Devise/Warden clears it to
    // prevent session fixation). Inertia Rails only refreshes the XSRF-TOKEN
    // cookie on Inertia-rendered requests (see InertiaRails::Controller's
    // after_action) — this DELETE goes through the plain JSON API controller
    // instead, so the cookie stays pointing at the now-dead session. A full
    // reload re-renders the page through HomeController, which refreshes it,
    // so "Continue with Google" works again right after logging out —
    // without this, that button 422s with an invalid CSRF error.
    window.location.reload()
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api('/items', { method: 'POST', body: JSON.stringify({ item: { name } }) })
      setName('')
      await loadItems()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleDelete = async (id: number) => {
    await api(`/items/${id}`, { method: 'DELETE' })
    await loadItems()
  }

  return (
    <div className="min-h-screen bg-background">
      <Head title="Home" />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">Items</h1>
        <p className="mb-6 text-muted-foreground">
          A React client talking to <code>/api/v1</code> with a JWT bearer token.
        </p>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {!user ? (
          <Card>
            <CardHeader>
              <CardTitle>Log in</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit">Log in</Button>
              </form>

              <div className="my-4 flex items-center gap-2 text-muted-foreground text-xs">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>

              <form action="/users/auth/google_oauth2" method="post">
                <input type="hidden" name="authenticity_token" value={getCsrfToken()} />
                {/* Tells the omniauth callback to hand back a one-time code
                    (exchanged for a JWT) in the URL fragment, instead of
                    starting a cookie session. */}
                <input type="hidden" name="origin" value="client" />
                <Button type="submit" variant="outline" className="w-full">
                  Continue with Google
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p>
                Signed in as <strong>{user.email}</strong>
              </p>
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>New item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="flex gap-2">
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
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {items.length === 0 && (
                <p className="text-center text-muted-foreground">No items yet.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
