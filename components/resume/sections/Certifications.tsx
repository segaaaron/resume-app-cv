"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import type { CertificationItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { nanoid } from "nanoid"

export default function CertificationsSection() {
  const t = useTranslations("editor.sections_form")
  const { sectionData, updateSectionData } = useResumeStore()
  const items = sectionData.certifications
  const [openId, setOpenId] = useState<string | null>(null)

  function add() {
    const newItem: CertificationItem = { id: nanoid(), name: "", issuer: "", date: "", url: "" }
    updateSectionData("certifications", [...items, newItem])
    setOpenId(newItem.id)
  }

  function update(id: string, field: keyof CertificationItem, value: string) {
    updateSectionData("certifications", items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  function remove(id: string) {
    updateSectionData("certifications", items.filter((i) => i.id !== id))
  }

  const fieldLabelMap: Record<"name" | "issuer" | "date" | "url", string> = {
    name: t("certifications.name"),
    issuer: t("certifications.issuer"),
    date: t("certifications.date"),
    url: t("certifications.url"),
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/50"
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
          >
            <span className="font-medium truncate text-left">{item.name || t("new_certification")}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); remove(item.id) }} className="p-1 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {openId === item.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </div>
          </button>
          {openId === item.id && (
            <div className="border-t border-border px-3 py-3 grid grid-cols-2 gap-3">
              {(["name", "issuer", "date", "url"] as const).map((field) => (
                <div key={field} className={field === "name" || field === "url" ? "col-span-2" : ""}>
                  <Label className="text-xs mb-1 block text-muted-foreground">
                    {fieldLabelMap[field]}
                  </Label>
                  <Input value={item[field]} onChange={(e) => update(item.id, field, e.target.value)} className="h-8 text-xs" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> {t("add_certification")}
      </Button>
    </div>
  )
}
