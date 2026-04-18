"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Locate,
  SlidersHorizontal,
  RotateCw,
  Siren,
  Bell,
  MapPin,
  X,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  INCIDENTS,
  INCIDENT_TYPE_LABEL,
  SEVERITY_META,
  type Severity,
  type Incident,
} from "@/lib/crisis-data"

interface FloatingControlsProps {
  onReport: () => void
  volunteerMode: boolean
  onVolunteerToggle: (v: boolean) => void
  filter: { severities: Set<string> }
  onFilterChange: (severities: Set<string>) => void
  onRefresh: () => void
  refreshing: boolean
  onSelectIncident: (id: string) => void
  resolvedIds?: Set<string>
}

interface NotificationItem {
  id: string
  title: string
  description: string
  severity: Severity
  timeAgo: string
  unread: boolean
  incidentId?: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Critical incident reported",
    description: "Structure fire — Market St & 7th Ave",
    severity: "critical",
    timeAgo: "2m",
    unread: true,
    incidentId: "INC-0481",
  },
  {
    id: "n2",
    title: "Cardiac emergency",
    description: "Union Square Station — CPR in progress",
    severity: "critical",
    timeAgo: "4m",
    unread: true,
    incidentId: "INC-0479",
  },
  {
    id: "n3",
    title: "Unit Engine 14 dispatched",
    description: "ETA 3 minutes to Market St",
    severity: "medium",
    timeAgo: "5m",
    unread: true,
  },
  {
    id: "n4",
    title: "Flash flood warning",
    description: "Riverside Commons — basement level",
    severity: "medium",
    timeAgo: "12m",
    unread: false,
    incidentId: "INC-0476",
  },
  {
    id: "n5",
    title: "Grid synced",
    description: "48 units online · 14 active incidents",
    severity: "low",
    timeAgo: "22m",
    unread: false,
  },
]

