"use client"

import { useResumeStore } from "@/stores/resumeStore"
import type { ReferenceItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"
import { nanoid } from "nanoid"

export default function ReferencesSection() {
  const { sectionData, updateSectionData } = useResumeStore()
  const items = sectionData.references

  function add() {
    updateSectionData("references", [...items, { id: nanoid(), name: "", company: "", phone: "", email: "" }])
  }

  function update(id: string, field: keyof ReferenceItem, value: string) {
    updateSectionData("references", items.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  function remove(id: string) {
    updateSectionData("references", items.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border border-border rounded-lg p-3 relative">
          <button onClick={() => remove(item.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            {(["name", "company", "phone", "email"] as const).map((field) => (
              <div key={field}>
                <Label className="text-xs mb-1 block text-muted-foreground">
                  {field === "name" ? "Nombre" : field === "company" ? "Empresa" : field === "phone" ? "Teléfono" : "Email"}
                </Label>
                <Input value={item[field]} onChange={(e) => update(item.id, field, e.target.value)} className="h-7 text-xs" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Añadir referencia
      </Button>
    </div>
  )
}
