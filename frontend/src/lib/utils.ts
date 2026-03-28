import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Format relative time (e.g. "3h ago", "2d ago") */
export function relativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/** Format remaining time until expiry */
export function timeUntil(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = d.getTime() - Date.now()
  if (diffMs <= 0) return 'expired'
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 60) return `${diffMins}m left`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h left`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d left`
}

export const CATEGORY_COLORS = {
  ALERT: { hex: '#ffbf00', bg: 'bg-secondary', text: 'text-secondary', label: 'Alert' },
  DISCUSSION: { hex: '#97a9ff', bg: 'bg-primary', text: 'text-primary', label: 'Discussion' },
  EVENT: { hex: '#ac8aff', bg: 'bg-tertiary', text: 'text-tertiary', label: 'Event' },
} as const

export type Category = keyof typeof CATEGORY_COLORS

export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  return `${base}${path}`
}
