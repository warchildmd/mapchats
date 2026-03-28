'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  upvotes: number
  downvotes: number
  userVote: 1 | -1 | null
  onVote: (value: 1 | -1) => Promise<void>
  disabled?: boolean
  vertical?: boolean
}

export default function VoteButtons({
  upvotes,
  downvotes,
  userVote,
  onVote,
  disabled,
  vertical = false,
}: VoteButtonsProps) {
  const [loading, setLoading] = useState(false)
  const score = upvotes - downvotes

  const handleVote = async (value: 1 | -1) => {
    if (disabled || loading) return
    setLoading(true)
    try {
      await onVote(value)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        vertical && 'flex-col'
      )}
    >
      <button
        onClick={() => handleVote(1)}
        disabled={disabled || loading}
        className={cn(
          'p-1.5 rounded-xl transition-colors',
          userVote === 1
            ? 'bg-primary/20 text-primary'
            : 'text-on-surface-variant hover:bg-surface-high hover:text-primary',
          (disabled || loading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      <span
        className={cn(
          'text-sm font-semibold font-body tabular-nums min-w-[2ch] text-center',
          score > 0 ? 'text-primary' : score < 0 ? 'text-error' : 'text-on-surface-variant'
        )}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={disabled || loading}
        className={cn(
          'p-1.5 rounded-xl transition-colors',
          userVote === -1
            ? 'bg-error/20 text-error'
            : 'text-on-surface-variant hover:bg-surface-high hover:text-error',
          (disabled || loading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  )
}
