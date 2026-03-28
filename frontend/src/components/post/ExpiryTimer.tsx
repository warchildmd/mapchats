'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpiryTimerProps {
  expiresAt: string | Date
  className?: string
}

function getRemaining(expiresAt: Date) {
  const ms = expiresAt.getTime() - Date.now()
  if (ms <= 0) return { label: 'expired', urgent: true, dead: true }
  const mins = Math.floor(ms / 60_000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days >= 1) return { label: `${days}d left`, urgent: false, dead: false }
  if (hours >= 1) return { label: `${hours}h left`, urgent: hours < 3, dead: false }
  return { label: `${mins}m left`, urgent: true, dead: false }
}

export default function ExpiryTimer({ expiresAt, className }: ExpiryTimerProps) {
  const date = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const [remaining, setRemaining] = useState(() => getRemaining(date))

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(date)), 60_000)
    return () => clearInterval(interval)
  }, [date])

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-body',
        remaining.dead
          ? 'text-error'
          : remaining.urgent
          ? 'text-secondary'
          : 'text-on-surface-variant',
        className
      )}
    >
      <Clock className="w-3 h-3" />
      {remaining.label}
    </span>
  )
}
