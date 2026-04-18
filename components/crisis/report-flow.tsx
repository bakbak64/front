"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Flame,
  HeartPulse,
  Car,
  Waves,
  Building2,
  ShieldAlert,
  MapPin,
  Mic,
  Upload,
  ImageIcon,
  Check,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IncidentType } from "@/lib/crisis-data"

const TYPES: { key: IncidentType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { key: "fire", label: "Fire", icon: Flame, color: "#FF3B3B" },
  { key: "medical", label: "Medical", icon: HeartPulse, color: "#FF3B3B" },
  { key: "accident", label: "Accident", icon: Car, color: "#F59E0B" },
  { key: "flood", label: "Flood", icon: Waves, color: "#3B82F6" },
  { key: "structural", label: "Structural", icon: Building2, color: "#F59E0B" },
  { key: "security", label: "Security", icon: ShieldAlert, color: "#3B82F6" },
]

type Step = 0 | 1 | 2 | 3 | 4

export function ReportFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>(0)
  const [type, setType] = useState<IncidentType | null>(null)
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const reset = () => {
    setStep(0)
    setType(null)
    setDescription("")
    setSubmitting(false)
    setDone(false)
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 300)
  }

  const submit = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1800))
    setSubmitting(false)
    setDone(true)
    setTimeout(handleClose, 2000)
  }

  const canNext =
    (step === 0 && !!type) ||
    step === 1 ||
    (step === 2 && description.trim().length > 0) ||
    step === 3

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.button
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close report flow"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="relative flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0f1524] shadow-2xl md:h-auto md:max-h-[90vh] md:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF3B3B]/10 text-[#FF3B3B]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Report an incident</p>
                  <p className="text-xs text-slate-400">Step {Math.min(step + 1, 4)} of 4</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="h-0.5 w-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF3B3B] to-[#3B82F6]"
                animate={{ width: `${((step + 1) / 4) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>

            {/* Steps — scroll container is a stable wrapper so animated children don't fight with touch scrolling */}
            <div className="relative flex-1 overflow-y-auto overscroll-contain">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-full flex-col items-center justify-center gap-4 p-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]"
                    >
                      <Check className="h-8 w-8" strokeWidth={3} />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white">Report submitted</h3>
                    <p className="max-w-xs text-sm text-slate-400">
                      Dispatch notified. First responders are being routed to your location.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={step}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    {step === 0 && <StepType value={type} onChange={setType} />}
                    {step === 1 && <StepLocation />}
                    {step === 2 && <StepDescription value={description} onChange={setDescription} />}
                    {step === 3 && <StepUpload />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!done && (
              <div className="flex items-center justify-between gap-3 border-t border-white/5 bg-[#0a0e17] px-5 py-4">
                <button
                  onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
                  disabled={step === 0}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => ((s + 1) as Step))}
                    disabled={!canNext}
                    className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0b0f19] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex min-w-[160px] items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#FF3B3B] to-[#b91c1c] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#FF3B3B]/20 transition hover:brightness-110 disabled:opacity-80"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing severity...
                      </>
                    ) : (
                      <>Submit report</>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StepType({ value, onChange }: { value: IncidentType | null; onChange: (v: IncidentType) => void }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">What's happening?</h3>
      <p className="mt-1 text-sm text-slate-400">Select the type of incident you're reporting.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {TYPES.map((t) => {
          const Icon = t.icon
          const selected = value === t.key
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-2 rounded-xl border p-5 transition",
                selected
                  ? "border-white/30 bg-white/5"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                  selected && "scale-110",
                )}
                style={{
                  backgroundColor: selected ? t.color : `${t.color}14`,
                  color: selected ? "#fff" : t.color,
                  boxShadow: selected ? `0 0 24px ${t.color}66` : undefined,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-white">{t.label}</span>
              {selected && (
                <motion.span
                  layoutId="type-ring"
                  className="absolute inset-0 rounded-xl ring-2"
                  style={{ boxShadow: `inset 0 0 0 2px ${t.color}` }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepLocation() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">Where is it?</h3>
      <p className="mt-1 text-sm text-slate-400">We've detected your location. Drag the pin to adjust.</p>

      <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 map-grid">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(11,15,25,0.7) 100%)",
          }}
        />
        {/* Pin center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="pulse-ring absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF3B3B] opacity-30" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#FF3B3B] shadow-[0_0_24px_rgba(255,59,59,0.6)]">
            <MapPin className="h-5 w-5 text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-[#3B82F6]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">Market St & 7th Ave</p>
          <p className="text-xs text-slate-400">Accuracy · 8 m</p>
        </div>
        <button className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/5">
          Edit
        </button>
      </div>
    </div>
  )
}

function StepDescription({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">Describe the situation</h3>
      <p className="mt-1 text-sm text-slate-400">The more detail, the faster the response.</p>

      <div className="relative mt-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Smoke coming from the 3rd floor window. Two people on the balcony waving..."
          rows={6}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] p-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-[#3B82F6]/50 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
        />
        <button
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0f1524] text-slate-300 transition hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
          aria-label="Record voice"
        >
          <Mic className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {value.length} / 500 characters
      </p>
    </div>
  )
}

function StepUpload() {
  const [hasImage, setHasImage] = useState(false)
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">Add a photo (optional)</h3>
      <p className="mt-1 text-sm text-slate-400">Visual evidence helps first responders prepare.</p>

      <button
        onClick={() => setHasImage((v) => !v)}
        className={cn(
          "mt-5 flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition",
          hasImage
            ? "border-[#22C55E]/40 bg-[#22C55E]/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20",
        )}
      >
        {hasImage ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E]">
              <Check className="h-6 w-6" strokeWidth={3} />
            </div>
            <p className="text-sm font-medium text-white">photo_evidence.jpg</p>
            <p className="text-xs text-slate-400">Tap to remove</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-300">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-white">Drop photo or tap to upload</p>
            <p className="text-xs text-slate-500">JPG, PNG, HEIC up to 20 MB</p>
          </>
        )}
      </button>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-xs text-slate-400">
          Photos are automatically analyzed for severity. EXIF metadata assists GPS accuracy.
        </p>
      </div>
    </div>
  )
}
