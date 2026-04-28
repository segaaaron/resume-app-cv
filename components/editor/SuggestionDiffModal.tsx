"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export type SuggestionField =
  | "summary"
  | "personalDetails.jobTitle"
  | "skills"
  | "workExperience.description"
  | "workExperience.jobTitle"
  | "languages"
  | "certifications"

export interface Suggestion {
  field: SuggestionField
  type: "replace" | "append"
  preview: string
  reason: string
  targetId?: string
}

interface SuggestionDiffModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  suggestion: Suggestion
  currentValue: string
}

function fieldLabel(field: SuggestionField): string {
  const labels: Record<SuggestionField, string> = {
    "summary": "Resumen profesional",
    "personalDetails.jobTitle": "Título del puesto",
    "skills": "Habilidades",
    "workExperience.description": "Descripción de experiencia",
    "workExperience.jobTitle": "Cargo",
    "languages": "Idiomas",
    "certifications": "Certificaciones",
  }
  return labels[field]
}

export default function SuggestionDiffModal({
  open,
  onClose,
  onConfirm,
  suggestion,
  currentValue,
}: SuggestionDiffModalProps) {
  const afterValue = suggestion.type === "append"
    ? [currentValue, suggestion.preview].filter(Boolean).join(" ")
    : suggestion.preview

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Cambio sugerido — {fieldLabel(suggestion.field)}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Before */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Actual</p>
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed min-h-[48px]">
              {currentValue || <span className="italic">— vacío —</span>}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* After */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Sugerido</p>
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2.5 text-xs text-foreground leading-relaxed min-h-[48px]">
              {afterValue}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Confirmar cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
