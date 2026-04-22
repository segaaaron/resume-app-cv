"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import type { LanguageItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { nanoid } from "nanoid"

export default function LanguagesSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore()
  const languages = sectionData.languages

  const LEVELS = [
    { value: "elementary",       label: t("languages.elementary") },
    { value: "limited",          label: t("languages.limited") },
    { value: "professional",     label: t("languages.professional") },
    { value: "full_professional", label: t("languages.full_professional") },
    { value: "native",           label: t("languages.native") },
  ]

  function add() {
    updateSectionData("languages", [...languages, { id: nanoid(), name: "", level: "professional" as const }])
  }

  function update(id: string, field: keyof LanguageItem, value: string) {
    updateSectionData("languages", languages.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  function remove(id: string) {
    updateSectionData("languages", languages.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-2">
      {languages.map((lang) => (
        <div key={lang.id} className="flex items-center gap-2">
          <Input
            value={lang.name}
            onChange={(e) => update(lang.id, "name", e.target.value)}
            placeholder={t("languages.placeholder")}
            className="h-8 text-xs flex-1"
          />
          <Select value={lang.level} onValueChange={(v) => { if (v) update(lang.id, "level", v) }}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => remove(lang.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> {t("add_language")}
      </Button>
    </div>
  )
}
