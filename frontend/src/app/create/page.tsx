'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, MessageSquare, Calendar, MapPin, ImagePlus, Loader2, Radio } from 'lucide-react'
import Link from 'next/link'
import { api, API_BASE } from '@/lib/api'
import { apiUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useGeolocation } from '@/hooks/useGeolocation'
import BottomNav from '@/components/nav/BottomNav'

type Category = 'ALERT' | 'DISCUSSION' | 'EVENT'

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'ALERT', label: 'Alert', icon: AlertTriangle, color: 'text-secondary' },
  { value: 'DISCUSSION', label: 'Discussion', icon: MessageSquare, color: 'text-primary' },
  { value: 'EVENT', label: 'Event', icon: Calendar, color: 'text-tertiary' },
]

export default function CreatePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const geo = useGeolocation(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<Category>('DISCUSSION')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [locationName, setLocationName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // Fetch upload feature flag from backend at runtime (not baked at build time)
  const { data: uploadConfig } = useQuery({
    queryKey: ['upload-config'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/uploads/config`)
      return res.json() as Promise<{ enabled: boolean }>
    },
    staleTime: Infinity, // config doesn't change during a session
  })
  const uploadsEnabled = uploadConfig?.enabled ?? true

  // Posting is always to the user's current GPS location, so proximity is always 0
  const withinRange = geo.granted

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPost(
        {
          category,
          title,
          content,
          imageUrls,
          lat: geo.lat!,
          lng: geo.lng!,
          locationName: locationName || undefined,
          userLat: geo.lat!,
          userLng: geo.lng!,
          startTime: category === 'EVENT' && startTime ? new Date(startTime).toISOString() : undefined,
        },
        session!.user.accessToken
      ),
    onSuccess: (post) => router.push(`/post/${post.id}`),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - imageUrls.length)
    if (!files.length) return

    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const res = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session!.user.accessToken}` },
        body: formData,
      })
      const data = await res.json()
      setImageUrls((prev) => [...prev, ...data.urls])
    } finally {
      setUploading(false)
    }
  }

  const canSubmit =
    geo.granted &&
    title.trim().length >= 3 &&
    content.trim().length >= 1 &&
    !createMutation.isPending

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-on-surface-variant font-body text-center">
          You need to be signed in to create a post.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-kinetic-gradient rounded-full text-surface font-semibold font-body"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="p-2 rounded-xl hover:bg-surface-high transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <span className="font-display font-bold text-sm text-primary tracking-wider">GeoPost</span>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-semibold font-body transition-all',
            canSubmit
              ? 'bg-kinetic-gradient text-surface shadow-md shadow-primary/20'
              : 'bg-surface-high text-on-surface-variant opacity-50 cursor-not-allowed'
          )}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Publish'
          )}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Category selector */}
        <div className="flex gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium font-body transition-all',
                category === value
                  ? 'bg-surface-highest text-on-surface shadow-inner'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-high'
              )}
            >
              <Icon className={cn('w-4 h-4', category === value ? color : '')} />
              {label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's happening?"
            maxLength={120}
            className="w-full bg-surface-container rounded-2xl px-4 py-3 text-on-surface placeholder-on-surface-variant text-base font-display font-semibold outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="text-right text-xs text-on-surface-variant mt-1 font-body">
            {title.length}/120
          </div>
        </div>

        {/* Content */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe what you see, hear, or know…"
            maxLength={1000}
            rows={4}
            className="w-full bg-surface-container rounded-2xl px-4 py-3 text-on-surface placeholder-on-surface-variant text-sm font-body outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <div className="text-right text-xs text-on-surface-variant mt-1 font-body">
            {content.length}/1000
          </div>
        </div>

        {/* Event start time — only for EVENT category */}
        {category === 'EVENT' && (
          <div className="flex items-center gap-3 bg-surface-container rounded-2xl px-4 py-3">
            <Calendar className="w-4 h-4 text-tertiary flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs text-on-surface-variant font-body mb-1">
                Event start time <span className="opacity-60">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-transparent text-sm text-on-surface outline-none font-body [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        {/* Image upload — hidden when disabled via backend config */}
        {false && uploadsEnabled && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="grid grid-cols-4 gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-surface-high relative">
                  <img src={apiUrl(url)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-surface/80 text-on-surface text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {imageUrls.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-2xl bg-surface-container flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-high transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-5 h-5" />
                  )}
                  <span className="text-xs font-body">Photo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-3 bg-surface-container rounded-2xl px-4 py-3">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Location name (optional)"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none font-body"
          />
        </div>

        {/* Proximity indicator — tappable when location hasn't been approved yet */}
        <div
          role={geo.needsPrompt ? 'button' : undefined}
          tabIndex={geo.needsPrompt ? 0 : undefined}
          onClick={geo.needsPrompt ? geo.request : undefined}
          onKeyDown={geo.needsPrompt ? (e) => e.key === 'Enter' && geo.request() : undefined}
          className={cn(
            'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-body',
            geo.loading
              ? 'bg-surface-container text-on-surface-variant'
              : geo.granted
              ? 'bg-primary/10 text-primary'
              : geo.needsPrompt
              ? 'bg-surface-container text-on-surface-variant cursor-pointer hover:bg-surface-high active:bg-surface-highest transition-colors'
              : 'bg-error/10 text-error'
          )}
        >
          <div className="relative flex-shrink-0">
            <Radio className="w-4 h-4" />
            {geo.granted && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping-slow" />
            )}
          </div>
          {geo.loading
            ? 'Detecting your location…'
            : geo.granted
            ? 'Location verified — within posting range'
            : geo.needsPrompt
            ? 'Tap to enable location — required to post'
            : geo.error || 'Location access was denied'}
        </div>

        {createMutation.isError && (
          <p className="text-error text-sm font-body bg-error/10 rounded-2xl px-4 py-3">
            {createMutation.error?.message || 'Failed to publish post'}
          </p>
        )}

        {/* Bottom publish button */}
        <button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          className={cn(
            'w-full py-4 rounded-2xl text-sm font-semibold font-body transition-all flex items-center justify-center gap-2',
            canSubmit
              ? 'bg-kinetic-gradient text-surface shadow-lg shadow-primary/20'
              : 'bg-surface-high text-on-surface-variant opacity-50 cursor-not-allowed'
          )}
        >
          {createMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
          ) : (
            'Publish'
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
