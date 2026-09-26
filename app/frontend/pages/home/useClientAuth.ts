import { router } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { api, clearToken, getToken } from '@/lib/api'
import type { User } from '@/types'

const USER_KEY = 'client_user'

function storedUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function useClientAuth(onAuthenticated: () => Promise<void>) {
  const [user, setUser] = useState<User | null>(storedUser)
  const [error, setError] = useState<string | null>(null)
  // A one-time code must only ever be redeemed once per page load — guards
  // against firing twice (e.g. a dev-mode double-render) racing each other
  // before either has finished writing to localStorage.
  const codeExchangeStarted = useRef(false)

  const signOutLocally = () => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setUser(null)
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
    await onAuthenticated()
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
      onAuthenticated().catch(signOutLocally)
    } else if (codeFromGoogle && !codeExchangeStarted.current) {
      codeExchangeStarted.current = true
      exchangeCode(codeFromGoogle).catch((err) => setError((err as Error).message))
    } else if (getToken()) {
      onAuthenticated().catch(signOutLocally)
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    try {
      const data = await api('/session', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      await onAuthenticated()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleLogout = async () => {
    // Token may already be expired/revoked (e.g. logged out in another tab) —
    // the server-side session still needs clearing either way, so don't let
    // a failed DELETE skip the local cleanup below.
    try {
      await api('/session', { method: 'DELETE' })
    } catch {
      // ignore — proceed to clear local state regardless
    }
    signOutLocally()
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

  return { user, error, handleLogin, handleLogout }
}
