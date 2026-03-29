'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import { useRef, useCallback, useState, useEffect } from 'react'
import Map, {
  Source,
  Layer,
  Marker,
  NavigationControl,
  GeolocateControl,
  type MapRef,
  type MapMouseEvent,
  type LayerProps,
} from 'react-map-gl/maplibre'
import { Sun, Moon } from 'lucide-react'
import type { MapPin } from '@/lib/api'
import { CATEGORY_COLORS } from '@/lib/utils'
import { useGeolocation } from '@/hooks/useGeolocation'

interface MapViewProps {
  pins: MapPin[]
  onBoundsChange: (bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }) => void
  onPinClick: (pin: MapPin) => void
  onOverlappingPins?: (pins: MapPin[]) => void
  selectedPinId?: string | null
  bottomPadding?: number
}

// Free tiles — no API key required
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/positron'

const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'pins',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      'rgba(151,169,255,0.85)',
      10,
      'rgba(255,191,0,0.85)',
      30,
      'rgba(172,138,255,0.85)',
    ],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 28, 30, 36],
    'circle-stroke-width': 2,
    'circle-stroke-color': 'rgba(255,255,255,0.2)',
  },
}

const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'pins',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-size': 13,
    'text-font': ['Noto Sans Bold'],
  },
  paint: {
    'text-color': '#0e0e10',
  },
}

const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'pins',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match',
      ['get', 'category'],
      'ALERT', '#ffbf00',
      'DISCUSSION', '#97a9ff',
      'EVENT', '#ac8aff',
      '#97a9ff',
    ],
    'circle-radius': 8,
    'circle-stroke-width': 2,
    'circle-stroke-color': 'rgba(255,255,255,0.8)',
  },
}

// Pixel distance threshold for considering pins as overlapping
const OVERLAP_PX = 40

