'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Bell, Plus, Activity, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/create', icon: Plus, label: 'Post', isPrimary: true },
  { href: '/activity', icon: Activity, label: 'Activity' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-header border-t border-surface-high rounded-t-3xl">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {navItems.map(({ href, icon: Icon, label, isPrimary }) => {
          const isActive = pathname === href

          if (isPrimary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-kinetic-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                  <Icon className="w-6 h-6 text-surface" />
                </div>
                <span className="text-[10px] mt-1 text-on-surface-variant font-body">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1 px-3"
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-body',
                  isActive ? 'text-primary font-medium' : 'text-on-surface-variant'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
