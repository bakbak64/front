export type Severity = "critical" | "medium" | "low"
export type IncidentType = "fire" | "medical" | "accident" | "flood" | "structural" | "security"

export interface Incident {
  id: string
  type: IncidentType
  title: string
  severity: Severity
  // normalized 0..1 coordinates on our fake map canvas
  x: number
  y: number
  location: string
  distanceKm: number
  timeAgo: string
  description: string
  responders: number
  reporter: string
  image?: string
}

export const INCIDENTS: Incident[] = [
  {
    id: "INC-0481",
    type: "fire",
    title: "Structure fire — 3rd floor apartment",
    severity: "critical",
    x: 0.32,
    y: 0.38,
    location: "Market St & 7th Ave",
    distanceKm: 0.8,
    timeAgo: "2 min ago",
    description:
      "Reports of heavy smoke on the 3rd floor. Residents evacuating. Two people possibly still inside. Fire department dispatched.",
    responders: 4,
    reporter: "M. Chen",
  },
  {
    id: "INC-0479",
    type: "medical",
    title: "Cardiac emergency — male, 60s",
    severity: "critical",
    x: 0.62,
    y: 0.52,
    location: "Union Square Station",
    distanceKm: 1.4,
    timeAgo: "4 min ago",
    description:
      "Bystander CPR in progress. AED located. Paramedic unit ETA 2 minutes.",
    responders: 3,
    reporter: "Transit Authority",
  },
  {
    id: "INC-0477",
    type: "accident",
    title: "Multi-vehicle collision",
    severity: "medium",
    x: 0.48,
    y: 0.28,
    location: "I-580 Eastbound, Mile 14",
    distanceKm: 3.2,
    timeAgo: "8 min ago",
    description:
      "Three-car collision, no confirmed injuries. Right lane blocked. Tow dispatched.",
    responders: 2,
    reporter: "CHP Unit 214",
  },
  {
    id: "INC-0476",
    type: "flood",
    title: "Flash flooding — basement level",
    severity: "medium",
    x: 0.22,
    y: 0.68,
    location: "Riverside Commons",
    distanceKm: 2.1,
    timeAgo: "12 min ago",
    description:
      "Storm drain overflow flooding underground parking. No injuries reported.",
    responders: 1,
    reporter: "Building Mgmt",
  },
  {
    id: "INC-0474",
    type: "structural",
    title: "Debris on roadway",
    severity: "low",
    x: 0.78,
    y: 0.72,
    location: "Grant Ave & Oak St",
    distanceKm: 4.5,
    timeAgo: "22 min ago",
    description: "Large tree branch down after storm. Traffic navigable.",
    responders: 1,
    reporter: "Citizen report",
  },
  {
    id: "INC-0472",
    type: "security",
    title: "Suspicious package",
    severity: "medium",
    x: 0.55,
    y: 0.78,
    location: "Federal Plaza, entrance B",
    distanceKm: 2.8,
    timeAgo: "28 min ago",
    description:
      "Unattended bag near entrance. Security cordon established. Bomb squad en route.",
    responders: 2,
    reporter: "Security Desk",
  },
  {
    id: "INC-0470",
    type: "medical",
    title: "Minor injury — fall",
    severity: "low",
    x: 0.4,
    y: 0.82,
    location: "Lincoln Park Trail",
    distanceKm: 5.1,
    timeAgo: "35 min ago",
    description:
      "Hiker with sprained ankle. Non-emergency transport requested.",
    responders: 1,
    reporter: "Park Ranger",
  },
  {
    id: "INC-0468",
    type: "fire",
    title: "Vehicle fire — contained",
    severity: "low",
    x: 0.7,
    y: 0.22,
    location: "Harbor Blvd off-ramp",
    distanceKm: 3.9,
    timeAgo: "41 min ago",
    description: "Engine compartment fire. Driver safe. Fire suppressed.",
    responders: 0,
    reporter: "CHP Unit 108",
  },
]

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string; ring: string; text: string }
> = {
  critical: {
    label: "Critical",
    color: "#FF3B3B",
    bg: "bg-[#FF3B3B]",
    ring: "ring-[#FF3B3B]/40",
    text: "text-[#FF3B3B]",
  },
  medium: {
    label: "Medium",
    color: "#F59E0B",
    bg: "bg-[#F59E0B]",
    ring: "ring-[#F59E0B]/40",
    text: "text-[#F59E0B]",
  },
  low: {
    label: "Low",
    color: "#22C55E",
    bg: "bg-[#22C55E]",
    ring: "ring-[#22C55E]/40",
    text: "text-[#22C55E]",
  },
}

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  fire: "Fire",
  medical: "Medical",
  accident: "Accident",
  flood: "Flood",
  structural: "Structural",
  security: "Security",
}

export interface VolunteerTask {
  id: string
  title: string
  distanceKm: number
  urgency: Severity
  eta: string
  skill: string
}

export const VOLUNTEER_TASKS: VolunteerTask[] = [
  {
    id: "T-201",
    title: "Deliver water & supplies to shelter",
    distanceKm: 0.6,
    urgency: "medium",
    eta: "8 min",
    skill: "Transport",
  },
  {
    id: "T-202",
    title: "Assist evacuation — elderly resident",
    distanceKm: 1.1,
    urgency: "critical",
    eta: "4 min",
    skill: "Mobility aid",
  },
  {
    id: "T-203",
    title: "Translate for medical team (Spanish)",
    distanceKm: 1.8,
    urgency: "critical",
    eta: "6 min",
    skill: "Language",
  },
  {
    id: "T-204",
    title: "Direct traffic at intersection",
    distanceKm: 2.3,
    urgency: "low",
    eta: "9 min",
    skill: "Traffic",
  },
  {
    id: "T-205",
    title: "Set up charging station at shelter",
    distanceKm: 3.0,
    urgency: "low",
    eta: "14 min",
    skill: "Technical",
  },
]
