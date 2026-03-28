'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Comment } from '@/lib/api'
import CommentItem from './CommentItem'
import { Send } from 'lucide-react'

interface CommentThreadProps {
  postId: string
  comments: Comment[]
}

export default function CommentThread({ postId, comments }: CommentThreadProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')

  const topLevel = comments.filter((c) => !c.parentCommentId)

  const createComment = useMutation({
    mutationFn: (content: string) =>
      api.createComment(postId, content, session!.user.accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setCommentText('')
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      api.replyToComment(parentId, content, session!.user.accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const voteMutation = useMutation({
    mutationFn: ({ commentId, value }: { commentId: string; value: 1 | -1 }) =>
      api.voteComment(commentId, value, session!.user.accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => api.deleteComment(commentId, session!.user.accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const isMod = ['MODERATOR', 'ADMIN'].includes(session?.user.role ?? '')

  const handleSubmit = () => {
    if (!commentText.trim()) return
    createComment.mutate(commentText.trim())
  }

  const handleVote = async (commentId: string, value: 1 | -1) => {
    await voteMutation.mutateAsync({ commentId, value })
  }

  const handleReply = async (parentId: string, content: string) => {
    await replyMutation.mutateAsync({ parentId, content })
  }

  const handleDelete = async (commentId: string) => {
    await deleteMutation.mutateAsync(commentId)
  }

  return (
    <div>
      {/* Comment count + sort */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-on-surface font-display">
          {comments.length} Comment{comments.length !== 1 ? 's' : ''}
        </h3>
        <span className="text-xs text-on-surface-variant font-body">Trending</span>
      </div>

      {/* Comment list */}
      {topLevel.length === 0 ? (
        <p className="text-sm text-on-surface-variant font-body text-center py-6">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={comments}
              depth={0}
              onVote={handleVote}
              onReply={handleReply}
              onDelete={session ? handleDelete : undefined}
              isAuthenticated={!!session}
              viewerUserId={session?.user.id}
              isMod={isMod}
            />
          ))}
        </div>
      )}

      {/* New comment input */}
      {session ? (
        <div className="flex gap-2 mt-6">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Add a comment…"
            maxLength={2000}
            className="flex-1 bg-surface-high rounded-2xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant outline-none focus:ring-1 focus:ring-primary font-body"
          />
          <button
            onClick={handleSubmit}
            disabled={!commentText.trim() || createComment.isPending}
            className="w-10 h-10 rounded-full bg-kinetic-gradient flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity self-center"
          >
            <Send className="w-4 h-4 text-surface" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant font-body text-center mt-6">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to comment
        </p>
      )}
    </div>
  )
}
