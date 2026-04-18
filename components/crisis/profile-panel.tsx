"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  Award,
  LogOut,
  Settings as SettingsIcon,
  BadgeCheck,
} from "lucide-react"

export function ProfilePanel({
  open,
  onClose,
  onOpenSettings,
}: {
  open: boolean
  onClose: () => void
  onOpenSettings: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed left-0 top-0 z-50 flex h-screen w-full flex-col border-r border-white/5 bg-[#0a0e17]/95 backdrop-blur-2xl md:left-[72px] md:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <p className="text-sm font-semibold text-white">Operator profile</p>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close profile panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Identity card */}
            <div className="px-5 pt-5">
              <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#3B82F6]/10 via-white/[0.02] to-transparent p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-slate-700 to-slate-900 text-base font-semibold text-white">
                    AM
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-base font-semibold text-white">
                        Alex Moreno
                      </p>
                      <BadgeCheck className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                    <p className="text-xs text-slate-400">Senior Dispatch Operator</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#22C55E]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      On duty
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                  <StatCell value="214" label="Incidents" accent="#3B82F6" />
                  <StatCell value="6m 42s" label="Avg resp" accent="#22C55E" />
                  <StatCell value="98%" label="SLA" accent="#F59E0B" />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Contact
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <InfoRow icon={Mail} value="alex.moreno@cityresponse.gov" />
                <InfoRow icon={Phone} value="+1 (415) 555-0142" />
                <InfoRow icon={MapPin} value="Grid 14 · Downtown HQ" />
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Credentials
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <InfoRow icon={ShieldCheck} value="Level 3 Dispatch Certified" />
                <InfoRow icon={Award} value="EMD, NIMS ICS-200" />
                <InfoRow icon={Clock} value="Shift: Day · 06:00–18:00" />
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onOpenSettings()
                    onClose()
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300">
                      <SettingsIcon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-white">Open settings</span>
                  </span>
                  <span className="text-xs text-slate-500">Preferences</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/10 p-3 text-sm font-semibold text-[#FF3B3B] transition hover:bg-[#FF3B3B]/15"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function StatCell({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-base font-semibold" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300">
        <Icon className="h-4 w-4" />
      </div>
      <p className="min-w-0 truncate text-sm text-slate-200">{value}</p>
    </div>
  )
}
