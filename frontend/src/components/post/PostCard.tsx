import Link from 'next/link'
import { MessageCircle, ChevronUp, MapPin, Clock } from 'lucide-react'
import type { MapPin as MapPinType } from '@/lib/api'
import { CATEGORY_COLORS, relativeTime, cn } from '@/lib/utils'
import ExpiryTimer from './ExpiryTimer'

interface PostCardProps {
  post: MapPinType
  compact?: boolean
  onClick?: () => void
}

export default function PostCard({ post, compact, onClick }: PostCardProps) {
  const cat = CATEGORY_COLORS[post.category]

  return (
    <div
      className={cn(
        'bg-surface-container rounded-3xl p-4 cursor-pointer hover:bg-surface-high transition-colors',
        compact && 'p-3'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
          style={{ background: cat.hex }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn('text-xs font-medium font-body uppercase tracking-wider', cat.text)}
            >
              {cat.label}
            </span>
            <ExpiryTimer expiresAt={post.expiresAt} />
          </div>
          <h3
            className={cn(
              'text-on-surface font-display font-semibold leading-tight line-clamp-2',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {post.title}
          </h3>
        </div>
      </div>

      {/* Event start time */}
      {post.category === 'EVENT' && post.startTime && (
        <div className="flex items-center gap-2 mt-2 text-xs font-body">
          <Clock className="w-3 h-3 text-tertiary flex-shrink-0" />
          <span className="text-on-surface-variant">Starts</span>
          <span className="text-on-surface">
            {new Date(post.startTime).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-on-surface-variant text-xs">
          <MapPin className="w-3 h-3" />
          <span className="font-body truncate max-w-[140px]">
            {post.author.displayName}
          </span>
          <span>·</span>
          <span>{relativeTime(post.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant text-xs">
          <span className="flex items-center gap-1">
            <ChevronUp className="w-3 h-3" />
            {post.upvotes - post.downvotes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {post.commentCount}
          </span>
        </div>
      </div>
    </div>
  )
}
