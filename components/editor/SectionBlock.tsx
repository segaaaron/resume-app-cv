"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronDown, ChevronRight, MoreHorizontal, Eye, EyeOff, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection } from "@/types/resume"
import { cn } from "@/lib/utils"
import SectionContent from "./SectionContent"

export default function SectionBlock({ section }: { section: ResumeSection }) {
  const t = useTranslations("editor")
  const [open, setOpen] = useState(section.type === "personalDetails")
  const { toggleSection, togglePageBreak, moveSectionToColumn } = useResumeStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-border rounded-xl bg-white overflow-hidden",
        !section.visible && "opacity-60",
        section.pageBreakBefore && "border-t-2 border-t-primary"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">{section.label}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toggleSection(section.id)}>
              {section.visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {section.visible ? t("section.hide") : t("section.show")}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => togglePageBreak(section.id)}>
              <Scissors className="h-3.5 w-3.5" />
              {section.pageBreakBefore ? t("section.remove_page_break") : t("section.add_page_break")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => moveSectionToColumn(section.id, "main")}>
              {t("section.move_to_main")}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => moveSectionToColumn(section.id, "side")}>
              {t("section.move_to_side")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {open && (
        <div className="border-t border-border px-4 py-4">
          <SectionContent section={section} />
        </div>
      )}
    </div>
  )
}
