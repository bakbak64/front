"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { INCIDENTS, SEVERITY_META, type Incident } from "@/lib/crisis-data"
import { cn } from "@/lib/utils"

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<Incident | null>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [size, setSize] = useState({ w: 1, h: 1 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const incidents = useMemo(
    () =>
      INCIDENTS.filter(
        (i) => filter.severities.has(i.severity) && !resolvedIds?.has(i.id),
      ),
    [filter, resolvedIds],
  )

  const parallaxX = (mouse.x - 0.5) * 12
  const parallaxY = (mouse.y - 0.5) * 12

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-none"
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null)
      }}
    >
      {/* Map base */}
      <motion.div
        className="absolute inset-0 map-grid"
        style={{ x: parallaxX, y: parallaxY }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      >
        <StyledMap width={size.w} height={size.h} />
      </motion.div>

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(11,15,25,0.85) 100%)",
        }}
      />

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="scanline absolute left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent" />
      </div>

      {/* Markers */}
      <div className="absolute inset-0">
        {incidents.map((inc) => {
          const meta = SEVERITY_META[inc.severity]
          const isSelected = selectedId === inc.id
          const isCritical = inc.severity === "critical"

          return (
            <button
              key={inc.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(inc.id)
              }}
              onMouseEnter={() => setHovered(inc)}
              onMouseLeave={() => setHovered((h) => (h?.id === inc.id ? null : h))}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${inc.x * 100}%`, top: `${inc.y * 100}%` }}
              aria-label={`${meta.label} — ${inc.title}`}
            >
              {/* Pulse rings for critical */}
              {isCritical && (
                <>
                  <span
                    aria-hidden
                    className="pulse-ring absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: meta.color, opacity: 0.25 }}
                  />
                  <span
                    aria-hidden
                    className="pulse-ring-slow absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: meta.color, opacity: 0.18 }}
                  />
                </>
              )}

              {/* Dot */}
              <motion.span
                layout
                className={cn(
                  "relative block rounded-full ring-2 ring-white/20 transition-transform",
                  isSelected ? "h-5 w-5 scale-110" : "h-4 w-4",
                  "group-hover:scale-125",
                )}
                style={{
                  backgroundColor: meta.color,
                  boxShadow: `0 0 14px ${meta.color}`,
                }}
                whileTap={{ scale: 0.9 }}
              />

              {/* Inner white dot */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90"
              />
            </button>
          )
        })}
      </div>

      {/* Hover preview card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.id}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-20 w-64 -translate-x-1/2 -translate-y-[calc(100%+18px)] rounded-xl border border-white/10 bg-[#0f1524]/95 p-3 shadow-2xl backdrop-blur-xl"
            style={{ left: `${hovered.x * 100}%`, top: `${hovered.y * 100}%` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  color: SEVERITY_META[hovered.severity].color,
                  backgroundColor: `${SEVERITY_META[hovered.severity].color}1A`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: SEVERITY_META[hovered.severity].color }}
                />
                {SEVERITY_META[hovered.severity].label}
              </span>
              <span className="text-[10px] text-slate-400">{hovered.timeAgo}</span>
            </div>
            <h4 className="mt-2 text-sm font-semibold leading-snug text-white">
              {hovered.title}
            </h4>
            <p className="mt-1 text-xs text-slate-400">{hovered.location}</p>
          </motion.div>
        )}
      </AnimatePresence>

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

/**
 * Stylized dark map background — streets, parks, water.
 * Pure SVG to avoid tiles / external deps.
 */
function StyledMap({ width, height }: { width: number; height: number }) {
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="absolute inset-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="landGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e1524" />
          <stop offset="100%" stopColor="#0b0f19" />
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1e3a" />
          <stop offset="100%" stopColor="#0a1428" />
        </linearGradient>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(59,130,246,0.06)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Land base */}
      <rect width={w} height={h} fill="url(#landGrad)" />

      {/* Water bodies */}
      <path
        d={`M0,${h * 0.82} Q${w * 0.2},${h * 0.76} ${w * 0.45},${h * 0.84} T${w},${h * 0.9} L${w},${h} L0,${h} Z`}
        fill="url(#waterGrad)"
      />
      <path
        d={`M${w * 0.78},0 Q${w * 0.82},${h * 0.12} ${w * 0.9},${h * 0.25} L${w},${h * 0.3} L${w},0 Z`}
        fill="url(#waterGrad)"
      />

      {/* Parks */}
      <rect
        x={w * 0.56}
        y={h * 0.08}
        width={w * 0.14}
        height={h * 0.14}
        rx="8"
        fill="rgba(34,197,94,0.06)"
        stroke="rgba(34,197,94,0.12)"
      />
      <rect
        x={w * 0.08}
        y={h * 0.44}
        width={w * 0.12}
        height={h * 0.16}
        rx="8"
        fill="rgba(34,197,94,0.06)"
        stroke="rgba(34,197,94,0.12)"
      />

      {/* Districts (hatched) */}
      <rect
        x={w * 0.3}
        y={h * 0.58}
        width={w * 0.22}
        height={h * 0.12}
        fill="url(#hatch)"
        stroke="rgba(255,255,255,0.04)"
      />

      {/* Major roads */}
      <g stroke="rgba(148,163,184,0.22)" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d={`M0,${h * 0.3} L${w},${h * 0.3}`} />
        <path d={`M0,${h * 0.55} Q${w * 0.4},${h * 0.5} ${w},${h * 0.62}`} />
        <path d={`M${w * 0.38},0 L${w * 0.42},${h}`} />
        <path d={`M${w * 0.65},0 Q${w * 0.6},${h * 0.5} ${w * 0.72},${h}`} />
      </g>

      {/* Minor roads (grid of short lines) */}
      <g stroke="rgba(148,163,184,0.1)" strokeWidth="1">
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={`hl-${i}`}
            x1="0"
            y1={(h / 14) * (i + 1)}
            x2={w}
            y2={(h / 14) * (i + 1)}
          />
        ))}
        {Array.from({ length: 18 }).map((_, i) => (
          <line
            key={`vl-${i}`}
            x1={(w / 18) * (i + 1)}
            y1="0"
            x2={(w / 18) * (i + 1)}
            y2={h}
          />
        ))}
      </g>

      {/* Subtle highways (glowing) */}
      <g fill="none" strokeLinecap="round">
        <path
          d={`M0,${h * 0.42} Q${w * 0.5},${h * 0.35} ${w},${h * 0.48}`}
          stroke="rgba(59,130,246,0.35)"
          strokeWidth="1.5"
        />
        <path
          d={`M${w * 0.2},0 Q${w * 0.25},${h * 0.5} ${w * 0.15},${h}`}
          stroke="rgba(59,130,246,0.25)"
          strokeWidth="1.5"
        />
      </g>

      {/* Labels */}
      <g fill="rgba(148,163,184,0.45)" fontFamily="Inter, system-ui" fontSize="10" fontWeight="500" letterSpacing="1">
        <text x={w * 0.18} y={h * 0.2}>NORTH DISTRICT</text>
        <text x={w * 0.58} y={h * 0.17}>RIVERSIDE</text>
        <text x={w * 0.32} y={h * 0.66}>DOWNTOWN</text>
        <text x={w * 0.7} y={h * 0.55}>HARBOR</text>
        <text x={w * 0.06} y={h * 0.9} fill="rgba(59,130,246,0.55)">BAY</text>
      </g>
    </svg>
  )
}
