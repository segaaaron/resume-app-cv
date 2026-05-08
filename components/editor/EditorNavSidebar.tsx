"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { FileText, Palette, Sparkles, Target, Mail, ChevronRight } from "lucide-react"

type EditorTab = "content" | "design" | "ai" | "ats" | "cover"

const NAV_ITEMS: Array<{ id: EditorTab; icon: React.ElementType }> = [
  { id: "content", icon: FileText },
  { id: "design", icon: Palette },
  { id: "ai", icon: Sparkles },
  { id: "ats", icon: Target },
  { id: "cover", icon: Mail },
]

interface EditorNavSidebarProps {
  activeTab: EditorTab
  onTabChange: (tab: EditorTab) => void
}

export function EditorNavSidebar({ activeTab, onTabChange }: EditorNavSidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const t = useTranslations("editor.nav")

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 shrink-0",
        expanded ? "w-44" : "w-14"
      )}
    >
      <div className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-blue-50 text-primary"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {expanded && <span className="truncate">{t(id)}</span>}
          </button>
        ))}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="p-3 border-t border-neutral-100 text-muted-foreground hover:text-foreground flex justify-center"
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
      </button>
    </aside>
  )
}
