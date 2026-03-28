'use client'

import { haversineKm } from '@/lib/utils'
import { useGeolocation } from './useGeolocation'

const PROXIMITY_KM = 1

export function useProximity(targetLat: number | null, targetLng: number | null) {
  const geo = useGeolocation()

  if (!geo.granted || targetLat === null || targetLng === null) {
    return { withinRange: false, distanceKm: null, geo }
  }

  const distanceKm = haversineKm(geo.lat!, geo.lng!, targetLat, targetLng)
  const withinRange = distanceKm <= PROXIMITY_KM

  return { withinRange, distanceKm, geo }
}
