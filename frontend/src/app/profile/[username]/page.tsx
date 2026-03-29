import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Award, MapPin, MessageCircle, ChevronUp } from 'lucide-react'
import { relativeTime, apiUrl } from '@/lib/utils'
import BottomNav from '@/components/nav/BottomNav'
import LogoutButton from '@/components/auth/LogoutButton'
import ModActions from '@/components/admin/ModActions'
import { auth } from '@/lib/auth'

interface Props {
  params: Promise<{ username: string }>
}

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'

async function fetchUser(username: string) {
  const res = await fetch(`${API_BASE}/api/users/${username}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const user = await fetchUser(username)
  if (!user) return { title: 'User not found' }
  return {
    title: `${user.displayName} (@${user.username})`,
    description: `${user.reputation.rank} · ${user.karma.toLocaleString()} karma on GeoPost`,
    openGraph: {
      title: `${user.displayName} on GeoPost`,
      images: user.avatar ? [{ url: apiUrl(user.avatar) }] : [],
    },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const [user, viewerSession] = await Promise.all([fetchUser(username), auth()])
  if (!user) notFound()

  const { reputation, badges, recentPosts = [], recentComments = [] } = user
  const viewerIsAdmin = viewerSession?.user.role === 'ADMIN'
  const viewerIsOwnProfile = viewerSession?.user.username === username

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <span className="font-display font-bold text-sm text-primary tracking-wider">GeoPost</span>
        <LogoutButton />
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Hero */}
        <div className="flex flex-col items-center mb-6 relative">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-surface-high overflow-hidden">
              {user.avatar ? (
                <Image src={apiUrl(user.avatar)} alt={user.displayName} width={96} height={96} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary font-display">
                    {user.displayName[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping-slow" />
            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 bg-primary text-surface text-xs font-bold font-display px-1.5 py-0.5 rounded-full">
              LVL {reputation.level}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-xl font-bold text-on-surface font-display">{user.displayName}</h1>
            {user.role === 'MODERATOR' && (
              <span className="text-xs font-semibold font-body px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary">
                MOD
              </span>
            )}
            {user.role === 'ADMIN' && (
              <span className="text-xs font-semibold font-body px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant font-body">@{user.username}</p>

          {viewerIsAdmin && !viewerIsOwnProfile && (
            <ModActions
              username={user.username}
              currentRole={user.role}
              currentBanned={user.banned}
            />
          )}
        </div>

        {/* Karma + Rank cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-container rounded-3xl p-4 flex items-center gap-3">
            <Star className="w-5 h-5 text-secondary flex-shrink-0" />
            <div>
              <p className="text-xs text-on-surface-variant font-body">Karma</p>
              <p className="text-lg font-bold text-on-surface font-display">
                {reputation.karma.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-surface-container rounded-3xl p-4 flex items-center gap-3">
            <Award className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-on-surface-variant font-body">Rank</p>
              <p className="text-sm font-bold text-on-surface font-display leading-tight">
                {reputation.rank}
              </p>
            </div>
          </div>
        </div>

        {/* Reputation progress */}
        <div className="bg-surface-container rounded-3xl p-4 mb-4">
          <div className="flex justify-between text-xs font-body mb-2">
            <span className="text-on-surface-variant">Next: {reputation.rank === 'Electric Cartographer' ? 'Max level' : `Level ${reputation.level + 1}`}</span>
            <span className="text-primary">{reputation.percentToNextLevel}%</span>
          </div>
          <div className="h-2 bg-surface-high rounded-full overflow-hidden">
            <div
              className="h-full bg-kinetic-gradient rounded-full transition-all duration-500"
              style={{ width: `${reputation.percentToNextLevel}%`, boxShadow: '0 0 8px #97a9ff60' }}
            />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-surface-container rounded-3xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-on-surface font-display mb-3">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 12).map((badge: any) => (
                <div
                  key={badge.id}
                  title={badge.name}
                  className="w-10 h-10 rounded-2xl bg-surface-high flex items-center justify-center text-xl"
                >
                  {badge.icon}
                </div>
              ))}
              {badges.length > 12 && (
                <div className="w-10 h-10 rounded-2xl bg-surface-high flex items-center justify-center text-xs text-on-surface-variant font-body">
                  +{badges.length - 12}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent posts */}
        {recentPosts.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-on-surface font-display mb-3">Recent Posts</h2>
            <div className="flex flex-col gap-2">
              {recentPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="bg-surface-container rounded-3xl p-4 hover:bg-surface-high transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-on-surface font-body line-clamp-2 flex-1">
                      {post.title}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant ml-3 flex-shrink-0 font-body">
                      <ChevronUp className="w-3 h-3" />
                      {post._count.votes}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant font-body">
                    {post.locationName && (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>{post.locationName}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{relativeTime(post.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity (comments) */}
        {recentComments.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-on-surface font-display mb-3">Recent Activity</h2>
            <div className="flex flex-col gap-2">
              {recentComments.map((comment: any) => (
                <Link
                  key={comment.id}
                  href={`/post/${comment.postId}`}
                  className="bg-surface-container rounded-3xl p-4 hover:bg-surface-high transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-on-surface-variant font-body mb-1">
                        on <span className="text-primary">{comment.post.title}</span>
                      </p>
                      <p className="text-sm text-on-surface font-body line-clamp-2">{comment.content}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
