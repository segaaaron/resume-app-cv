"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { SkillItem } from "@/types/resume"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { useMemo } from "react"
import { findDuplicateSkill, containsSkill } from "@/lib/ats/skill-dedup"
import { categoryOfSkill } from "@/lib/ats/skill-catalog"
import { inferFieldCategories } from "@/lib/ats/job-field"
import SkillAutocompleteInput from "./SkillAutocompleteInput"

export default function SkillsSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const skills = sectionData.skills

  // Boost suggestions toward the user's field, inferred from the job title they
  // already entered (fallback: the dominant category of their current skills).
  // A soft rank — nothing is hidden. Recomputed only when the title or skills change.
  const jobTitle = ((sectionData.personalDetails as { jobTitle?: string } | undefined)?.jobTitle) ?? ""
  const boost = useMemo(
    () => inferFieldCategories(jobTitle, skills.map((s) => categoryOfSkill(s.name)).filter((c): c is string => !!c)),
    [jobTitle, skills],
  )

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

  /**
   * A duplicate does not get to stay.
   *
   * This used to only warn — the row kept the repeated skill, so the CV ended up
   * with "React" next to "React.js" and the ATS section read as padded. Checked
   * on blur (not per keystroke) through the shared dedup engine, so an alias, a
   * different spacing or a ~90% match all count, and the message names the skill
   * they already have.
   *
   * The field is cleared rather than the row deleted: an empty row is visible,
   * reusable and undoable, while a row vanishing under the cursor is not.
   */
  function checkDuplicate(id: string, name: string) {
    if (!name.trim()) return
    const others = skills.filter((s) => s.id !== id).map((s) => s.name).filter(Boolean)
    // Same two engines as the dropdown: aliases/near-spellings AND containment,
    // so "communication" is caught by an existing "Teamwork and communication".
    const dup = findDuplicateSkill(name, others) ?? others.find((o) => containsSkill(name, o))
    if (!dup) return
    update(id, "name", "")
    toast.info(t("skills.duplicate", { skill: dup }))
  }

  return (
    <div className="space-y-2">
      {skills.map((skill) => (
        <div key={skill.id} className="flex items-center gap-1.5">
          <SkillAutocompleteInput
            value={skill.name}
            onChange={(name) => update(skill.id, "name", name)}
            onCommit={() => checkDuplicate(skill.id, skill.name)}
            placeholder={t("skills.placeholder")}
            boost={boost}
            alreadyListed={skills.filter((s) => s.id !== skill.id).map((s) => s.name).filter(Boolean)}
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
