'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MessageCircle, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import type { Comment } from '@/lib/api'
import { relativeTime, cn } from '@/lib/utils'
import VoteButtons from '../voting/VoteButtons'

interface CommentItemProps {
  comment: Comment
  children?: Comment[]
  allComments: Comment[]
  depth?: number
  onVote: (commentId: string, value: 1 | -1) => Promise<void>
  onReply: (parentId: string, content: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  isAuthenticated: boolean
  viewerUserId?: string
  isMod?: boolean
}

const DEPTH_COLORS = ['#97a9ff', '#ac8aff', '#ffbf00', '#ff6e84']

export default function CommentItem({
  comment,
  allComments,
  depth = 0,
  onVote,
  onReply,
  onDelete,
  isAuthenticated,
  viewerUserId,
  isMod = false,
}: CommentItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canDelete = onDelete && (isMod || (viewerUserId && comment.author.id === viewerUserId))

  const handleDelete = async () => {
    if (!onDelete || deleting) return
    setDeleting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setDeleting(false)
    }
  }

  const replies = allComments.filter((c) => c.parentCommentId === comment.id)
  const hasReplies = replies.length > 0 || comment.replyCount > 0
  const accentColor = DEPTH_COLORS[depth % DEPTH_COLORS.length]

  const handleSubmitReply = async () => {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      await onReply(comment.id, replyText.trim())
      setReplyText('')
      setShowReplyInput(false)
      setExpanded(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex gap-3">
      {/* Left accent line for depth > 0 */}
      {depth > 0 && (
        <div
          className="w-0.5 flex-shrink-0 rounded-full self-stretch mt-1"
          style={{ background: `${accentColor}40` }}
        />
      )}

      <div className="flex-1 min-w-0">
        {/* Avatar + Meta */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-surface-high flex items-center justify-center flex-shrink-0 overflow-hidden">
            {comment.author.avatar ? (
              <Image
                src={comment.author.avatar}
                alt={comment.author.displayName}
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary font-display">
                {comment.author.displayName[0].toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-on-surface font-body">
            {comment.author.displayName}
          </span>
          <span className="text-xs text-on-surface-variant font-body">
            {relativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-on-surface font-body leading-relaxed mb-2">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-2">
          <VoteButtons
            upvotes={comment.upvotes}
            downvotes={comment.downvotes}
            userVote={comment.userVote}
            onVote={(v) => onVote(comment.id, v)}
            disabled={!isAuthenticated}
          />

          {isAuthenticated && (
            <button
              onClick={() => setShowReplyInput((v) => !v)}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors font-body"
            >
              <MessageCircle className="w-3 h-3" />
              Reply
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors font-body disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors font-body"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {replies.length || comment.replyCount} repl{(replies.length || comment.replyCount) === 1 ? 'y' : 'ies'}
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReplyInput && (
          <div className="mb-3 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              maxLength={2000}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitReply()}
              className="flex-1 bg-surface-high rounded-2xl px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant outline-none focus:ring-1 focus:ring-primary font-body"
            />
            <button
              onClick={handleSubmitReply}
              disabled={!replyText.trim() || submitting}
              className="px-3 py-2 bg-kinetic-gradient rounded-2xl text-xs font-semibold text-surface disabled:opacity-50 transition-opacity"
            >
              Reply
            </button>
          </div>
        )}

        {/* Nested replies */}
        {expanded && replies.length > 0 && (
          <div className="flex flex-col gap-4 mt-1">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                allComments={allComments}
                depth={depth + 1}
                onVote={onVote}
                onReply={onReply}
                onDelete={onDelete}
                isAuthenticated={isAuthenticated}
                viewerUserId={viewerUserId}
                isMod={isMod}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
