"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"
import { INCIDENTS } from "@/lib/crisis-data"

// Leaflet touches `window` on import, so load the real map on the client only.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b0f19] text-xs text-slate-500">
      Loading map…
    </div>
  ),
})

interface MapViewProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  volunteerMode: boolean
  filter: { severities: Set<string> }
  resolvedIds?: Set<string>
}

export function MapView({
  selectedId,
  onSelect,
  volunteerMode,
  filter,
  resolvedIds,
}: MapViewProps) {
  const visibleCount = useMemo(
    () =>
      INCIDENTS.filter(
        (i) => filter.severities.has(i.severity) && !resolvedIds?.has(i.id),
      ).length,
    [filter, resolvedIds],
  )

  return (
    <div className="relative h-full w-full overflow-hidden rounded-none">
      {/* Real OSM map */}
      <div className="absolute inset-0">
        <LeafletMap
          selectedId={selectedId}
          onSelect={onSelect}
          filter={filter}
          resolvedIds={resolvedIds}
        />
      </div>

      {/* Volunteer mode tint */}
      <AnimatePresence>
        {volunteerMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[400]"
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
        Live feed · {visibleCount} active
      </div>
    </div>
  )
}
