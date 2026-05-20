"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { ResumeThumbnail } from "./thumbnails"
import { TEMPLATES, TemplateId } from "@/types/resume"

interface TemplateCardProps {
  template: (typeof TEMPLATES)[number]
  locked: boolean
  isSelected: boolean
  colorScheme: string
  onSelect: (templateId: TemplateId, locked: boolean) => void
}

export const TemplateCard = memo(function TemplateCard({
  template,
  locked,
  isSelected,
  colorScheme,
  onSelect,
}: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template.id, locked)}
      className="shrink-0 flex flex-col items-center gap-1 group"
    >
      <div
        suppressHydrationWarning
        className={cn(
          "w-12 h-16 rounded-lg border-2 overflow-hidden transition-all relative",
          locked
            ? "border-border opacity-50 cursor-not-allowed"
            : isSelected
              ? "border-primary shadow-md shadow-primary/20"
              : "border-border group-hover:border-primary/40"
        )}
      >
        <ResumeThumbnail id={template.id} color={locked ? "#9ca3af" : colorScheme} />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <Lock className="h-3.5 w-3.5 text-white drop-shadow" />
          </div>
        )}
      </div>
      <span
        className={cn(
          "text-[9px] font-medium transition-colors",
          locked
            ? "text-muted-foreground/60"
            : isSelected
              ? "text-primary"
              : "text-muted-foreground"
        )}
      >
        {template.name}
      </span>
    </button>
  )
})
