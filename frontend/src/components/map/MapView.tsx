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
import type { MapPin } from '@/lib/api'
import { CATEGORY_COLORS } from '@/lib/utils'
import { useGeolocation } from '@/hooks/useGeolocation'

interface MapViewProps {
  pins: MapPin[]
  onBoundsChange: (bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }) => void
  onPinClick: (pin: MapPin) => void
  selectedPinId?: string | null
}

// Free dark tile — no API key required
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

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

export default function MapView({ pins, onBoundsChange, onPinClick, selectedPinId }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [cursor, setCursor] = useState('grab')
  const [zoom, setZoom] = useState(2)
  const [mapLoaded, setMapLoaded] = useState(false)
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

  // Fly to user's location once BOTH geolocation AND map are ready
  useEffect(() => {
    if (geo.granted && geo.lat && geo.lng && mapLoaded && mapRef.current) {
      mapRef.current.flyTo({ center: [geo.lng, geo.lat], zoom: 15, duration: 1500 })
    }
  }, [geo.granted, geo.lat, geo.lng, mapLoaded])

  return (
    <Map
      ref={mapRef}
      mapStyle={DARK_STYLE}
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
    </Map>
  )
}
