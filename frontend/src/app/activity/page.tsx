'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Activity, MessageCircle, MapPin } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { relativeTime } from '@/lib/utils'
import BottomNav from '@/components/nav/BottomNav'
import ExpiryTimer from '@/components/post/ExpiryTimer'

export default function ActivityPage() {
  const { data: session, status } = useSession()
  const username = (session?.user as any)?.username as string | undefined

  const { data: profile, isLoading } = useQuery({
    queryKey: ['activity', username],
    queryFn: () => api.getUser(username!),
    enabled: !!username,
  })

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-8">
        <Activity className="w-10 h-10 text-on-surface-variant opacity-30" />
        <p className="text-on-surface-variant font-body text-center text-sm">
          Sign in to see your activity
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-kinetic-gradient rounded-full text-surface font-semibold font-body text-sm"
        >
          Sign In
        </Link>
        <BottomNav />
      </div>
    )
  }

  const recentPosts = profile?.recentPosts ?? []
  const recentComments = profile?.recentComments ?? []
  const hasActivity = recentPosts.length > 0 || recentComments.length > 0

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="glass-header sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
        <Activity className="w-5 h-5 text-primary" />
        <span className="font-display font-bold text-sm text-on-surface tracking-wide">Activity</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {(isLoading || status === 'loading') && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && !hasActivity && status !== 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Activity className="w-10 h-10 opacity-30" />
            <p className="text-sm font-body">No activity yet — go post something!</p>
          </div>
        )}

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-3 px-1">
              Your Posts
            </h2>
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block bg-surface-container rounded-2xl p-4 hover:bg-surface-high transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-on-surface line-clamp-1">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant font-body flex-wrap">
                        <ExpiryTimer expiresAt={post.expiresAt} />
                        <span>·</span>
                        <span>↑{post.upvotes}</span>
                        <span>·</span>
                        <span>💬{post.commentCount}</span>
                        <span>·</span>
                        <span>{relativeTime(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Comments */}
        {recentComments.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-on-surface-variant font-body uppercase tracking-widest mb-3 px-1">
              Your Comments
            </h2>
            <div className="space-y-2">
              {recentComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/post/${comment.postId}`}
                  className="block bg-surface-container rounded-2xl p-4 hover:bg-surface-high transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-tertiary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle className="w-4 h-4 text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface font-body line-clamp-2">
                        {comment.content}
                      </p>
                      <p className="text-xs text-on-surface-variant font-body mt-1">
                        {relativeTime(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
