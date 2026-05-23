"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import type { ReferenceItem } from "@/types/resume"
import { Plus, Trash2, ChevronDown, ChevronRight, UserRound, Building2, Smartphone, AtSign } from "lucide-react"
import { nanoid } from "nanoid"
import { PField } from "./shared"

export default function ReferencesSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )
  const items = sectionData.references
  const [openId, setOpenId] = useState<string | null>(null)

  // Initialize only when null (first load) — don't stomp user's open card on delete
  useEffect(() => {
    if (openId === null && items[0]?.id) setOpenId(items[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  function add() {
    const newItem: ReferenceItem = { id: nanoid(), name: "", company: "", phone: "", email: "" }
    updateSectionData("references", [...items, newItem])
    setOpenId(newItem.id)
  }

  function update(id: string, field: keyof ReferenceItem, value: string) {
    updateSectionData("references", items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  function remove(id: string) {
    updateSectionData("references", items.filter((i) => i.id !== id))
    if (openId === id) setOpenId(null)
  }

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg bg-white">
          {/* Header row — plain div, not role=button to avoid nested interactive conflict */}
          <div className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors">
            {/* Clickable area — expands/collapses */}
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer bg-transparent border-none p-0"
              onClick={() => toggle(item.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(item.id) } }}
              aria-expanded={openId === item.id}
            >
              <div
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg,#E8F4FD 0%,#D6EBF8 100%)",
                  border: "1px solid rgba(91,143,189,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <UserRound size={13} style={{ color: "#5B8FBD" }} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-[13px] text-[#0B1B3D] truncate leading-tight">
                  {item.name || t("references.name")}
                </div>
                {item.company && (
                  <div className="text-[11px] text-[#7A9BB5] truncate mt-[1px]">{item.company}</div>
                )}
              </div>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={t("references.delete")}
                className="p-1 hover:text-destructive transition-colors text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openId === item.id
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              }
            </div>
          </div>

          {openId === item.id && (
            <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
              <PField label={t("references.name")}    value={item.name}    onChange={(v) => update(item.id, "name", v)}    icon={UserRound} />
              <PField label={t("references.company")} value={item.company} onChange={(v) => update(item.id, "company", v)} icon={Building2} />
              <PField label={t("references.phone")}   value={item.phone}   onChange={(v) => update(item.id, "phone", v)}   icon={Smartphone} type="tel" />
              <PField label={t("references.email")}   value={item.email}   onChange={(v) => update(item.id, "email", v)}   icon={AtSign}     type="email" />
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors duration-200 hover:border-[#00D4FF] hover:text-[#1a2e4a] hover:bg-[rgba(0,212,255,0.04)]"
        style={{ border: "1.5px dashed #7A9BB5", background: "rgba(26,46,74,0.08)", color: "#1a2e4a", fontSize: 12, fontWeight: 600 }}
      >
        <Plus className="h-3.5 w-3.5" /> {t("add_reference")}
      </button>
    </div>
  )
}
