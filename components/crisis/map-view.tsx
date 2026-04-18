"use client"

import { useEffect, useMemo } from "react"
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { AnimatePresence, motion } from "framer-motion"
import {
  INCIDENTS,
  MAP_CENTER,
  MAP_ZOOM,
  SEVERITY_META,
  type Incident,
} from "@/lib/crisis-data"

interface MapViewProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  volunteerMode: boolean
  filter: { severities: Set<string> }
  resolvedIds?: Set<string>
}

/**
 * Build a styled HTML div-icon for a given incident severity.
 * Using divIcon sidesteps Leaflet's default marker image URLs (which break
 * with bundlers) and lets us reuse the existing pulsing-dot aesthetic.
 */
function buildIcon(incident: Incident, isSelected: boolean) {
  const meta = SEVERITY_META[incident.severity]
  const isCritical = incident.severity === "critical"
  const size = isSelected ? 22 : 18

  const html = `
    <div class="cg-marker" style="width:${size}px;height:${size}px;">
      ${
        isCritical
          ? `<span class="cg-pulse" style="background:${meta.color}"></span>
             <span class="cg-pulse cg-pulse-slow" style="background:${meta.color}"></span>`
          : ""
      }
      <span class="cg-dot" style="background:${meta.color};box-shadow:0 0 14px ${meta.color};"></span>
      <span class="cg-inner"></span>
    </div>
  `

  return L.divIcon({
    html,
    className: "cg-marker-wrapper",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

/** Fly the map to a target lat/lng whenever `selectedId` changes externally. */
function FlyToSelected({
  incident,
}: {
  incident: Incident | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!incident) return
    map.flyTo([incident.lat, incident.lng], Math.max(map.getZoom(), 14), {
      duration: 0.8,
    })
  }, [incident, map])
  return null
}

/** Clear the selection when the user clicks empty map space. */
function MapClickHandler({
  onSelect,
}: {
  onSelect: (id: string | null) => void
}) {
  useMapEvents({
    click: () => onSelect(null),
  })
  return null
}

export function MapView({
  selectedId,
  onSelect,
  volunteerMode,
  filter,
  resolvedIds,
}: MapViewProps) {
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

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full bg-background"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapClickHandler onSelect={onSelect} />
        <FlyToSelected incident={selected} />

        {incidents.map((inc) => {
          const meta = SEVERITY_META[inc.severity]
          const isSelected = selectedId === inc.id
          return (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={buildIcon(inc, isSelected)}
              eventHandlers={{
                click: () => onSelect(inc.id),
              }}
            >
              <Popup closeButton={false} className="cg-popup">
                <div className="min-w-[200px]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        color: meta.color,
                        backgroundColor: `${meta.color}1A`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {inc.timeAgo}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold leading-snug text-white">
                    {inc.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">{inc.location}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(inc.id)
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-white/10"
                  >
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Dark tint + vignette over the OSM tiles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(11,15,25,0.75) 100%)",
        }}
      />

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scanline absolute left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent" />
      </div>

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
      <div className="pointer-events-none absolute bottom-4 right-4 z-[500] flex items-center gap-2 rounded-full border border-white/10 bg-[#0f1524]/80 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
        </span>
        Live feed · {incidents.length} active
      </div>
    </div>
  )
}
