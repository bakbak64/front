"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar, type ViewKey } from "@/components/crisis/sidebar"
import { MobileNav } from "@/components/crisis/mobile-nav"
import { MapView } from "@/components/crisis/map-view"
import { FloatingControls } from "@/components/crisis/floating-controls"
import { IncidentPanel } from "@/components/crisis/incident-panel"
import { ReportFlow } from "@/components/crisis/report-flow"
import { VolunteerPanel } from "@/components/crisis/volunteer-panel"
import { Dashboard } from "@/components/crisis/dashboard"
import { Toast, type ToastData } from "@/components/crisis/toast"
import { SettingsView } from "@/components/crisis/settings-view"
import { ProfilePanel } from "@/components/crisis/profile-panel"

export default function Page() {
  const [view, setView] = useState<ViewKey>("map")
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [volunteerMode, setVolunteerMode] = useState(false)
  const [filter, setFilter] = useState<{ severities: Set<string> }>({
    severities: new Set(["critical", "medium", "low"]),
  })
  const [refreshing, setRefreshing] = useState(false)
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [profileOpen, setProfileOpen] = useState(false)

  function handleResolve(id: string) {
    setResolvedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setSelectedIncident(null)
    pushToast({
      id: `resolve-${id}-${Date.now()}`,
      title: "Incident resolved",
      description: `${id} cleared from the grid`,
      severity: "low",
    })
  }

  // Simulate incoming incident toast
  useEffect(() => {
    const t = setTimeout(() => {
      pushToast({
        id: "welcome",
        title: "New critical incident",
        description: "Structure fire — Market St & 7th Ave",
        severity: "critical",
      })
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  function pushToast(toast: ToastData) {
    setToasts((prev) => [...prev, toast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id))
    }, 5000)
  }

  function handleSelect(key: ViewKey) {
    if (key === "report") {
      setReportOpen(true)
      return
    }
    if (key === "volunteer") {
      // Toggle volunteer mode when tapping the nav item again.
      setVolunteerMode((prev) => !prev)
      setView("map")
      setSelectedIncident(null)
      return
    }
    // Leaving the map view also exits volunteer mode so nav indicator stays truthful.
    if (key !== "map") {
      setVolunteerMode(false)
    }
    setView(key)
    if (key !== "map") setSelectedIncident(null)
  }

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      pushToast({
        id: `refresh-${Date.now()}`,
        title: "Grid synced",
        description: "14 active incidents · 48 units online",
        severity: "low",
      })
    }, 900)
  }

  const showingIncident = !!selectedIncident && view === "map"
  const showingVolunteerPanel = volunteerMode && view === "map" && !showingIncident
  // When volunteer mode is active, show "volunteer" as the active nav item
  // even though the underlying view is "map".
  const activeNav: ViewKey = volunteerMode && view === "map" ? "volunteer" : view

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        active={activeNav}
        onSelect={handleSelect}
        onProfileClick={() => setProfileOpen(true)}
      />

      {/* Main content region */}
      <div className="relative flex-1 md:pl-[72px]">
        <AnimatePresence mode="wait">
          {view === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <MapView
                selectedId={selectedIncident}
                onSelect={setSelectedIncident}
                volunteerMode={volunteerMode}
                filter={filter}
                resolvedIds={resolvedIds}
              />
              <FloatingControls
                onReport={() => setReportOpen(true)}
                volunteerMode={volunteerMode}
                onVolunteerToggle={setVolunteerMode}
                filter={filter}
                onFilterChange={(s) => setFilter({ severities: s })}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                resolvedIds={resolvedIds}
                onSelectIncident={(id) => {
                  setView("map")
                  setSelectedIncident(id)
                }}
              />
            </motion.div>
          )}

          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-y-0 left-0 right-0 md:left-[72px]"
            >
              <Dashboard
                onOpenMap={() => setView("map")}
                onSelectIncident={(id) => {
                  setSelectedIncident(id)
                  setView("map")
                }}
              />
            </motion.div>
          )}

          {view === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-y-0 left-0 right-0 md:left-[72px]"
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panels overlay */}
      <IncidentPanel
        incidentId={showingIncident ? selectedIncident : null}
        onClose={() => setSelectedIncident(null)}
        onResolve={handleResolve}
      />
      <VolunteerPanel
        open={showingVolunteerPanel}
        onClose={() => setVolunteerMode(false)}
        onTaskAction={(action, task) => {
          if (action === "accept") {
            pushToast({
              id: `accept-${task.id}-${Date.now()}`,
              title: "Task accepted",
              description: `${task.title} — dispatch notified`,
              severity: "low",
            })
          } else if (action === "navigate") {
            pushToast({
              id: `nav-${task.id}-${Date.now()}`,
              title: "Routing started",
              description: `Turn-by-turn directions to ${task.id}`,
              severity: "medium",
            })
          }
        }}
      />

      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onOpenSettings={() => {
          setVolunteerMode(false)
          setSelectedIncident(null)
          setView("settings")
        }}
      />

      {/* Report flow */}
      <ReportFlow open={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Toasts */}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:right-6 md:top-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <Toast
              key={t.id}
              toast={t}
              onDismiss={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
            />
          ))}
        </AnimatePresence>
      </div>

      <MobileNav active={activeNav} onSelect={handleSelect} />
    </main>
  )
}
