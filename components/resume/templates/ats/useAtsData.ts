"use client"

/**
 * Shared store→view adapter for the faithful ATS templates. Shapes the resume
 * store into the exact structure the reference ATS components consumed (name,
 * title, contacts, experience with bullet arrays, languages with %, categorised
 * skill groups), so each Ats* component maps 1:1 to its reference layout while
 * staying driven by the user's real data. Never fabricates content.
 */

import { useMemo } from "react"
import { useResumeStore, useTemplateSectionData } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { ATS_SKILLS } from "@/lib/ats/skills-dictionary"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import { designAccent } from "@/lib/resume/template-accent"
import type { IconKey } from "./atoms"

const LEVEL_LABEL: Record<string, string> = { a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2", native: "Native", nativo: "Native" }
const LEVEL_PCT: Record<string, number> = { a1: 30, a2: 45, b1: 60, b2: 75, c1: 88, c2: 96, native: 100, nativo: 100 }

/** Extract plain-text bullet lines from a description's HTML (list items or lines). */
function htmlToBullets(html: string | undefined | null): string[] {
  if (!html) return []
  const li = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1])
  const raw = li.length ? li : html.split(/<br\s*\/?>|\n/gi)
  return raw
    .map((s) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim())
    .filter(Boolean)
}

export interface AtsView {
  accent: (signature: string) => string
  present: string
  fullName: string
  firstName: string
  lastName: string
  jobTitle?: string
  contacts: Array<[IconKey, string]>
  summary?: string
  experience: Array<{ role: string; company: string; period: string; loc: string; bullets: string[] }>
  skills: string[]
  skillBars: Array<{ name: string; level: string; pct: number }>
  certs: string[]
  education: Array<{ degree: string; school: string; period: string }>
  languages: Array<{ name: string; level: string; pct: number }>
  skillGroups: Array<{ label: string; items: string[] }>
  visible: (id: string) => boolean
  label: (id: string) => string
}

const CATEGORY_LABEL: Record<string, string> = {
  lang: "Languages", frontend: "Frontend", backend: "Backend", mobile: "Mobile", data: "Data",
  cloud: "Cloud", devops: "DevOps", db: "Databases", design: "Design", marketing: "Marketing",
  sales: "Sales", pm: "Project", finance: "Finance", hr: "HR", soft: "Core Strengths", industry: "Industry", cert: "Certifications",
}

/** Build categorised groups from listed skills that match the ATS dictionary. */
function deriveGroups(skillNames: string[]): Array<{ label: string; items: string[] }> {
  const catOf = new Map<string, string>()
  for (const e of ATS_SKILLS) {
    const forms = [e.term, ...(e.aliases ?? [])].map(normalizeTerm)
    for (const f of forms) if (f) catOf.set(f, e.category)
  }
  const buckets = new Map<string, string[]>()
  for (const name of skillNames) {
    const cat = catOf.get(normalizeTerm(name))
    if (!cat) continue
    const arr = buckets.get(cat) ?? []
    if (!arr.includes(name)) arr.push(name)
    buckets.set(cat, arr)
  }
  return [...buckets.entries()]
    .filter(([, items]) => items.length > 0)
    .slice(0, 3)
    .map(([cat, items]) => ({ label: CATEGORY_LABEL[cat] ?? cat, items: items.slice(0, 6) }))
}

export function useAtsData(): AtsView {
  const { config, sections } = useResumeStore(useShallow((s) => ({ config: s.config, sections: s.sections })))
  const data = useTemplateSectionData()

  return useMemo(() => {
    const { personalDetails: pd, summary, workExperience, education, skills, languages, certifications } = data
    const present = config.language === "en" ? "Present" : "Presente"
    const label = (id: string) => sections.find((s) => s.id === id)?.label ?? id
    const visible = (id: string) => sections.find((s) => s.id === id)?.visible !== false

    const contacts: AtsView["contacts"] = []
    if (pd.email) contacts.push(["mail", pd.email])
    if (pd.phone) contacts.push(["phone", pd.phone])
    const place = [pd.city, pd.country].filter(Boolean).join(", ")
    if (place) contacts.push(["pin", place])
    if (pd.linkedin) contacts.push(["link", pd.linkedin])
    if (pd.github) contacts.push(["git", pd.github])
    if (pd.website) contacts.push(["globe", pd.website])

    const skillNames = skills.map((s) => s.name).filter(Boolean)
    const SKILL_PCT: Record<string, number> = { beginner: 55, intermediate: 70, advanced: 85, expert: 95 }
    const SKILL_LBL: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" }
    const skillBars = skills.filter((s) => s.name).map((s) => ({ name: s.name, level: SKILL_LBL[s.level] ?? "Proficient", pct: SKILL_PCT[s.level] ?? 75 }))

    return {
      accent: (sig: string) => designAccent(config.colorScheme, sig),
      present,
      fullName: [pd.firstName, pd.lastName].filter(Boolean).join(" ") || "Your Name",
      firstName: pd.firstName || "Your",
      lastName: pd.lastName || "Name",
      jobTitle: pd.jobTitle,
      contacts,
      summary: summary || undefined,
      experience: workExperience.map((e) => ({
        role: e.jobTitle,
        company: e.employer,
        period: `${e.startDate}${e.currentlyWorking ? ` — ${present}` : e.endDate ? ` — ${e.endDate}` : ""}`,
        loc: e.city || "",
        bullets: htmlToBullets(e.description),
      })),
      skills: skillNames,
      skillBars,
      certs: certifications.map((c) => `${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}`),
      education: education.map((ed) => ({
        degree: `${ed.degree}${ed.fieldOfStudy ? ` — ${ed.fieldOfStudy}` : ""}`,
        school: ed.institution,
        period: `${ed.startDate}${ed.currentlyStudying ? ` — ${present}` : ed.endDate ? ` — ${ed.endDate}` : ""}`,
      })),
      languages: languages.map((l) => ({ name: l.name, level: LEVEL_LABEL[l.level] ?? l.level.toUpperCase(), pct: LEVEL_PCT[l.level] ?? 70 })),
      skillGroups: deriveGroups(skillNames),
      visible,
      label,
    }
  }, [config, sections, data])
}
