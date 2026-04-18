"use client"

import { motion } from "framer-motion"
import {
  Activity,
  CheckCircle2,
  Timer,
  Users2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Flame,
  HeartPulse,
  Car,
  Waves,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { INCIDENTS, SEVERITY_META } from "@/lib/crisis-data"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const hourly = [
  { h: "00", v: 4 },
  { h: "02", v: 3 },
  { h: "04", v: 2 },
  { h: "06", v: 5 },
  { h: "08", v: 11 },
  { h: "10", v: 14 },
  { h: "12", v: 18 },
  { h: "14", v: 22 },
  { h: "16", v: 26 },
  { h: "18", v: 19 },
  { h: "20", v: 14 },
  { h: "22", v: 8 },
]

const byType = [
  { t: "Fire", v: 18, color: "#FF3B3B" },
  { t: "Medical", v: 34, color: "#3B82F6" },
  { t: "Accident", v: 22, color: "#F59E0B" },
  { t: "Flood", v: 9, color: "#22C55E" },
  { t: "Structural", v: 6, color: "#94a3b8" },
]

export function Dashboard({
  onOpenMap,
  onSelectIncident,
}: {
  onOpenMap: () => void
  onSelectIncident: (id: string) => void
}) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-6 md:px-10 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Command center · Live
              </p>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
              Operational overview
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              San Francisco metro · Grid 14 · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
              <span className="text-slate-400">Shift</span>{" "}
              <span className="font-semibold text-white">Day · 06:00–18:00</span>
            </div>
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
            >
              Open live map
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 pb-24 pt-6 md:grid-cols-4 md:p-10">
        {/* KPI cards */}
        <KpiCard
          label="Active incidents"
          value="14"
          delta="+3"
          trend="up"
          accent="#FF3B3B"
          icon={Activity}
          hint="vs. last hour"
        />
        <KpiCard
          label="Resolved today"
          value="38"
          delta="+12%"
          trend="up"
          accent="#22C55E"
          icon={CheckCircle2}
          hint="vs. yesterday"
        />
        <KpiCard
          label="Avg response"
          value="6m 42s"
          delta="-48s"
          trend="down"
          accent="#3B82F6"
          icon={Timer}
          hint="faster than avg"
        />
        <KpiCard
          label="Units on shift"
          value="48"
          delta="92%"
          trend="flat"
          accent="#F59E0B"
          icon={Users2}
          hint="availability"
        />

        {/* Main chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Incidents · last 24h
              </p>
              <h3 className="text-lg font-semibold text-white">Throughput</h3>
            </div>
            <div className="flex gap-2 text-xs">
              <LegendDot color="#3B82F6" label="Reports" />
            </div>
          </div>

          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f1524",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* By type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            By category
          </p>
          <h3 className="text-lg font-semibold text-white">Incident mix</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="t"
                  type="category"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "#0f1524",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="v" radius={[4, 4, 4, 4]}>
                  {byType.map((d) => (
                    <Cell key={d.t} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live feed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Live feed
              </p>
              <h3 className="text-lg font-semibold text-white">Active incidents</h3>
            </div>
            <button
              onClick={onOpenMap}
              className="text-xs font-medium text-[#3B82F6] hover:underline"
            >
              View all
            </button>
          </div>

          <ul className="mt-4 flex flex-col divide-y divide-white/5">
            {INCIDENTS.slice(0, 5).map((inc) => {
              const meta = SEVERITY_META[inc.severity]
              const Icon =
                inc.type === "fire"
                  ? Flame
                  : inc.type === "medical"
                    ? HeartPulse
                    : inc.type === "accident"
                      ? Car
                      : inc.type === "flood"
                        ? Waves
                        : Activity
              return (
                <li key={inc.id}>
                  <button
                    onClick={() => onSelectIncident(inc.id)}
                    className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-white/[0.02]"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{inc.id}</span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{ color: meta.color, backgroundColor: `${meta.color}1A` }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-white">
                        {inc.title}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {inc.location} · {inc.timeAgo}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                  </button>
                </li>
              )
            })}
          </ul>
        </motion.div>

        {/* Mini map */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="md:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Heatmap
              </p>
              <h3 className="text-lg font-semibold text-white">Incident density</h3>
            </div>
            <button
              onClick={onOpenMap}
              className="text-xs font-medium text-[#3B82F6] hover:underline"
            >
              Open full map
            </button>
          </div>

          <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-xl border border-white/5 map-grid">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 32% 38%, rgba(255,59,59,0.3), transparent 20%), radial-gradient(ellipse at 62% 52%, rgba(255,59,59,0.25), transparent 18%), radial-gradient(ellipse at 48% 28%, rgba(245,158,11,0.22), transparent 18%), radial-gradient(ellipse at 22% 68%, rgba(245,158,11,0.2), transparent 20%), radial-gradient(ellipse at 78% 72%, rgba(34,197,94,0.18), transparent 18%)",
              }}
            />
            {INCIDENTS.map((inc) => {
              const meta = SEVERITY_META[inc.severity]
              return (
                <button
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/30 transition hover:scale-150"
                  style={{
                    left: `${inc.x * 100}%`,
                    top: `${inc.y * 100}%`,
                    backgroundColor: meta.color,
                    boxShadow: `0 0 10px ${meta.color}`,
                  }}
                  aria-label={inc.title}
                />
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  accent,
  icon: Icon,
  hint,
}: {
  label: string
  value: string
  delta: string
  trend: "up" | "down" | "flat"
  accent: string
  icon: React.ComponentType<{ className?: string }>
  hint: string
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : ArrowRight
  const isPositiveContext = label === "Active incidents" ? trend !== "up" : trend === "down" ? true : trend === "up"
  // For active incidents, up is bad; for response time, down is good. We just color-code based on accent.
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5"
    >
      <div
        aria-hidden
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: `${accent}26` }}
      />
      <div className="relative flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="relative mt-3 font-mono text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <div className="relative mt-2 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
          )}
          style={{ color: accent, backgroundColor: `${accent}14` }}
        >
          <TrendIcon className="h-3 w-3" />
          {delta}
        </span>
        <span className="text-slate-500">{hint}</span>
      </div>
    </motion.div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-400">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
