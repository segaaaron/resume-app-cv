"use client"

import { useResumeStore } from "@/stores/resumeStore"
import type { SkillItem } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { nanoid } from "nanoid"

const LEVELS = [
  { value: "beginner", label: "Básico" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "expert", label: "Experto" },
]

export default function SkillsSection() {
  const { sectionData, updateSectionData } = useResumeStore()
  const skills = sectionData.skills

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

  return (
    <div className="space-y-2">
      {skills.map((skill) => (
        <div key={skill.id} className="flex items-center gap-2">
          <Input
            value={skill.name}
            onChange={(e) => update(skill.id, "name", e.target.value)}
            placeholder="ej: React, Figma, SQL..."
            className="h-8 text-xs flex-1"
          />
          <Select value={skill.level} onValueChange={(v) => update(skill.id, "level", v ?? "intermediate")}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => remove(skill.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Añadir habilidad
      </Button>
    </div>
  )
}
