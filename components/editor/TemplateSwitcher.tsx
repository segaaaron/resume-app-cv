"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES } from "@/types/resume"
import { cn } from "@/lib/utils"

export default function TemplateSwitcher() {
  const { config, setTemplate } = useResumeStore()

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-border px-4 py-3">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setTemplate(template.id)}
            className={cn(
              "shrink-0 flex flex-col items-center gap-1 group",
            )}
          >
            <div
              className={cn(
                "w-12 h-16 rounded-lg border-2 overflow-hidden transition-all",
                config.templateId === template.id
                  ? "border-primary shadow-md shadow-primary/20"
                  : "border-border group-hover:border-primary/40"
              )}
            >
              <div className="h-4 w-full" style={{ backgroundColor: config.colorScheme }} />
              <div className="p-1 space-y-0.5">
                {[1, 2].map((i) => (
                  <div key={i} className="h-0.5 bg-gray-200 rounded w-full" />
                ))}
              </div>
            </div>
            <span className={cn(
              "text-[9px] font-medium transition-colors",
              config.templateId === template.id ? "text-primary" : "text-muted-foreground"
            )}>
              {template.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
