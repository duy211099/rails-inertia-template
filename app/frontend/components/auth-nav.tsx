import { Link, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { getCsrfToken } from '@/lib/csrf'
import type { SharedProps } from '@/types'

export function AuthNav() {
  const { currentUser } = usePage<SharedProps>().props

  if (currentUser) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {currentUser.avatarUrl && (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name ?? ''}
              className="size-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium">{currentUser.name}</span>
        </div>
        <form action="/users/sign_out" method="post">
          <input type="hidden" name="_method" value="delete" />
          <input type="hidden" name="authenticity_token" value={getCsrfToken()} />
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    )
  }

  return (
    <Link href="/users/sign_in">
      <Button variant="outline" size="sm">
        Sign in
      </Button>
    </Link>
  )
}
