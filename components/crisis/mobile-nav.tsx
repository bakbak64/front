"use client"

import { LayoutDashboard, Map, HandHeart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ViewKey } from "./sidebar"

const items: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "map", label: "Map", icon: Map },
  { key: "volunteer", label: "Volunteer", icon: HandHeart },
]

export function MobileNav({
  active,
  onSelect,
}: {
  active: ViewKey
  onSelect: (k: ViewKey) => void
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/5 bg-[#0a0e17]/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = active === item.key
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
              isActive ? "text-[#3B82F6]" : "text-slate-400",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