export function FloatingControls({
  onReport,
  volunteerMode,
  onVolunteerToggle,
  filter,
  onFilterChange,
  onRefresh,
  refreshing,
  onSelectIncident,
  resolvedIds,
}: FloatingControlsProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [query, setQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)

  const unreadCount = notifications.filter((n) => n.unread).length

  const results = useMemo<Incident[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return INCIDENTS.filter(
      (i) =>
        !resolvedIds?.has(i.id) &&
        [
          i.title,
          i.location,
          i.id,
          INCIDENT_TYPE_LABEL[i.type],
          SEVERITY_META[i.severity].label,
          i.reporter,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
    ).slice(0, 6)
  }, [query, resolvedIds])

  function handleResultClick(id: string) {
    onSelectIncident(id)
    setQuery("")
    setSearchFocused(false)
  }

  function handleNotifClick(n: NotificationItem) {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)),
    )
    if (n.incidentId) {
      onSelectIncident(n.incidentId)
      setNotifOpen(false)
    }
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  return (
    <>
      {/* Mobile top row */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex flex-col gap-3 p-4 md:hidden">
        <SearchInput
          query={query}
          setQuery={setQuery}
          focused={searchFocused}
          setFocused={setSearchFocused}
          results={results}
          onResultClick={handleResultClick}
        />
        <div className="pointer-events-auto flex items-center gap-2 self-end">
          <NotificationsButton
            unread={unreadCount}
            open={notifOpen}
            onToggle={() => setNotifOpen((v) => !v)}
          />
        </div>
      </div>

      {/* Desktop: centered search */}
      <div className="pointer-events-none absolute left-[72px] right-0 top-0 z-30 hidden p-5 md:block">
        <div className="pointer-events-auto mx-auto w-[460px]">
          <SearchInput
            query={query}
            setQuery={setQuery}
            focused={searchFocused}
            setFocused={setSearchFocused}
            results={results}
            onResultClick={handleResultClick}
          />
        </div>
      </div>

      {/* Desktop: right-side actions */}
      <div className="pointer-events-none absolute right-5 top-5 z-30 hidden items-center gap-2 md:flex">
        <div className="pointer-events-auto flex items-center gap-2">
          <NotificationsButton
            unread={unreadCount}
            open={notifOpen}
            onToggle={() => setNotifOpen((v) => !v)}
          />
        </div>
      </div>

      {/* Notifications dropdown (shared by mobile + desktop, anchored to top-right) */}
      <AnimatePresence>
        {notifOpen && (
          <NotificationsPanel
            items={notifications}
            onClose={() => setNotifOpen(false)}
            onItemClick={handleNotifClick}
            onMarkAllRead={markAllRead}
          />
        )}
      </AnimatePresence>

      {/* Right side controls (mid-height) */}
      <div className="pointer-events-none absolute right-4 top-[calc(50%+20px)] z-20 flex -translate-y-1/2 flex-col gap-2 md:right-5">
        <ControlButton label="My Location" icon={Locate} onClick={() => {}} />
        <ControlButton
          label="Filter"
          icon={SlidersHorizontal}
          onClick={() => setFilterOpen((v) => !v)}
          active={filterOpen}
        />
        <ControlButton
          label="Refresh"
          icon={RotateCw}
          onClick={onRefresh}
          spinning={refreshing}
        />

        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto absolute right-14 top-12 w-56 rounded-xl border border-white/10 bg-[#0f1524]/95 p-3 shadow-2xl backdrop-blur-xl"
            >
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Severity
              </p>
              <div className="flex flex-col gap-1">
                {(["critical", "medium", "low"] as Severity[]).map((sev) => {
                  const meta = SEVERITY_META[sev]
                  const checked = filter.severities.has(sev)
                  return (
                    <label
                      key={sev}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          const next = new Set(filter.severities)
                          if (checked) next.delete(sev)
                          else next.add(sev)
                          onFilterChange(next)
                        }}
                      />
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border transition",
                          checked ? "border-transparent" : "border-white/20",
                        )}
                        style={checked ? { backgroundColor: meta.color } : undefined}
                      >
                        {checked && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white">
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label}
                    </label>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emergency FAB — opens the SOS recorder dialog. */}
      <motion.button
        onClick={onReport}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto absolute bottom-20 left-4 z-30 flex select-none items-center gap-2.5 rounded-full bg-gradient-to-br from-[#FF3B3B] to-[#b91c1c] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-[#FF3B3B]/30 md:bottom-6 md:left-[88px]"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <Siren className="h-4 w-4" />
        Report Emergency
      </motion.button>
    </>
  )
}

function SearchInput({
  query,
  setQuery,
  focused,
  setFocused,
  results,
  onResultClick,
}: {
  query: string
  setQuery: (v: string) => void
  focused: boolean
  setFocused: (v: boolean) => void
  results: Incident[]
  onResultClick: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [setFocused])

  const open = focused && (query.length > 0)

  return (
    <div ref={containerRef} className="pointer-events-auto relative w-full">
      <div className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-[#0f1524]/80 px-4 py-2.5 shadow-lg backdrop-blur-xl">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search location, incident, or unit..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0f1524]/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
                <Search className="h-5 w-5 text-slate-500" />
                <p className="text-sm text-slate-300">No matches for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-slate-500">
                  Try an incident ID, location, or type
                </p>
              </div>
            ) : (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {results.length} result{results.length === 1 ? "" : "s"}
                </p>
                {results.map((i) => {
                  const meta = SEVERITY_META[i.severity]
                  return (
                    <button
                      key={i.id}
                      onClick={() => onResultClick(i.id)}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"
                    >
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: meta.color,
                          boxShadow: `0 0 8px ${meta.color}80`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">
                            {i.title}
                          </p>
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {i.id}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{i.location}</span>
                          <span className="text-slate-600">·</span>
                          <span>{i.timeAgo}</span>
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          borderColor: `${meta.color}40`,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationsPanel({
  items,
  onClose,
  onItemClick,
  onMarkAllRead,
}: {
  items: NotificationItem[]
  onClose: () => void
  onItemClick: (n: NotificationItem) => void
  onMarkAllRead: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return
      const target = e.target as HTMLElement
      if (target.closest("[data-notif-trigger]")) return
      if (!ref.current.contains(target)) onClose()
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-auto absolute right-4 top-[68px] z-40 flex max-h-[min(70vh,520px)] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1524]/95 shadow-2xl backdrop-blur-xl md:right-5 md:top-16 md:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {items.some((n) => n.unread) && (
            <span className="rounded-full bg-[#FF3B3B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#FF3B3B]">
              {items.filter((n) => n.unread).length} new
            </span>
          )}
        </div>
        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <CheckCheck className="h-3 w-3" />
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {items.map((n) => {
          const meta = SEVERITY_META[n.severity]
          return (
            <button
              key={n.id}
              onClick={() => onItemClick(n)}
              className={cn(
                "flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5",
                n.unread && "bg-white/[0.02]",
              )}
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: meta.color,
                  boxShadow: n.unread ? `0 0 8px ${meta.color}80` : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "truncate text-sm",
                      n.unread ? "font-semibold text-white" : "font-medium text-slate-300",
                    )}
                  >
                    {n.title}
                  </p>
                  <span className="ml-auto shrink-0 text-[10px] text-slate-500">
                    {n.timeAgo}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {n.description}
                </p>
              </div>
              {n.unread && (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF3B3B]" />
              )}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

function NotificationsButton({
  unread,
  open,
  onToggle,
}: {
  unread: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      data-notif-trigger
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition",
        open
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-[#0f1524]/80 text-slate-300 hover:border-white/20 hover:text-white",
      )}
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#0f1524] bg-[#FF3B3B] px-1 font-mono text-[10px] font-bold leading-none text-white shadow-[0_0_8px_rgba(255,59,59,0.9)]">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  )
}

function ControlButton({
  label,
  icon: Icon,
  onClick,
  active,
  spinning,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  active?: boolean
  spinning?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "pointer-events-auto group relative flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition",
        active
          ? "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]"
          : "border-white/10 bg-[#0f1524]/80 text-slate-300 hover:border-white/20 hover:text-white",
      )}
      aria-label={label}
    >
      <Icon className={cn("h-4 w-4", spinning && "animate-spin")} />
      <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md border border-white/10 bg-[#0f1524]/95 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  )
}
