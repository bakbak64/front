"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, Loader2, MapPin, MapPinOff, Mic, Send, X } from "lucide-react"
import type { SOSStatus } from "@/hooks/use-sos"

const DURATION_SECONDS = 20
const SIZE = 208
const STROKE = 6
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

interface SOSDialogProps {
  open: boolean
  status: SOSStatus
  onHoldStart: () => void
  onHoldEnd: () => void
  onCancel: () => void
  onSendNow: () => void
}

/**
 * Full-screen SOS recorder. Shows a mic button with a 20s circular countdown
 * and a live mic-input pulse. Tapping "Send now" stops early; holding the mic
 * extends recording past 20s; "Cancel" aborts without sending.
 */
export function SOSDialog({
  open,
  status,
  onHoldStart,
  onHoldEnd,
  onCancel,
  onSendNow,
}: SOSDialogProps) {
  const { phase, seconds, audioLevel, held, location, locationDenied, error } =
    status

  const recording = phase === "recording" || phase === "locating"
  const sending = phase === "uploading"
  const sent = phase === "sent"
  const failed = phase === "error"

  // Progress fills from 0 → 1 over 20 seconds. Once held past the default,
  // we pin the ring at "full" (empty ring) so the UI makes sense.
  const progress = Math.min(1, seconds / DURATION_SECONDS)
  const remaining = Math.max(0, DURATION_SECONDS - seconds)
  const overtime = Math.max(0, seconds - DURATION_SECONDS)

  const headline = sent
    ? "SOS sent"
    : failed
      ? "SOS failed"
      : sending
        ? "Sending…"
        : phase === "locating"
          ? "Getting location…"
          : held
            ? "Keep holding to record more"
            : overtime > 0
              ? "Recording extended"
              : "Listening…"

  const subtext = sent
    ? "Dispatch received your location and audio"
    : failed
      ? (error ?? "Please try again")
      : sending
        ? "Uploading your location and audio"
        : held
          ? "Release to send immediately"
          : overtime > 0
            ? `+${overtime}s past the 20s window`
            : "Press and hold the mic to record longer"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Emergency SOS"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative flex w-full max-w-sm flex-col items-center gap-7 rounded-3xl border border-white/10 bg-[#0f1524] p-7 shadow-2xl"
          >
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-7 items-center justify-center gap-2 rounded-full bg-[#FF3B3B]/10 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF3B3B]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF3B3B] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FF3B3B]" />
                </span>
                Emergency SOS
              </div>
            </div>

            {/* Mic + countdown */}
            <div
              className="relative flex items-center justify-center"
              style={{ width: SIZE, height: SIZE }}
            >
              {/* Audio-level pulse (responds to mic input) */}
              <div
                aria-hidden
                className="absolute rounded-full bg-[#FF3B3B]/25 blur-md transition-transform duration-100 ease-out"
                style={{
                  width: SIZE,
                  height: SIZE,
                  transform: `scale(${0.78 + audioLevel * 0.45})`,
                  opacity: recording ? 0.35 + audioLevel * 0.55 : 0,
                }}
              />
              <div
                aria-hidden
                className="absolute rounded-full border border-[#FF3B3B]/40 transition-transform duration-150 ease-out"
                style={{
                  width: SIZE * 0.86,
                  height: SIZE * 0.86,
                  transform: `scale(${0.95 + audioLevel * 0.15})`,
                  opacity: recording ? 0.6 + audioLevel * 0.4 : 0,
                }}
              />

              {/* Countdown ring */}
              <svg
                width={SIZE}
                height={SIZE}
                className="absolute -rotate-90"
                aria-hidden
              >
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={STROKE}
                  fill="none"
                />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#FF3B3B"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  style={{
                    transition: "stroke-dashoffset 200ms linear",
                    filter: "drop-shadow(0 0 8px rgba(255,59,59,0.6))",
                  }}
                />
              </svg>

              {/* Mic button */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  onHoldStart()
                }}
                onPointerUp={onHoldEnd}
                onPointerCancel={onHoldEnd}
                onPointerLeave={onHoldEnd}
                onContextMenu={(e) => e.preventDefault()}
                disabled={sending || sent}
                className={[
                  "relative flex h-28 w-28 select-none items-center justify-center rounded-full text-white shadow-[0_0_40px_rgba(255,59,59,0.35)] transition-all duration-150 active:scale-95 disabled:opacity-80",
                  sent
                    ? "bg-gradient-to-br from-[#22C55E] to-[#15803D]"
                    : failed
                      ? "bg-gradient-to-br from-[#F59E0B] to-[#b45309]"
                      : "bg-gradient-to-br from-[#FF3B3B] to-[#b91c1c]",
                  held ? "scale-[1.04]" : "",
                ].join(" ")}
                aria-label="Hold to record longer"
              >
                {sent ? (
                  <Check className="h-11 w-11" strokeWidth={3} />
                ) : sending ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <Mic className="h-11 w-11" />
                )}
              </button>

              {/* Countdown number */}
              <div
                className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full text-xs font-mono tabular-nums tracking-wide text-slate-400"
                aria-live="polite"
              >
                {recording
                  ? overtime > 0
                    ? `+${overtime}s`
                    : `${remaining}s remaining`
                  : sending
                    ? "uploading…"
                    : sent
                      ? "delivered"
                      : ""}
              </div>
            </div>

            {/* Location indicator */}
            <div
              className={[
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors",
                location
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : locationDenied
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-white/10 bg-white/[0.04] text-slate-400",
              ].join(" ")}
              aria-live="polite"
            >
              {locationDenied ? (
                <MapPinOff className="h-3.5 w-3.5" />
              ) : (
                <MapPin
                  className={[
                    "h-3.5 w-3.5",
                    !location ? "animate-pulse" : "",
                  ].join(" ")}
                />
              )}
              <span className="font-mono tabular-nums">
                {location
                  ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}${
                      location.accuracy
                        ? ` · ±${Math.round(location.accuracy)}m`
                        : ""
                    }`
                  : locationDenied
                    ? "Location unavailable"
                    : "Acquiring location…"}
              </span>
            </div>

            {/* Status text */}
            <div className="px-2 text-center">
              <p className="text-base font-semibold text-white text-balance">
                {headline}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400 text-pretty">
                {subtext}
              </p>
            </div>

            {/* Actions */}
            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={sending || sent}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={onSendNow}
                disabled={!recording || sending || sent}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0b0f19] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Send now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
