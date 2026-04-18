"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Shield,
  MapPinned,
  Radio,
  Moon,
  Gauge,
  Globe,
  KeyRound,
  ChevronRight,
  Check,
} from "lucide-react"

type ToggleKey =
  | "pushAlerts"
  | "criticalOnly"
  | "soundAlerts"
  | "autoDispatch"
  | "darkMode"
  | "locationShare"

const defaults: Record<ToggleKey, boolean> = {
  pushAlerts: true,
  criticalOnly: false,
  soundAlerts: true,
  autoDispatch: false,
  darkMode: true,
  locationShare: true,
}

export function SettingsView() {
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>(defaults)
  const [radius, setRadius] = useState(5)
  const [zone, setZone] = useState("grid-14")
  const [saved, setSaved] = useState(false)

  function set(k: ToggleKey, v: boolean) {
    setToggles((prev) => ({ ...prev, [k]: v }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-6 md:px-10 md:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Preferences
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure notifications, dispatch zones, and operator preferences.
        </p>
      </div>

      <div className="grid gap-4 px-6 pb-24 pt-6 md:grid-cols-2 md:p-10">
        {/* Notifications */}
        <Section
          icon={Bell}
          accent="#3B82F6"
          title="Notifications"
          description="Choose which alerts reach your device."
        >
          <ToggleRow
            label="Push alerts"
            description="Receive a push for every new incident."
            checked={toggles.pushAlerts}
            onChange={(v) => set("pushAlerts", v)}
          />
          <ToggleRow
            label="Critical only"
            description="Silence medium and low severity alerts."
            checked={toggles.criticalOnly}
            onChange={(v) => set("criticalOnly", v)}
          />
          <ToggleRow
            label="Sound alerts"
            description="Play a short tone for incoming incidents."
            checked={toggles.soundAlerts}
            onChange={(v) => set("soundAlerts", v)}
          />
        </Section>

        {/* Dispatch */}
        <Section
          icon={MapPinned}
          accent="#F59E0B"
          title="Dispatch zone"
          description="Define the operational area you oversee."
        >
          <label className="block">
            <span className="text-xs font-medium text-slate-400">Primary grid</span>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3B82F6]/50"
            >
              <option value="grid-14">Grid 14 · Downtown</option>
              <option value="grid-22">Grid 22 · Riverside</option>
              <option value="grid-07">Grid 07 · Harbor</option>
              <option value="grid-33">Grid 33 · North Ridge</option>
            </select>
          </label>

          <label className="mt-4 block">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Response radius</span>
              <span className="font-mono text-white">{radius} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-2 w-full accent-[#3B82F6]"
            />
          </label>

          <ToggleRow
            label="Auto-dispatch"
            description="Automatically assign nearest unit to critical calls."
            checked={toggles.autoDispatch}
            onChange={(v) => set("autoDispatch", v)}
          />
        </Section>

        {/* Operator */}
        <Section
          icon={Radio}
          accent="#22C55E"
          title="Operator"
          description="Controls for this session and your device."
        >
          <ToggleRow
            label="Dark mode"
            description="Command center uses the dark theme."
            checked={toggles.darkMode}
            onChange={(v) => set("darkMode", v)}
            icon={Moon}
          />
          <ToggleRow
            label="Share location"
            description="Broadcast your location to dispatch."
            checked={toggles.locationShare}
            onChange={(v) => set("locationShare", v)}
            icon={Globe}
          />
        </Section>

        {/* Security */}
        <Section
          icon={Shield}
          accent="#FF3B3B"
          title="Security"
          description="Account access and integrations."
        >
          <LinkRow icon={KeyRound} label="Change password" hint="Last updated 14 days ago" />
          <LinkRow icon={Gauge} label="Active sessions" hint="3 devices · 1 active now" />
          <LinkRow icon={Shield} label="Two-factor auth" hint="Enabled via Authenticator" />
        </Section>

        {/* Save bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div>
            <p className="text-sm font-semibold text-white">Unsaved changes</p>
            <p className="text-xs text-slate-400">
              Settings apply to this operator account.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  accent,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  accent: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </motion.section>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="truncate text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
          (checked ? "bg-[#3B82F6]" : "bg-white/10")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-[22px]" : "translate-x-0.5")
          }
        />
      </button>
    </div>
  )
}

function LinkRow({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
}) {
  return (
    <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-500" />
    </button>
  )
}
