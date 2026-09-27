import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'

/** For pages outside the app shell (marketing, auth) — still needs its own Toaster mount. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="bottom-center" />
      {children}
    </>
  )
}
