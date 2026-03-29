'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { api, type MapPin } from '@/lib/api'
import { CATEGORY_COLORS, relativeTime } from '@/lib/utils'
import { useMapBounds } from '@/hooks/useMapBounds'
import BottomNav from '@/components/nav/BottomNav'
import PostCard from '@/components/post/PostCard'
import FilterChips, { type FilterOption } from '@/components/map/FilterChips'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  ),
})

export default function HomePage() {
  const { data: session } = useSession()
  const { bounds, setBounds } = useMapBounds()
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [overlappingPins, setOverlappingPins] = useState<MapPin[] | null>(null)
  const [filter, setFilter] = useState<FilterOption>('all')

  const { data: pins = [] } = useQuery({
    queryKey: ['map-pins', bounds],
    queryFn: () => api.getMapPins(bounds!, session?.user.accessToken),
    enabled: !!bounds,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })

  const filteredPins =
    filter === 'all' ? pins : pins.filter((p) => p.category === filter)

  const handleBoundsChange = useCallback(
    (b: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }) => {
      setBounds(b)
    },
    [setBounds]
  )

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-surface">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          pins={filteredPins}
          onBoundsChange={handleBoundsChange}
          onPinClick={(pin) => { setOverlappingPins(null); setSelectedPin(pin) }}
          onOverlappingPins={(pins) => { setSelectedPin(null); setOverlappingPins(pins) }}
          selectedPinId={selectedPin?.id}
          bottomPadding={selectedPin || overlappingPins ? 200 : 72}
        />
      </div>

      {/* Top overlay — filter chips */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <FilterChips active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Post preview sheet */}
      {selectedPin && (
        <div
          className="absolute bottom-16 left-0 right-0 z-30 px-4 pb-2 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/post/${selectedPin.id}`}>
            <PostCard post={selectedPin} onClick={() => {}} />
          </Link>
          <button
            onClick={() => setSelectedPin(null)}
            className="absolute top-2 right-6 text-on-surface-variant text-xs hover:text-on-surface"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overlapping pins picker */}
      {overlappingPins && (
        <div
          className="absolute bottom-16 left-0 right-0 z-30 px-4 pb-2 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-surface-container rounded-3xl p-3">
            <p className="text-on-surface-variant text-xs font-body px-2 pb-1">
              {overlappingPins.length} posts at this location
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto overscroll-contain">
            {overlappingPins.map((pin) => {
              const cat = CATEGORY_COLORS[pin.category]
              return (
                <button
                  key={pin.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-high transition-colors text-left"
                  onClick={() => {
                    setOverlappingPins(null)
                    setSelectedPin(pin)
                  }}
                >
                  <div
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ background: cat.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-on-surface font-display font-semibold text-sm line-clamp-1 block">
                      {pin.title}
                    </span>
                    <span className="text-on-surface-variant text-xs font-body">
                      {cat.label} · {pin.author.displayName} · {relativeTime(pin.createdAt)}
                    </span>
                  </div>
                </button>
              )
            })}
            </div>
          </div>
          <button
            onClick={() => setOverlappingPins(null)}
            className="absolute top-2 right-6 text-on-surface-variant text-xs hover:text-on-surface"
          >
            ✕
          </button>
        </div>
      )}

      {/* Click-away to dismiss sheet */}
      {(selectedPin || overlappingPins) && (
        <div
          className="absolute inset-0 z-20"
          onClick={() => { setSelectedPin(null); setOverlappingPins(null) }}
        />
      )}

      <BottomNav />
    </div>
  )
}
