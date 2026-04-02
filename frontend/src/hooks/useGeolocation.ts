'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface GeolocationState {
  lat: number | null
  lng: number | null
  error: string | null
  loading: boolean
  granted: boolean
  /** Whether the browser permission is still undecided (no prompt shown yet) */
  needsPrompt: boolean
}

const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10_000 }

/**
 * useGeolocation
 *
 * - lazy=false (default): requests position immediately on mount, same as before.
 * - lazy=true: does NOT prompt on mount. Call the returned `request()` to trigger
 *   the browser prompt. If permission was already granted the call is silent.
 *   On mount it reads the Permissions API to pre-populate `needsPrompt`.
 */
export function useGeolocation(lazy = false) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: lazy ? false : true,
    granted: false,
    needsPrompt: false,
  })

  const requested = useRef(false)

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      error: null,
      loading: false,
      granted: true,
      needsPrompt: false,
    })
  }, [])

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((s) => ({ ...s, error: err.message, loading: false, granted: false }))
  }, [])

  const request = useCallback(() => {
    if (requested.current) return
    requested.current = true
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported', loading: false }))
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts)
  }, [onSuccess, onError])

  // Eager mode: fire immediately (original behaviour)
  useEffect(() => {
    if (!lazy) {
      request()
    }
  }, [lazy, request])

  // Lazy mode: check existing permission state so UI can show the right message
  useEffect(() => {
    if (!lazy) return
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        // Already approved — silently fetch position without showing a prompt
        request()
      } else {
        // 'prompt' or 'denied'
        setState((s) => ({
          ...s,
          needsPrompt: result.state === 'prompt',
          error: result.state === 'denied' ? 'Location access was denied' : null,
        }))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lazy])

  return { ...state, request }
}
