"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { SkillItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Sparkles, Loader2 } from "lucide-react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"

export default function SkillsSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData, config } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData, config: s.config }))
  )
  const skills = sectionData.skills
  const [suggesting, setSuggesting] = useState(false)

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

  async function suggestSkills() {
    const jobTitle = sectionData.personalDetails?.jobTitle?.trim()
    if (!jobTitle) {
      toast.info(t("suggest_skills_job_title_hint"))
      return
    }

    setSuggesting(true)
    try {
      const existingSkills = skills.map((s) => s.name).filter(Boolean)
      const res = await apiFetch("/api/ai/suggest-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, existingSkills, language: config.language }),
      })

      if (res.status === 429) {
        toast.error(t("suggest_skills_rate_limit"))
        return
      }
      if (res.status === 403) {
        toast.error(t("toast_pro_only"))
        return
      }
      if (res.status === 422 || !res.ok) {
        toast.error(t("suggest_skills_empty"))
        return
      }

      const data = await res.json() as { skills: { name: string; level: string }[] }

      if (!data.skills?.length) {
        toast.info(t("suggest_skills_empty"))
        return
      }

      const newSkills: SkillItem[] = data.skills.map((s) => ({
        id: nanoid(),
        name: s.name,
        level: s.level as SkillItem["level"],
      }))

      updateSectionData("skills", [...skills, ...newSkills])
      toast.success(t("suggest_skills_added"))
    } catch {
      toast.error(t("suggest_skills_error"))
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <div className="space-y-2">
      {skills.map((skill) => (
        <div key={skill.id} className="flex items-center gap-2">
          <Input
            value={skill.name}
            onChange={(e) => update(skill.id, "name", e.target.value)}
            placeholder={t("skills.placeholder")}
            className="h-8 text-xs flex-1"
          />
          <Select value={skill.level} onValueChange={(v) => update(skill.id, "level", v ?? "intermediate")}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => remove(skill.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={add}>
          <Plus className="h-3.5 w-3.5" /> {t("add_skill")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
          onClick={suggestSkills}
          disabled={suggesting}
        >
          {suggesting
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("suggest_skills_loading")}</>
            : <><Sparkles className="h-3.5 w-3.5" /> {t("suggest_skills")}</>
          }
        </Button>
      </div>
    </div>
  )
}
