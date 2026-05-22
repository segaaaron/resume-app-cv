"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { ProjectItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { nanoid } from "nanoid"

export default function ProjectsSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const items = sectionData.projects
  const [openId, setOpenId] = useState<string | null>(null)

  function add() {
    const newItem: ProjectItem = { id: nanoid(), name: "", role: "", startDate: "", endDate: "", description: "", url: "" }
    updateSectionData("projects", [...items, newItem])
    setOpenId(newItem.id)
  }

  function update(id: string, field: keyof ProjectItem, value: string) {
    updateSectionData("projects", items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  function remove(id: string) {
    updateSectionData("projects", items.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50"
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
          >
            <span className="font-medium truncate text-left">{item.name || t("new_project")}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); remove(item.id) }} className="p-1 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openId === item.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          </button>
          {openId === item.id && (
            <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs mb-1 block text-muted-foreground">{t("projects.name")}</Label>
                <Input value={item.name} onChange={(e) => update(item.id, "name", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">{t("projects.role")}</Label>
                <Input value={item.role} onChange={(e) => update(item.id, "role", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">{t("projects.url")}</Label>
                <Input value={item.url} onChange={(e) => update(item.id, "url", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">{t("projects.start_date")}</Label>
                <Input value={item.startDate} onChange={(e) => update(item.id, "startDate", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-muted-foreground">{t("projects.end_date")}</Label>
                <Input value={item.endDate} onChange={(e) => update(item.id, "endDate", e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-1 block text-muted-foreground">{t("projects.description")}</Label>
                <Textarea value={item.description} onChange={(e) => update(item.id, "description", e.target.value)} className="text-xs min-h-[60px] resize-none" />
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> {t("add_project")}
      </Button>
    </div>
  )
}
