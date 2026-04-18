"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES } from "@/types/resume"
import { cn } from "@/lib/utils"

const PRO_IDS = ["aurora", "helix", "lumiere", "prism", "consul"]
const ULTRA_IDS = ["rose", "minimal", "nautical", "wave", "cobalt", "banner", "duality", "obsidian", "vertex", "prestige"]

const proTemplates     = TEMPLATES.filter((t) => PRO_IDS.includes(t.id))
const ultraTemplates   = TEMPLATES.filter((t) => ULTRA_IDS.includes(t.id))
const regularTemplates = TEMPLATES.filter((t) => !PRO_IDS.includes(t.id) && !ULTRA_IDS.includes(t.id))

export default function TemplateSwitcher() {
  const { config, setTemplate } = useResumeStore()

  const TemplateThumb = ({ template }: { template: typeof TEMPLATES[number] }) => (
    <button
      key={template.id}
      onClick={() => setTemplate(template.id)}
      className="shrink-0 flex flex-col items-center gap-1 group"
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
  )

  return (
    <div className="shrink-0 bg-white/95 backdrop-blur border-t border-border px-4 py-3">
      <div className="flex flex-col gap-3">

        {/* ── Plantillas por defecto ── */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {regularTemplates.map((t) => <TemplateThumb key={t.id} template={t} />)}
        </div>

        {/* ── Pro Diseños ── */}
        <div className="flex items-center gap-3 pt-2 border-t border-border overflow-x-auto pb-1 scrollbar-hide">
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              Pro
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
              Diseños
            </span>
          </div>
          {proTemplates.map((t) => <TemplateThumb key={t.id} template={t} />)}
        </div>

        {/* ── Ultra Diseños ── */}
        <div className="flex items-center gap-3 pt-2 border-t border-border overflow-x-auto pb-1 scrollbar-hide">
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent whitespace-nowrap">
              Ultra
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent whitespace-nowrap">
              Diseños
            </span>
          </div>
          {ultraTemplates.map((t) => <TemplateThumb key={t.id} template={t} />)}
        </div>
      </div>
    </div>
  )
}
