"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Flame,
  HeartPulse,
  Car,
  Waves,
  Building2,
  ShieldAlert,
  Navigation,
  Share2,
  MapPin,
  Clock,
  Users,
  Radio,
  Check,
  Copy,
  MessageSquare,
  Loader2,
} from "lucide-react"
import {
  INCIDENTS,
  SEVERITY_META,
  INCIDENT_TYPE_LABEL,
  type IncidentType,
} from "@/lib/crisis-data"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  fire: Flame,
  medical: HeartPulse,
  accident: Car,
  flood: Waves,
  structural: Building2,
  security: ShieldAlert,
}

type RespondState = "idle" | "pending" | "active"

type TimelineEntry = {
  time: string
  title: string
  detail: string
  color: string
  active?: boolean
}

export function IncidentPanel({
  incidentId,
  onClose,
  onResolve,
}: {
  incidentId: string | null
  onClose: () => void
  onResolve?: (id: string) => void
}) {
  const incident = incidentId ? INCIDENTS.find((i) => i.id === incidentId) : null

  return (
    <AnimatePresence>
      {incident && (
        <motion.aside
          key={incident.id}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed right-0 top-0 z-40 flex h-screen w-full flex-col border-l border-white/5 bg-[#0a0e17]/95 backdrop-blur-2xl md:w-[420px]"
          aria-label="Incident details"
        >
          <IncidentContent
            incidentId={incident.id}
            onClose={onClose}
            onResolve={onResolve}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function IncidentContent({
  incidentId,
  onClose,
  onResolve,
}: {
  incidentId: string
  onClose: () => void
  onResolve?: (id: string) => void
}) {
  const incident = INCIDENTS.find((i) => i.id === incidentId)!
  const meta = SEVERITY_META[incident.severity]
  const Icon = TYPE_ICON[incident.type]

  // Respond flow
  const [respondState, setRespondState] = useState<RespondState>("idle")
  const [eta, setEta] = useState<number | null>(null)

  // Navigate flow
  const [navigating, setNavigating] = useState(false)

  // Share flow
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  // Resolve flow
  const [resolving, setResolving] = useState(false)

  // Extra timeline entries added by actions
  const [extraEntries, setExtraEntries] = useState<TimelineEntry[]>([])

  // Reset local state whenever the incident changes
  useEffect(() => {
    setRespondState("idle")
    setEta(null)
    setNavigating(false)
    setShareOpen(false)
    setCopied(false)
    setResolving(false)
    setExtraEntries([])
  }, [incidentId])

  function handleResolve() {
    if (resolving) return
    setResolving(true)
    // brief confirmation delay so the user sees the action register
    setTimeout(() => {
      onResolve?.(incidentId)
    }, 500)
  }

  // Close share popover on outside click
  useEffect(() => {
    if (!shareOpen) return
    function onDown(e: MouseEvent) {
      if (!shareRef.current) return
      const target = e.target as HTMLElement
      if (target.closest("[data-share-trigger]")) return
      if (!shareRef.current.contains(target)) setShareOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [shareOpen])

  function handleRespond() {
    if (respondState === "active") {
      // Toggle off ("stand down")
      setRespondState("idle")
      setEta(null)
      setExtraEntries((prev) => [
        {
          time: "now",
          title: "Stood down",
          detail: "Responder released from assignment",
          color: "#94a3b8",
          active: false,
        },
        ...prev,
      ])
      return
    }
    setRespondState("pending")
    setTimeout(() => {
      const minutes = Math.max(2, Math.round(incident.distanceKm * 1.6))
      setEta(minutes)
      setRespondState("active")
      setExtraEntries((prev) => [
        {
          time: "now",
          title: "You are responding",
          detail: `Routed to scene · ETA ${minutes}m`,
          color: "#22C55E",
          active: true,
        },
        ...prev,
      ])
    }, 700)
  }

  function handleNavigate() {
    setNavigating(true)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      incident.location,
    )}&travelmode=driving`
    // open in new tab
    window.open(url, "_blank", "noopener,noreferrer")
    setTimeout(() => setNavigating(false), 900)
  }

  async function handleShare() {
    const shareData = {
      title: `CrisisGrid — ${incident.title}`,
      text: `${SEVERITY_META[incident.severity].label.toUpperCase()} · ${incident.title} at ${incident.location}`,
      url: typeof window !== "undefined" ? window.location.href : "",
    }
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(
          shareData,
        )
        return
      } catch {
        // user cancelled or unavailable — fall through to popover
      }
    }
    setShareOpen((v) => !v)
  }

  async function handleCopyLink() {
    const text = `CrisisGrid ${incident.id} · ${incident.title} — ${incident.location}`
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function handleSms() {
    const body = encodeURIComponent(
      `CrisisGrid ${incident.id}: ${incident.title} at ${incident.location}. Severity: ${SEVERITY_META[incident.severity].label}.`,
    )
    window.location.href = `sms:?&body=${body}`
    setShareOpen(false)
  }

  const baseTimeline: TimelineEntry[] = [
    {
      time: "now",
      color: meta.color,
      title: "Unit dispatched",
      detail: "Engine 14 responding code 3",
      active: true,
    },
    {
      time: "1m ago",
      color: "#3B82F6",
      title: "Upgraded to critical",
      detail: "Dispatch supervisor confirmed",
    },
    {
      time: "2m ago",
      color: "#94a3b8",
      title: "Report received",
      detail: `Filed by ${incident.reporter}`,
    },
  ]

  const timeline = [...extraEntries, ...baseTimeline]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{incident.id}</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: meta.color, backgroundColor: `${meta.color}1A` }}
          >
            <span
              className="dot-breath h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: meta.color, color: meta.color }}
            />
            {meta.label}
          </span>
          {respondState === "active" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#22C55E]">
              <span
                className="dot-breath h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#22C55E", color: "#22C55E" }}
              />
              Responding{eta ? ` · ETA ${eta}m` : ""}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Type icon + title */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {INCIDENT_TYPE_LABEL[incident.type]}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold leading-tight text-white text-balance">
              {incident.title}
            </h2>
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <MetaTile icon={MapPin} label="Location" value={incident.location} />
          <MetaTile icon={Clock} label="Reported" value={incident.timeAgo} />
          <MetaTile
            icon={Users}
            label="Responders"
            value={`${incident.responders + (respondState === "active" ? 1 : 0)} on scene`}
          />
          <MetaTile icon={Navigation} label="Distance" value={`${incident.distanceKm} km`} />
        </div>

        {/* Description */}
        <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Situation report
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            {incident.description}
          </p>
        </div>

        {/* Image placeholder preview */}
        <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
          <div className="relative aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-[#0b0f19]">
            <div className="absolute inset-0 map-grid opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF3B3B] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF3B3B]" />
                </span>
                Live feed · Unit 214
              </div>
            </div>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.2)_3px,rgba(0,0,0,0.2)_4px)] opacity-40" />
          </div>
        </div>

        {/* Activity log */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Response timeline
          </p>
          <ol className="mt-3 space-y-0">
            {timeline.map((e, idx) => (
              <TimelineItem
                key={`${e.title}-${idx}`}
                time={e.time}
                color={e.color}
                title={e.title}
                detail={e.detail}
                active={e.active}
                last={idx === timeline.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="relative border-t border-white/5 bg-[#0a0e17] p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRespond}
            disabled={respondState === "pending"}
            className={cn(
              "group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-70",
              respondState === "active"
                ? "bg-[#22C55E] shadow-[#22C55E]/20 hover:bg-[#1cb454]"
                : "bg-[#FF3B3B] shadow-[#FF3B3B]/20 hover:bg-[#e02f2f]",
            )}
          >
            {respondState === "pending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Routing...
              </>
            ) : respondState === "active" ? (
              <>
                <Check className="h-4 w-4" />
                Responding{eta ? ` · ${eta}m` : ""}
              </>
            ) : (
              <>
                <Radio className="h-4 w-4" />
                Respond
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNavigate}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3 text-sm font-semibold text-[#3B82F6] transition hover:bg-[#3B82F6]/20"
          >
            {navigating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Navigate
          </button>

          <button
            type="button"
            data-share-trigger
            onClick={handleShare}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white",
              shareOpen && "border-white/20 bg-white/5 text-white",
            )}
            aria-label="Share incident"
            aria-expanded={shareOpen}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="pointer-events-none absolute -top-3 right-4 flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-2.5 py-1 text-[11px] font-semibold text-[#22C55E] backdrop-blur-md"
            >
              <Check className="h-3 w-3" />
              Link copied
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {shareOpen && (
            <motion.div
              ref={shareRef}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-[76px] right-4 z-10 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0f1524]/95 p-1.5 shadow-2xl backdrop-blur-xl"
            >
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
              >
                <Copy className="h-4 w-4 text-slate-400" />
                Copy link
              </button>
              <button
                onClick={handleSms}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
              >
                <MessageSquare className="h-4 w-4 text-slate-400" />
                Send via SMS
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium leading-tight text-white">{value}</p>
    </div>
  )
}

function TimelineItem({
  time,
  title,
  detail,
  color,
  active,
  last,
}: {
  time: string
  title: string
  detail: string
  color: string
  active?: boolean
  last?: boolean
}) {
  return (
    <li className="relative flex gap-3 pb-4">
      {!last && (
        <span
          aria-hidden
          className="absolute left-[7px] top-4 h-full w-px bg-white/10"
        />
      )}
      <span className="relative mt-1.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        <span
          className={cn("h-2 w-2 rounded-full", active && "dot-breath")}
          style={{ backgroundColor: color, color }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white">{title}</p>
          <span className="shrink-0 font-mono text-[10px] text-slate-500">{time}</span>
        </div>
        <p className="text-xs text-slate-400">{detail}</p>
      </div>
    </li>
  )
}
