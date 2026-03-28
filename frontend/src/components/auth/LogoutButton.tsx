'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={
        className ??
        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-body text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors'
      }
      aria-label="Sign out"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign out
    </button>
  )
}
