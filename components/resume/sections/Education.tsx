"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { EducationItem } from "@/types/resume"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ChevronDown, ChevronRight, GraduationCap, Award, BookOpen, MapPin } from "lucide-react"
import { nanoid } from "nanoid"
import { PField, DateField, PTextarea } from "./shared"

export default function EducationSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const items = sectionData.education
  const [openId, setOpenId] = useState<string | null>(null)
  // Deriving this (`openId ?? items[0]?.id`) looks equivalent and is not: closing the
  // accordion sets null, which would immediately re-open the first entry. Measured, then
  // left alone — it is UI state reacting to a list change, which is what an effect is for.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (items[0]?.id) setOpenId(items[0].id) }, [items[0]?.id])

  function add() {
    const newItem: EducationItem = {
      id: nanoid(), institution: "", degree: "", fieldOfStudy: "",
      city: "", startDate: "", endDate: "", currentlyStudying: false, description: "",
    }
    updateSectionData("education", [...items, newItem])
    setOpenId(newItem.id)
  }

  function update(id: string, field: keyof EducationItem, value: unknown) {
    updateSectionData("education", items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  function remove(id: string) {
    updateSectionData("education", items.filter((i) => i.id !== id))
    if (openId === id) setOpenId(null)
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg bg-white">
          <div
            role="button" tabIndex={0}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenId(openId === item.id ? null : item.id) }}
          >
            <span className="font-medium truncate text-left">
              {item.degree || item.institution || t("new_education")}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); remove(item.id) }} className="p-1 hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openId === item.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          </div>

          {openId === item.id && (
            <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
              <PField label={t("education.institution")} value={item.institution} onChange={(v) => update(item.id, "institution", v)} icon={GraduationCap} span2 />
              <PField label={t("education.degree")}       value={item.degree}      onChange={(v) => update(item.id, "degree", v)}      icon={Award} />
              <PField label={t("education.field_of_study")} value={item.fieldOfStudy} onChange={(v) => update(item.id, "fieldOfStudy", v)} icon={BookOpen} />
              <PField label={t("education.city")}         value={item.city}        onChange={(v) => update(item.id, "city", v)}        icon={MapPin} />
              <DateField label={t("education.start_date")} value={item.startDate}  onChange={(v) => update(item.id, "startDate", v)} />
              {!item.currentlyStudying && (
                <DateField label={t("education.end_date")} value={item.endDate}    onChange={(v) => update(item.id, "endDate", v)} />
              )}
              <div className="col-span-2 flex items-center gap-2">
                <Switch id={`studying-${item.id}`} checked={item.currentlyStudying} onCheckedChange={(v) => update(item.id, "currentlyStudying", v)} />
                <Label htmlFor={`studying-${item.id}`} className="text-xs">{t("currently_studying")}</Label>
              </div>
              <PTextarea label={t("description")} value={item.description ?? ""} onChange={(v) => update(item.id, "description", v)} />
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-200 hover:border-[#00D4FF] hover:text-[#1a2e4a] hover:bg-[rgba(0,212,255,0.04)]" style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}>
        <Plus className="h-3.5 w-3.5" /> {t("add_education")}
      </button>
    </div>
  )
}
