'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Share2, MapPin, Trash2 } from 'lucide-react'
import { api, type Post, type Comment } from '@/lib/api'
import { CATEGORY_COLORS, relativeTime, apiUrl } from '@/lib/utils'
import ExpiryTimer from '@/components/post/ExpiryTimer'
import VoteButtons from '@/components/voting/VoteButtons'
import CommentThread from '@/components/comments/CommentThread'
import BottomNav from '@/components/nav/BottomNav'
import type { Session } from 'next-auth'

interface Props {
  post: Post
  initialComments: Comment[]
  session: Session | null
}

export default function PostDetailClient({ post: initialPost, initialComments, session }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: post } = useQuery({
    queryKey: ['post', initialPost.id],
    queryFn: () => api.getPost(initialPost.id, session?.user.accessToken),
    initialData: initialPost,
    refetchInterval: 30_000,
  })

  const { data: comments = initialComments } = useQuery({
    queryKey: ['comments', initialPost.id],
    queryFn: () => api.getComments(initialPost.id, session?.user.accessToken),
    initialData: initialComments,
  })

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => api.votePost(post!.id, value, session!.user.accessToken),
    onSuccess: (data) => {
      queryClient.setQueryData(['post', initialPost.id], (old: Post) => ({
        ...old,
        ...data,
      }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePost(post!.id, session!.user.accessToken),
    onSuccess: () => router.push('/'),
  })

  const cat = CATEGORY_COLORS[post!.category]
  const isOwner = session?.user.id === post!.author.id

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post!.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="p-2 rounded-xl hover:bg-surface-high transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <span className="font-display font-bold text-sm text-primary tracking-wider">GeoPost</span>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-surface-high transition-colors"
          >
            <Share2 className="w-5 h-5 text-on-surface-variant" />
          </button>
          {isOwner && (
            <button
              onClick={() => deleteMutation.mutate()}
              className="p-2 rounded-xl hover:bg-error/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-error" />
            </button>
          )}
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-4 pt-4">
        {/* Category + expiry */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-xs font-semibold uppercase tracking-wider font-body"
            style={{ color: cat.hex }}
          >
            {cat.label}
          </span>
          <ExpiryTimer expiresAt={post!.expiresAt} />
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-2xl text-on-surface leading-tight mb-3">
          {post!.title}
        </h1>

        {/* Author + location */}
        <div className="flex items-center gap-2 mb-4 text-sm text-on-surface-variant font-body">
          <div className="w-7 h-7 rounded-full bg-surface-high flex items-center justify-center overflow-hidden flex-shrink-0">
            {post!.author.avatar ? (
              <Image src={apiUrl(post!.author.avatar!)} alt="" width={28} height={28} className="object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">
                {post!.author.displayName[0]}
              </span>
            )}
          </div>
          <Link href={`/profile/${post!.author.username}`} className="font-medium hover:text-on-surface">
            {post!.author.displayName}
          </Link>
          <span>·</span>
          <span>{relativeTime(post!.createdAt)}</span>
          {post!.locationName && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {post!.locationName}
              </span>
            </>
          )}
        </div>

        {/* Hero image */}
        {post!.imageUrls[0] && (
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden mb-4 bg-surface-high">
            <Image
              src={apiUrl(post!.imageUrls[0])}
              alt={post!.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <p className="text-on-surface font-body text-sm leading-relaxed mb-5">{post!.content}</p>

        {/* Additional images */}
        {post!.imageUrls.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {post!.imageUrls.slice(1).map((url, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-surface-high">
                <Image src={apiUrl(url)} alt="" width={120} height={120} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Vote bar */}
        <div className="flex items-center gap-4 py-3 border-y border-surface-high mb-5">
          <VoteButtons
            upvotes={post!.upvotes}
            downvotes={post!.downvotes}
            userVote={post!.userVote}
            onVote={(v) => voteMutation.mutateAsync(v).then(() => {})}
            disabled={!session}
          />
          <span className="text-xs text-on-surface-variant font-body">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Comments */}
        <CommentThread postId={post!.id} comments={comments} />
      </article>

      <BottomNav />
    </div>
  )
}
