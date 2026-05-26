"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { LanguageItem } from "@/types/resume"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"

export default function LanguagesSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const languages = sectionData.languages

  const LEVELS = [
    { value: "a1", label: t("languages.a1") },
    { value: "a2", label: t("languages.a2") },
    { value: "b1", label: t("languages.b1") },
    { value: "b2", label: t("languages.b2") },
    { value: "c1", label: t("languages.c1") },
    { value: "c2", label: t("languages.c2") },
    { value: "native", label: t("languages.native") },
  ]

  function add() {
    updateSectionData("languages", [...languages, { id: nanoid(), name: "", level: "b1" as const }])
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
          <input
            value={lang.name}
            onChange={(e) => update(lang.id, "name", e.target.value)}
            placeholder={t("languages.placeholder")}
            className="flex-1 outline-none text-[12.5px] font-medium transition-all duration-200"
            style={{
              height: 40,
              paddingLeft: 14,
              paddingRight: 14,
              borderRadius: 20,
              background: "linear-gradient(135deg,rgba(240,248,255,0.85) 0%,rgba(232,244,251,0.65) 100%)",
              border: "1.5px solid rgba(0,212,255,0.2)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
              color: "#1a2e4a",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.6)"
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.1),inset 0 1px 3px rgba(0,0,0,0.03)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"
              e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.03)"
            }}
          />
          <Select value={lang.level} onValueChange={(v) => { if (v) update(lang.id, "level", v) }}>
            <SelectTrigger className="h-10 w-36 text-xs" style={{ borderRadius: 20 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => remove(lang.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-200 hover:border-[#00D4FF] hover:text-[#1a2e4a] hover:bg-[rgba(0,212,255,0.04)]" style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}>
        <Plus className="h-3.5 w-3.5" /> {t("add_language")}
      </button>
    </div>
  )
}
