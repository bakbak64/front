"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, Map, HandHeart, Settings, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewKey = "dashboard" | "map" | "report" | "volunteer" | "settings"

const items: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "map", label: "Live Map", icon: Map },
  { key: "volunteer", label: "Volunteer Mode", icon: HandHeart },
  { key: "settings", label: "Settings", icon: Settings },
]

export function Sidebar({
  active,
  onSelect,
}: {
  active: ViewKey
  onSelect: (key: ViewKey) => void
}) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col items-center justify-between border-r border-white/5 bg-[#0a0e17]/80 py-5 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3B3B] to-[#b91c1c] shadow-lg shadow-[#FF3B3B]/20">
          <Radio className="h-5 w-5 text-white" strokeWidth={2.5} />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-xl ring-2 ring-[#FF3B3B]/60"
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-col items-center gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={cn(
                  "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  />
                )}
                {/* tooltip */}
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-white/10 bg-[#0f1524]/95 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile avatar */}
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-slate-200 transition hover:border-white/20"
        aria-label="Profile"
      >
        AM
      </button>
    </aside>
  )
}
