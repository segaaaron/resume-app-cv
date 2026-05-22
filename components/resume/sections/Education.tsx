"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { EducationItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ChevronDown, ChevronRight, GraduationCap, Award, BookOpen, MapPin, CalendarDays } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { nanoid } from "nanoid"

export default function EducationSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const items = sectionData.education
  const [openId, setOpenId] = useState<string | null>(null)
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
        <div key={item.id} className="border border-border rounded-lg overflow-hidden">
          <div
            role="button"
            tabIndex={0}
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
              {([
                { labelKey: "education.institution", field: "institution" as const, icon: GraduationCap },
                { labelKey: "education.degree", field: "degree" as const, icon: Award },
                { labelKey: "education.field_of_study", field: "fieldOfStudy" as const, icon: BookOpen },
                { labelKey: "education.city", field: "city" as const, icon: MapPin },
                { labelKey: "education.start_date", field: "startDate" as const, icon: CalendarDays },
              ] as const).map(({ labelKey, field, icon: Icon }) => (
                <div key={field}>
                  <Label className="text-xs mb-1 block text-muted-foreground"><Icon size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />{t(labelKey)}</Label>
                  <Input value={item[field] as string} onChange={(e) => update(item.id, field, e.target.value)} className="h-8 text-xs" />
                </div>
              ))}
              {!item.currentlyStudying && (
                <div>
                  <Label className="text-xs mb-1 block text-muted-foreground"><CalendarDays size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />{t("education.end_date")}</Label>
                  <Input value={item.endDate} onChange={(e) => update(item.id, "endDate", e.target.value)} className="h-8 text-xs" />
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2">
                <Switch id={`studying-${item.id}`} checked={item.currentlyStudying} onCheckedChange={(v) => update(item.id, "currentlyStudying", v)} />
                <Label htmlFor={`studying-${item.id}`} className="text-xs">{t("currently_studying")}</Label>
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" style={{ background: "#0B1B3D", color: "#FFFFFF", borderColor: "#0B1B3D" }} onClick={add}>
        <Plus className="h-3.5 w-3.5" /> {t("add_education")}
      </Button>
    </div>
  )
}
