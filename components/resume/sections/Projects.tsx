"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { ProjectItem } from "@/types/resume"
import { Plus, Trash2, ChevronDown, ChevronRight, FolderOpen, UserRound, Link, CalendarDays } from "lucide-react"
import { nanoid } from "nanoid"
import { PField, DateField, PTextarea } from "./shared"

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
    if (openId === id) setOpenId(null)
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg bg-white">
          <div
            role="button" tabIndex={0}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 cursor-pointer"
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenId(openId === item.id ? null : item.id) }}
          >
            <span className="font-medium truncate text-left">{item.name || t("new_project")}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); remove(item.id) }} className="p-1 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openId === item.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          </div>
          {openId === item.id && (
            <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
              <PField label={t("projects.name")} value={item.name} onChange={(v) => update(item.id, "name", v)} icon={FolderOpen} span2 />
              <PField label={t("projects.role")} value={item.role} onChange={(v) => update(item.id, "role", v)} icon={UserRound} />
              <PField label={t("projects.url")}  value={item.url}  onChange={(v) => update(item.id, "url", v)}  icon={Link} />
              <DateField variant="form" icon={CalendarDays} label={t("projects.start_date")} value={item.startDate} onChange={(v) => update(item.id, "startDate", v)} />
              <DateField variant="form" icon={CalendarDays} label={t("projects.end_date")}   value={item.endDate}   onChange={(v) => update(item.id, "endDate", v)} />
              <PTextarea label={t("projects.description")} value={item.description} onChange={(v) => update(item.id, "description", v)} />
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-200 hover:border-[#00D4FF] hover:text-[#1a2e4a] hover:bg-[rgba(0,212,255,0.04)]" style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}>
        <Plus className="h-3.5 w-3.5" /> {t("add_project")}
      </button>
    </div>
  )
}
