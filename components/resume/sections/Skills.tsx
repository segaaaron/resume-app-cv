"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { SkillItem } from "@/types/resume"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"
import { ATS_SKILLS } from "@/lib/ats/skills-dictionary"

// Autocomplete suggestions in the dictionary's canonical spelling. Offering the
// right spelling as the user types kills mistyped skills at the source
// ("React Navite" → "React Native"), which keeps dedup, ATS score and every
// downstream consumer clean. A native <datalist> stays non-intrusive: it only
// suggests — the field is still free-text, so nothing the user types is blocked.
const CASE_OVERRIDE: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", "node.js": "Node.js", nodejs: "Node.js",
  "ci/cd": "CI/CD", html: "HTML", css: "CSS", sql: "SQL", aws: "AWS", gcp: "GCP", ios: "iOS",
  graphql: "GraphQL", github: "GitHub", gitlab: "GitLab", postgresql: "PostgreSQL", mongodb: "MongoDB",
  php: "PHP", api: "API", rest: "REST", "rest api": "REST API", ui: "UI", ux: "UX", seo: "SEO",
  "c#": "C#", "c++": "C++", devops: "DevOps", saas: "SaaS", "react native": "React Native",
}
function displayCase(term: string): string {
  const o = CASE_OVERRIDE[term.toLowerCase()]
  if (o) return o
  return term.replace(/\b\w/g, (c) => c.toUpperCase())
}
const SKILL_SUGGESTIONS = Array.from(new Set(ATS_SKILLS.map((s) => displayCase(s.term)))).sort((a, b) => a.localeCompare(b))
const SKILL_DATALIST_ID = "ats-skill-suggestions"

export default function SkillsSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const skills = sectionData.skills

  const LEVELS = [
    { value: "beginner",     label: t("skills.beginner") },
    { value: "intermediate", label: t("skills.intermediate") },
    { value: "advanced",     label: t("skills.advanced") },
    { value: "expert",       label: t("skills.expert") },
  ]

  function add() {
    const newSkill: SkillItem = { id: nanoid(), name: "", level: "intermediate" }
    updateSectionData("skills", [...skills, newSkill])
  }

  function update(id: string, field: keyof SkillItem, value: string) {
    updateSectionData("skills", skills.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  function remove(id: string) {
    updateSectionData("skills", skills.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-2">
      {/* Shared canonical-spelling suggestions for every skill input below. */}
      <datalist id={SKILL_DATALIST_ID}>
        {SKILL_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
      </datalist>
      {skills.map((skill) => (
        <div key={skill.id} className="flex items-center gap-1.5">
          <input
            value={skill.name}
            onChange={(e) => update(skill.id, "name", e.target.value)}
            placeholder={t("skills.placeholder")}
            title={skill.name || undefined}
            list={SKILL_DATALIST_ID}
            autoComplete="off"
            className="min-w-0 flex-1 outline-none text-[12.5px] font-medium transition-all duration-200"
            style={{
              height: 40, paddingLeft: 14, paddingRight: 14, borderRadius: 20,
              background: "linear-gradient(135deg,rgba(240,248,255,0.85) 0%,rgba(232,244,251,0.65) 100%)",
              border: "1.5px solid rgba(0,212,255,0.2)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)", color: "#1a2e4a",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.1)" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"; e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.03)" }}
          />
          <Select value={skill.level} onValueChange={(v) => update(skill.id, "level", v ?? "intermediate")}>
            <SelectTrigger className="h-10 w-28 shrink-0 text-xs" style={{ borderRadius: 20 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => remove(skill.id)} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-200 hover:border-[#00D4FF] hover:text-[#1a2e4a] hover:bg-[rgba(0,212,255,0.04)]" style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}>
        <Plus className="h-3.5 w-3.5" /> {t("add_skill")}
      </button>
    </div>
  )
}
