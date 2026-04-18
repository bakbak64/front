"use client"

import { motion } from "framer-motion"
import { X, Siren } from "lucide-react"
import { SEVERITY_META, type Severity } from "@/lib/crisis-data"

export interface ToastData {
  id: string
  title: string
  description: string
  severity: Severity
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData
  onDismiss: () => void
}) {
  const meta = SEVERITY_META[toast.severity]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#0f1524]/95 p-3 pr-2 shadow-2xl backdrop-blur-xl"
    >
      {/* Left accent stripe */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: meta.color }}
      />
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
      >
        <Siren className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: meta.color, backgroundColor: `${meta.color}1A` }}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">{toast.description}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}
