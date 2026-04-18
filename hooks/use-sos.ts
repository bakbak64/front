"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SOSPhase =
  | "idle"
  | "locating"
  | "recording"
  | "uploading"
  | "sent"
  | "error"

export interface SOSStatus {
  phase: SOSPhase
  seconds: number
  error?: string
}

export interface SOSResult {
  timestamp: string
  location: { lat: number; lng: number; accuracy?: number } | null
  audioSize: number
  response?: unknown
  error?: string
}

interface UseSOSOptions {
  /** Default recording duration in ms before auto-stop (when button is not held). */
  durationMs?: number
  /** Backend endpoint that receives the multipart payload. */
  endpoint?: string
  /** Notified on every phase/timer change. */
  onStatus?: (status: SOSStatus) => void
  /** Notified after upload finishes (success or failure). */
  onComplete?: (result: SOSResult) => void
}

const DEFAULT_DURATION_MS = 20_000
const DEFAULT_ENDPOINT = "/api/sos"

/**
 * SOS hook — captures geolocation, records audio via MediaRecorder, and POSTs
 * the result to the given endpoint as FormData. Supports "tap for 20s" and
 * "press and hold to extend" interaction patterns on a single button.
 */
export function useSOS(options: UseSOSOptions = {}) {
  const duration = options.durationMs ?? DEFAULT_DURATION_MS
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT

  const [status, setStatus] = useState<SOSStatus>({ phase: "idle", seconds: 0 })

  // Refs for internals so closures always see the latest values.
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const heldRef = useRef<boolean>(false)
  const activeRef = useRef<boolean>(false)
  const locationRef = useRef<SOSResult["location"]>(null)
  const optsRef = useRef(options)
  optsRef.current = options

  const updateStatus = useCallback((patch: Partial<SOSStatus>) => {
    setStatus((prev) => {
      const next: SOSStatus = { ...prev, ...patch }
      optsRef.current.onStatus?.(next)
      return next
    })
  }, [])

  const clearTimers = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current)
      tickTimerRef.current = null
    }
  }

  const releaseStream = () => {
    const stream = streamRef.current
    streamRef.current = null
    if (stream) stream.getTracks().forEach((t) => t.stop())
  }

  const captureLocation = useCallback((): Promise<SOSResult["location"]> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        console.warn("[v0][sos] geolocation API unavailable")
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        (err) => {
          console.warn("[v0][sos] geolocation denied:", err.message)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
      )
    })
  }, [])

  const uploadPayload = useCallback(
    async (audio: Blob | null) => {
      updateStatus({ phase: "uploading" })
      const result: SOSResult = {
        timestamp: new Date().toISOString(),
        location: locationRef.current,
        audioSize: audio?.size ?? 0,
      }
      try {
        const form = new FormData()
        form.append("timestamp", result.timestamp)
        if (locationRef.current) {
          form.append("lat", String(locationRef.current.lat))
          form.append("lng", String(locationRef.current.lng))
          if (locationRef.current.accuracy != null) {
            form.append("accuracy", String(locationRef.current.accuracy))
          }
        }
        if (audio && audio.size > 0) {
          form.append("audio", audio, `sos-${Date.now()}.webm`)
        }
        const res = await fetch(endpoint, { method: "POST", body: form })
        const json = await res.json().catch(() => ({}))
        result.response = json
        updateStatus({ phase: "sent" })
        optsRef.current.onComplete?.(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn("[v0][sos] upload failed:", message)
        result.error = message
        updateStatus({ phase: "error", error: message })
        optsRef.current.onComplete?.(result)
      } finally {
        // Reset to idle after a short beat so any status-driven UI can settle.
        setTimeout(() => {
          updateStatus({ phase: "idle", seconds: 0, error: undefined })
        }, 1500)
      }
    },
    [endpoint, updateStatus],
  )

  const finalize = useCallback(async () => {
    clearTimers()
    const chunks = chunksRef.current
    chunksRef.current = []
    releaseStream()
    const blob = chunks.length ? new Blob(chunks, { type: "audio/webm" }) : null
    activeRef.current = false
    await uploadPayload(blob)
  }, [uploadPayload])

  const stop = useCallback(() => {
    // Clear any pending auto-stop so it can't double-fire after we stop here.
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    const rec = recorderRef.current
    if (rec && rec.state !== "inactive") {
      // onstop handler will call finalize().
      rec.stop()
    } else if (activeRef.current) {
      // No recorder (e.g. mic denied) — finalize immediately with what we have.
      void finalize()
    }
  }, [finalize])

  const scheduleAutoStop = useCallback(
    (delayMs: number) => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      stopTimerRef.current = setTimeout(() => {
        stopTimerRef.current = null
        // If the user is still holding past the default duration, keep recording.
        if (heldRef.current) return
        stop()
      }, delayMs)
    },
    [stop],
  )

  const start = useCallback(async () => {
    if (activeRef.current) return
    activeRef.current = true
    chunksRef.current = []
    locationRef.current = null
    startedAtRef.current = Date.now()
    updateStatus({ phase: "locating", seconds: 0, error: undefined })

    // Kick off geolocation in parallel with mic prompt. It's okay if it resolves
    // after recording starts — it just needs to be ready before upload.
    void captureLocation().then((loc) => {
      locationRef.current = loc
    })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mime = (() => {
        if (typeof MediaRecorder === "undefined") return undefined
        const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
        return candidates.find((m) => MediaRecorder.isTypeSupported?.(m))
      })()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorderRef.current = rec

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        void finalize()
      }
      rec.start()

      updateStatus({ phase: "recording", seconds: 0 })

      // Elapsed-seconds ticker so callers can render a timer if they want.
      if (tickTimerRef.current) clearInterval(tickTimerRef.current)
      tickTimerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current) / 1000)
        updateStatus({ seconds: secs })
      }, 250)

      // Auto-stop after default duration unless the user is still holding.
      scheduleAutoStop(duration)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn("[v0][sos] mic permission denied:", message)
      // Proceed with a location-only payload.
      // Give geolocation a short window to resolve before uploading.
      setTimeout(() => void finalize(), 500)
    }
  }, [captureLocation, duration, finalize, scheduleAutoStop, updateStatus])

  /** Called on pointerdown / touchstart: begin hold and start recording. */
  const onHoldStart = useCallback(() => {
    heldRef.current = true
    if (!activeRef.current) void start()
  }, [start])

  /** Called on pointerup / touchend / cancel: end hold, stop if past default. */
  const onHoldEnd = useCallback(() => {
    if (!heldRef.current) return
    heldRef.current = false
    if (!activeRef.current) return
    const elapsed = Date.now() - startedAtRef.current
    if (elapsed >= duration) {
      // They held past the default — stop now.
      stop()
    }
    // Otherwise the scheduled auto-stop at `duration` will fire and, since
    // heldRef is now false, it will stop the recorder.
  }, [duration, stop])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTimers()
      releaseStream()
      const rec = recorderRef.current
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop()
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  return {
    status,
    /** Programmatically trigger a tap-style SOS (20s auto-stop, no hold). */
    trigger: start,
    /** Pointer-down handler — begins recording and marks the button as held. */
    onHoldStart,
    /** Pointer-up/cancel handler — releases the hold, stopping if past default. */
    onHoldEnd,
    /** Manually stop the recording. */
    stop,
  }
}
