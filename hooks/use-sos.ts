"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type SOSPhase =
  | "idle"
  | "locating"
  | "recording"
  | "uploading"
  | "sent"
  | "error"
  | "cancelled"

export interface SOSStatus {
  phase: SOSPhase
  seconds: number
  /** Current mic input level, 0..1. Smoothed for UI rendering. */
  audioLevel: number
  /** True while the user is holding the button past the default duration. */
  held: boolean
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

const INITIAL_STATUS: SOSStatus = {
  phase: "idle",
  seconds: 0,
  audioLevel: 0,
  held: false,
}

/**
 * SOS hook — captures geolocation, records audio via MediaRecorder, exposes a
 * live mic level for UI, and POSTs the result to the given endpoint as
 * FormData. Supports "tap for 20s auto-send" and "press and hold to extend"
 * interaction patterns on a single button. Also supports `cancel()` to abort
 * the active capture without uploading.
 */
export function useSOS(options: UseSOSOptions = {}) {
  const duration = options.durationMs ?? DEFAULT_DURATION_MS
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT

  const [status, setStatus] = useState<SOSStatus>(INITIAL_STATUS)

  // Refs for internals so closures always see the latest values.
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const heldRef = useRef<boolean>(false)
  const activeRef = useRef<boolean>(false)
  const cancelledRef = useRef<boolean>(false)
  const locationRef = useRef<SOSResult["location"]>(null)

  // Web Audio for mic level visualization.
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const smoothLevelRef = useRef<number>(0)

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
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const releaseStream = () => {
    const stream = streamRef.current
    streamRef.current = null
    if (stream) stream.getTracks().forEach((t) => t.stop())

    const ctx = audioCtxRef.current
    audioCtxRef.current = null
    analyserRef.current = null
    smoothLevelRef.current = 0
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {
        /* ignore */
      })
    }
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
      updateStatus({ phase: "uploading", audioLevel: 0 })
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
          setStatus(INITIAL_STATUS)
          optsRef.current.onStatus?.(INITIAL_STATUS)
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
    activeRef.current = false
    if (cancelledRef.current) {
      // Discard everything — treat as cancelled.
      cancelledRef.current = false
      updateStatus({ phase: "cancelled", seconds: 0, audioLevel: 0, held: false })
      setTimeout(() => {
        setStatus(INITIAL_STATUS)
        optsRef.current.onStatus?.(INITIAL_STATUS)
      }, 400)
      return
    }
    const blob = chunks.length ? new Blob(chunks, { type: "audio/webm" }) : null
    await uploadPayload(blob)
  }, [updateStatus, uploadPayload])

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

  const startLevelMeter = (stream: MediaStream) => {
    try {
      type AudioCtxCtor = typeof AudioContext
      const w = window as unknown as {
        AudioContext?: AudioCtxCtor
        webkitAudioContext?: AudioCtxCtor
      }
      const Ctor = w.AudioContext ?? w.webkitAudioContext
      if (!Ctor) return
      const ctx = new Ctor()
      audioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.6
      src.connect(analyser)
      analyserRef.current = analyser
      const buf = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        const node = analyserRef.current
        if (!node) return
        node.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        // Boost + clamp so quiet room noise reads as ~0 and speech as ~0.6-1.
        const boosted = Math.min(1, rms * 3.2)
        // Smooth with exponential moving average so the UI doesn't jitter.
        smoothLevelRef.current =
          smoothLevelRef.current * 0.7 + boosted * 0.3
        setStatus((prev) =>
          prev.phase === "recording" || prev.phase === "locating"
            ? { ...prev, audioLevel: smoothLevelRef.current }
            : prev,
        )
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      console.warn("[v0][sos] audio analyser unavailable:", err)
    }
  }

  const start = useCallback(async () => {
    if (activeRef.current) return
    activeRef.current = true
    cancelledRef.current = false
    chunksRef.current = []
    locationRef.current = null
    smoothLevelRef.current = 0
    startedAtRef.current = Date.now()
    updateStatus({
      phase: "locating",
      seconds: 0,
      audioLevel: 0,
      held: heldRef.current,
      error: undefined,
    })

    // Kick off geolocation in parallel with mic prompt. It's okay if it resolves
    // after recording starts — it just needs to be ready before upload.
    void captureLocation().then((loc) => {
      locationRef.current = loc
    })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startLevelMeter(stream)

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

      // Elapsed-seconds ticker so callers can render a timer.
      if (tickTimerRef.current) clearInterval(tickTimerRef.current)
      tickTimerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current) / 1000)
        setStatus((prev) => ({ ...prev, seconds: secs }))
      }, 200)

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
    setStatus((prev) => ({ ...prev, held: true }))
    if (!activeRef.current) void start()
  }, [start])

  /** Called on pointerup / touchend / cancel: end hold, stop if past default. */
  const onHoldEnd = useCallback(() => {
    if (!heldRef.current) return
    heldRef.current = false
    setStatus((prev) => ({ ...prev, held: false }))
    if (!activeRef.current) return
    const elapsed = Date.now() - startedAtRef.current
    if (elapsed >= duration) {
      // They held past the default — stop now.
      stop()
    }
    // Otherwise the scheduled auto-stop at `duration` will fire and, since
    // heldRef is now false, it will stop the recorder.
  }, [duration, stop])

  /** Abort the active capture without uploading anything. */
  const cancel = useCallback(() => {
    if (!activeRef.current) {
      // Nothing to do — just make sure state is clean.
      setStatus(INITIAL_STATUS)
      optsRef.current.onStatus?.(INITIAL_STATUS)
      return
    }
    cancelledRef.current = true
    heldRef.current = false
    const rec = recorderRef.current
    if (rec && rec.state !== "inactive") {
      // onstop handler will route through finalize(), which honors cancelledRef.
      try {
        rec.stop()
      } catch {
        void finalize()
      }
    } else {
      void finalize()
    }
  }, [finalize])

  /** Send immediately, without waiting for the 20s timer. */
  const sendNow = useCallback(() => {
    if (!activeRef.current) return
    heldRef.current = false
    setStatus((prev) => ({ ...prev, held: false }))
    stop()
  }, [stop])

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
    /** Manually stop the recording and send now. */
    sendNow,
    /** Abort the active capture without uploading. */
    cancel,
  }
}
