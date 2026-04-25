import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { flash } = usePage().props as { flash?: { notice?: string; alert?: string } }

  useEffect(() => {
    if (flash?.notice) toast.success(flash.notice)
    if (flash?.alert) toast.error(flash.alert)
  }, [flash?.notice, flash?.alert])

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      {children}
    </>
  )
}
