"use client"

import { useEffect, useMemo } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { INCIDENTS, SEVERITY_META, type Incident } from "@/lib/crisis-data"

/**
 * Default map center (San Francisco) and zoom. The existing incidents only
 * carry normalized 0..1 coordinates, so we project them around this center
 * to produce realistic lat/lng points for OSM markers.
 */
const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194]
const DEFAULT_ZOOM = 13
const LAT_SPAN = 0.08
const LNG_SPAN = 0.12

function projectIncident(i: Incident): [number, number] {
  const lat = DEFAULT_CENTER[0] + (0.5 - i.y) * LAT_SPAN
  const lng = DEFAULT_CENTER[1] + (i.x - 0.5) * LNG_SPAN
  return [lat, lng]
}

function buildIcon(color: string, selected: boolean, critical: boolean) {
  const size = selected ? 22 : 18
  const ring = critical
    ? `<span style="position:absolute;inset:-8px;border-radius:9999px;background:${color};opacity:.25;animation:pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite"></span>`
    : ""
  const html = `
    <span style="position:relative;display:block;width:${size}px;height:${size}px">
      ${ring}
      <span style="position:absolute;inset:0;border-radius:9999px;background:${color};box-shadow:0 0 14px ${color};border:2px solid rgba(255,255,255,.25)"></span>
      <span style="position:absolute;left:50%;top:50%;width:6px;height:6px;margin-left:-3px;margin-top:-3px;border-radius:9999px;background:rgba(255,255,255,.9)"></span>
    </span>
  `
  return L.divIcon({
    html,
    className: "cg-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

/**
 * Ensures the Leaflet map resizes correctly when its container changes size
 * (e.g. sidebar open/close, orientation change). Also flies to the selected
 * incident when it changes.
 */
function MapSync({
  selectedLatLng,
}: {
  selectedLatLng: [number, number] | null
}) {
  const map = useMap()

  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    // Also invalidate on first mount (after transitions finish).
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [map])

  useEffect(() => {
    if (!selectedLatLng) return
    map.flyTo(selectedLatLng, Math.max(map.getZoom(), 14), { duration: 0.6 })
  }, [map, selectedLatLng])

  return null
}

interface LeafletMapProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  filter: { severities: Set<string> }
  resolvedIds?: Set<string>
}

export default function LeafletMap({
  selectedId,
  onSelect,
  filter,
  resolvedIds,
}: LeafletMapProps) {
  const incidents = useMemo(
    () =>
      INCIDENTS.filter(
        (i) => filter.severities.has(i.severity) && !resolvedIds?.has(i.id),
      ),
    [filter, resolvedIds],
  )

  const selectedLatLng = useMemo<[number, number] | null>(() => {
    const sel = incidents.find((i) => i.id === selectedId)
    return sel ? projectIncident(sel) : null
  }, [selectedId, incidents])

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
      style={{ background: "#0b0f19" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {incidents.map((inc) => {
        const meta = SEVERITY_META[inc.severity]
        const isSelected = selectedId === inc.id
        const icon = buildIcon(meta.color, isSelected, inc.severity === "critical")
        const pos = projectIncident(inc)
        return (
          <Marker
            key={inc.id}
            position={pos}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(inc.id),
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div
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
                    color: meta.color,
                    background: `${meta.color}1A`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 9999,
                      background: meta.color,
                      display: "inline-block",
                    }}
                  />
                  {meta.label}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f1f5f9",
                    lineHeight: 1.3,
                  }}
                >
                  {inc.title}
                </div>
                <div style={{ marginTop: 2, fontSize: 11, color: "#94a3b8" }}>
                  {inc.location}
                </div>
                <div style={{ marginTop: 2, fontSize: 11, color: "#64748b" }}>
                  {inc.timeAgo}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      <MapSync selectedLatLng={selectedLatLng} />
    </MapContainer>
  )
}
