"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api"
import { INCIDENTS, SEVERITY_META, type Incident } from "@/lib/crisis-data"

interface MapViewProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  volunteerMode: boolean
  filter: { severities: Set<string> }
  resolvedIds?: Set<string>
}

// Default map center (downtown San Francisco) and zoom.
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }
const DEFAULT_ZOOM = 13

// Bounding box used to project the existing normalized incident.x / incident.y
// values onto real geographic coordinates. This keeps crisis-data.ts untouched.
const BOUNDS = {
  north: 37.808,
  south: 37.742,
  west: -122.485,
  east: -122.38,
}

function incidentLatLng(inc: Incident) {
  const lng = BOUNDS.west + inc.x * (BOUNDS.east - BOUNDS.west)
  const lat = BOUNDS.north - inc.y * (BOUNDS.north - BOUNDS.south)
  return { lat, lng }
}

// Dark styling that matches the command-center theme.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b93a7" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b93a7" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#10261a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3f8f5a" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#151c2e" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8b93a7" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e2a48" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a7b4cc" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#151c2e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1428" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3B82F6" }],
  },
]

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: false,
  backgroundColor: "#0b0f19",
  gestureHandling: "greedy",
  styles: MAP_STYLES,
}

const CONTAINER_STYLE = { width: "100%", height: "100%" }

export function MapView({
  selectedId,
  onSelect,
  volunteerMode,
  filter,
  resolvedIds,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  })

  const mapRef = useRef<google.maps.Map | null>(null)

  const incidents = useMemo(
    () =>
      INCIDENTS.filter(
        (i) => filter.severities.has(i.severity) && !resolvedIds?.has(i.id),
      ),
    [filter, resolvedIds],
  )

  const selected = useMemo(
    () => incidents.find((i) => i.id === selectedId) ?? null,
    [incidents, selectedId],
  )

  // When selection changes (from the map or from outside), recenter smoothly.
  useEffect(() => {
    if (!selected || !mapRef.current) return
    mapRef.current.panTo(incidentLatLng(selected))
  }, [selected])

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const handleUnmount = useCallback(() => {
    mapRef.current = null
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-none">
      {isLoaded && !loadError && (
        <GoogleMap
          mapContainerStyle={CONTAINER_STYLE}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          options={MAP_OPTIONS}
          onLoad={handleLoad}
          onUnmount={handleUnmount}
          onClick={() => onSelect(null)}
        >
          {incidents.map((inc) => {
            const meta = SEVERITY_META[inc.severity]
            const isSelected = selectedId === inc.id
            return (
              <MarkerF
                key={inc.id}
                position={incidentLatLng(inc)}
                title={inc.title}
                onClick={() => onSelect(inc.id)}
                zIndex={isSelected ? 999 : 1}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: meta.color,
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeOpacity: 0.85,
                  strokeWeight: 2,
                  scale: isSelected ? 10 : 8,
                }}
              />
            )
          })}

          {selected && (
            <InfoWindowF
              position={incidentLatLng(selected)}
              onCloseClick={() => onSelect(null)}
              options={{ pixelOffset: new google.maps.Size(0, -14) }}
            >
              <div style={{ minWidth: 180, fontFamily: "Inter, system-ui" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "2px 8px",
                      borderRadius: 9999,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      color: SEVERITY_META[selected.severity].color,
                      backgroundColor: `${SEVERITY_META[selected.severity].color}1A`,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 9999,
                        backgroundColor: SEVERITY_META[selected.severity].color,
                      }}
                    />
                    {SEVERITY_META[selected.severity].label}
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>
                    {selected.timeAgo}
                  </span>
                </div>
                <h4
                  style={{
                    margin: "6px 0 2px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0b0f19",
                  }}
                >
                  {selected.title}
                </h4>
                <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                  {selected.location}
                </p>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      )}

      {/* Loading / error state */}
      {(!isLoaded || loadError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19] text-xs text-slate-500">
          {loadError
            ? "Map failed to load"
            : apiKey
              ? "Loading map…"
              : "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"}
        </div>
      )}

      {/* Volunteer mode tint */}
      <AnimatePresence>
        {volunteerMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(34,197,94,0.08), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Status pill bottom-right */}
      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#0f1524]/80 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
        </span>
        Live feed · {incidents.length} active
      </div>
    </div>
  )
}
