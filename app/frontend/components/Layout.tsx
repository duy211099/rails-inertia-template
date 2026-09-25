import type { ReactNode } from 'react'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { Toaster } from '@/components/ui/sonner'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <div className="flex justify-end p-2">
        <LocaleSwitcher />
      </div>
      {children}
    </>
  )
}