export default function MapView({ pins, onBoundsChange, onPinClick, onOverlappingPins, selectedPinId, bottomPadding = 72 }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [cursor, setCursor] = useState('grab')
  const [zoom, setZoom] = useState(2)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [lightMode, setLightMode] = useState(false)
  const geo = useGeolocation()

  const geoJson = {
    type: 'FeatureCollection' as const,
    features: pins.map((pin) => ({
      type: 'Feature' as const,
      properties: { id: pin.id, category: pin.category, engagement: pin.engagementScore },
      geometry: { type: 'Point' as const, coordinates: [pin.lng, pin.lat] },
    })),
  }

  const handleMove = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds()
    setZoom(map.getZoom())
    onBoundsChange({
      sw_lat: bounds.getSouth(),
      sw_lng: bounds.getWest(),
      ne_lat: bounds.getNorth(),
      ne_lng: bounds.getEast(),
    })
  }, [onBoundsChange])

  const handleLoad = useCallback(() => {
    setMapLoaded(true)
    handleMove()
    mapRef.current?.getMap().setPadding({ top: 0, right: 0, bottom: 72, left: 0 })
  }, [handleMove])

  const handleClusterClick = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current
    if (!map) return
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    if (!features.length) return
    const clusterId = features[0].properties?.cluster_id
    const source = map.getSource('pins') as any
    source?.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      if (err) return
      const coords = (features[0].geometry as any).coordinates
      map.easeTo({ center: [coords[0], coords[1]], zoom })
    })
  }, [])

  // Only render individual markers when zoomed past cluster threshold
  const CLUSTER_MAX_ZOOM = 14
  const showIndividualMarkers = zoom > CLUSTER_MAX_ZOOM

  // Keep camera padding in sync with bottom UI (navbar / open card)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    mapRef.current.getMap().setPadding({ top: 0, right: 0, bottom: bottomPadding, left: 0 })
  }, [bottomPadding, mapLoaded])

  // Ease to the selected pin so it appears in the visible area above the card
  useEffect(() => {
    if (!selectedPinId || !mapLoaded || !mapRef.current) return
    const pin = pins.find((p) => p.id === selectedPinId)
    if (!pin) return
    mapRef.current.easeTo({
      center: [pin.lng, pin.lat],
      duration: 350,
      padding: { top: 0, right: 0, bottom: bottomPadding, left: 0 },
    })
  }, [selectedPinId, mapLoaded, bottomPadding, pins])

  // Fly to user's location once BOTH geolocation AND map are ready
  useEffect(() => {
    if (geo.granted && geo.lat && geo.lng && mapLoaded && mapRef.current) {
      mapRef.current.flyTo({ center: [geo.lng, geo.lat], zoom: 15, duration: 1500 })
    }
  }, [geo.granted, geo.lat, geo.lng, mapLoaded])

  return (
    <Map
      ref={mapRef}
      mapStyle={lightMode ? LIGHT_STYLE : DARK_STYLE}
      initialViewState={{ latitude: 20, longitude: 0, zoom: 2 }}
      style={{ width: '100%', height: '100%' }}
      cursor={cursor}
      onMove={handleMove}
      onLoad={handleLoad}
      onClick={handleClusterClick}
      onMouseEnter={() => setCursor('pointer')}
      onMouseLeave={() => setCursor('grab')}
      interactiveLayerIds={['clusters']}
      attributionControl={false}
    >
      {/* Cluster source + layers */}
      <Source
        id="pins"
        type="geojson"
        data={geoJson}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer {...clusterLayer} />
        <Layer {...clusterCountLayer} />
        {!showIndividualMarkers && <Layer {...unclusteredPointLayer} />}
      </Source>

      {/* Individual pin markers — only shown when zoomed past cluster threshold */}
      {showIndividualMarkers && pins.map((pin) => {
        const color = CATEGORY_COLORS[pin.category].hex
        const size = Math.max(24, Math.min(44, 24 + pin.engagementScore * 0.5))
        const isSelected = pin.id === selectedPinId

        return (
          <Marker
            key={pin.id}
            latitude={pin.lat}
            longitude={pin.lng}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              const map = mapRef.current
              if (map && onOverlappingPins) {
                const clickedPx = map.project([pin.lng, pin.lat])
                const nearby = pins.filter((other) => {
                  if (other.id === pin.id) return false
                  const otherPx = map.project([other.lng, other.lat])
                  const dx = clickedPx.x - otherPx.x
                  const dy = clickedPx.y - otherPx.y
                  return Math.sqrt(dx * dx + dy * dy) < OVERLAP_PX
                })
                if (nearby.length > 0) {
                  onOverlappingPins([pin, ...nearby])
                  return
                }
              }
              onPinClick(pin)
            }}
          >
            <div
              style={{
                width: size,
                height: size,
                background: color,
                borderRadius: '50% 50% 50% 0',
                transform: `rotate(-45deg) scale(${isSelected ? 1.3 : 1})`,
                boxShadow: `0 0 0 ${size / 6}px ${color}25, 0 4px 12px rgba(0,0,0,0.4)`,
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: isSelected ? '2px solid white' : 'none',
              }}
            />
          </Marker>
        )
      })}

      <NavigationControl position="bottom-right" showCompass={false} style={{ marginBottom: '4.5rem' }} />
      <GeolocateControl position="bottom-right" trackUserLocation={true} style={{ marginBottom: '4.5rem' }} />

      {/* Light/dark map toggle */}
      <div className="absolute bottom-[4.5rem] left-[10px] z-10">
        <button
          onClick={() => setLightMode((v) => !v)}
          className="w-[29px] h-[29px] flex items-center justify-center rounded bg-white shadow border border-gray-200 hover:bg-gray-100 transition-colors"
          title={lightMode ? 'Switch to dark map' : 'Switch to light map'}
        >
          {lightMode ? <Moon className="w-4 h-4 text-gray-700" /> : <Sun className="w-4 h-4 text-gray-700" />}
        </button>
      </div>
    </Map>
  )
}
