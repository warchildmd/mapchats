'use client'

import { useState, useEffect, useCallback } from 'react'

export interface GeolocationState {
  lat: number | null
  lng: number | null
  error: string | null
  loading: boolean
  granted: boolean
}

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: true,
    granted: false,
  })

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      error: null,
      loading: false,
      granted: true,
    })
  }, [])

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((s) => ({ ...s, error: err.message, loading: false, granted: false }))
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported', loading: false }))
      return
    }

    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10_000 }

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, opts)
      return () => navigator.geolocation.clearWatch(id)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts)
    }
  }, [watch, onSuccess, onError])

  return state
}
