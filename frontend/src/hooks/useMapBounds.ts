'use client'

import { useState, useCallback } from 'react'

export interface Bounds {
  sw_lat: number
  sw_lng: number
  ne_lat: number
  ne_lng: number
}

export function useMapBounds(initial?: Bounds) {
  const [bounds, setBoundsState] = useState<Bounds | null>(initial ?? null)

  const setBounds = useCallback((b: Bounds) => {
    setBoundsState((prev) => {
      // Only update if meaningfully different (prevents excessive refetches)
      if (!prev) return b
      const eps = 0.0001
      if (
        Math.abs(b.sw_lat - prev.sw_lat) > eps ||
        Math.abs(b.sw_lng - prev.sw_lng) > eps ||
        Math.abs(b.ne_lat - prev.ne_lat) > eps ||
        Math.abs(b.ne_lng - prev.ne_lng) > eps
      )
        return b
      return prev
    })
  }, [])

  return { bounds, setBounds }
}
