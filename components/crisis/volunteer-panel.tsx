"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Navigation,
  Check,
  Clock,
  MapPin,
  HandHeart,
  Sparkles,
} from "lucide-react"
import { VOLUNTEER_TASKS, SEVERITY_META } from "@/lib/crisis-data"

export function VolunteerPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed right-0 top-0 z-30 flex h-screen w-full flex-col border-l border-white/5 bg-[#0a0e17]/95 backdrop-blur-2xl md:w-[420px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22C55E]/10 text-[#22C55E]">
                <HandHeart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Nearby tasks</p>
                <p className="text-xs text-slate-400">{VOLUNTEER_TASKS.length} opportunities within 5 km</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Close volunteer panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* You are available */}
          <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/[0.04] p-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">You're available</p>
              <p className="text-xs text-slate-400">Broadcasting location · Status: Active</p>
            </div>
            <Sparkles className="h-4 w-4 text-[#22C55E]" />
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {VOLUNTEER_TASKS.map((task, i) => {
                  const meta = SEVERITY_META[task.urgency]
                  return (
                    <motion.li
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 24 }}
                    >
                      <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                style={{ color: meta.color, backgroundColor: `${meta.color}1A` }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: meta.color }}
                                />
                                {meta.label}
                              </span>
                              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                {task.skill}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-snug text-white text-pretty">
                              {task.title}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {task.distanceKm} km
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            ETA {task.eta}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#22C55E] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16a34a]">
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </button>
                          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5">
                            <Navigation className="h-3.5 w-3.5" />
                            Navigate
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </div>

          {/* Footer stats */}
          <div className="grid grid-cols-3 gap-2 border-t border-white/5 bg-[#0a0e17] p-4">
            <StatTile label="Completed" value="12" accent="#22C55E" />
            <StatTile label="Hours" value="27" accent="#3B82F6" />
            <StatTile label="Lives impacted" value="48" accent="#F59E0B" />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
      <p className="font-mono text-lg font-semibold" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  )
}
