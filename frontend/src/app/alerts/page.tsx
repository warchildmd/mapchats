'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { AlertTriangle, MapPin } from 'lucide-react'
import Link from 'next/link'
import { api, type MapPin as Pin } from '@/lib/api'
import { useGeolocation } from '@/hooks/useGeolocation'
import { relativeTime } from '@/lib/utils'
import BottomNav from '@/components/nav/BottomNav'
import ExpiryTimer from '@/components/post/ExpiryTimer'

// Build a bounding box ~50 km around a point
function buildBbox(lat: number, lng: number) {
  const LAT_D = 0.45  // ~50 km
  const LNG_D = 0.65
  return { sw_lat: lat - LAT_D, ne_lat: lat + LAT_D, sw_lng: lng - LNG_D, ne_lng: lng + LNG_D }
}

// World bbox fallback when geolocation is unavailable
const WORLD_BBOX = { sw_lat: -90, ne_lat: 90, sw_lng: -180, ne_lng: 180 }

export default function AlertsPage() {
  const { data: session } = useSession()
  const geo = useGeolocation()

  const bbox = geo.granted && geo.lat && geo.lng
    ? buildBbox(geo.lat, geo.lng)
    : WORLD_BBOX

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', bbox],
    queryFn: () => api.getMapPins(bbox, session?.user.accessToken, 'ALERT'),
    refetchInterval: 60_000,
  })

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="glass-header sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-secondary" />
        <span className="font-display font-bold text-sm text-on-surface tracking-wide">Alerts</span>
        {geo.granted && (
          <span className="ml-auto flex items-center gap-1 text-xs text-on-surface-variant font-body">
            <MapPin className="w-3 h-3" />
            Near you
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <AlertTriangle className="w-10 h-10 opacity-30" />
            <p className="text-sm font-body">No active alerts in your area</p>
          </div>
        )}

        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

function AlertCard({ alert }: { alert: Pin }) {
  return (
    <Link
      href={`/post/${alert.id}`}
      className="block bg-surface-container rounded-2xl p-4 hover:bg-surface-high transition-colors border border-secondary/20"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-on-surface text-sm leading-snug line-clamp-2">
            {alert.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant font-body">
            <span>@{alert.author.username}</span>
            <span>·</span>
            <ExpiryTimer expiresAt={alert.expiresAt} />
            <span>·</span>
            <span>↑{alert.upvotes} · 💬{alert.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
