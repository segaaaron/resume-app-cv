"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES } from "@/types/resume"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { isActive, isSuperAdmin } from "@/lib/plans"

const PRO_IDS = ["aurora", "helix", "lumiere", "prism", "consul"]
const ULTRA_IDS = ["rose", "minimal", "nautical", "wave", "cobalt", "banner", "duality", "obsidian", "vertex", "prestige"]

const proTemplates     = TEMPLATES.filter((t) => PRO_IDS.includes(t.id))
const ultraTemplates   = TEMPLATES.filter((t) => ULTRA_IDS.includes(t.id))
const regularTemplates = TEMPLATES.filter((t) => !PRO_IDS.includes(t.id) && !ULTRA_IDS.includes(t.id))

interface Props {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  trialEndsAt?: string | null
  role?: string
}

export default function TemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, trialEndsAt, role }: Props) {
  const { config, setTemplate } = useResumeStore()

  const hasAccess = isSuperAdmin(role) || isActive(
    plan,
    trialEndsAt ? new Date(trialEndsAt) : null,
    subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
    subscriptionStatus
  )


  function handleLockedTemplate() {
    toast.error("Esta plantilla requiere un plan Pro o Trial activo.", {
      action: {
        label: "Ver planes",
        onClick: () => { window.location.href = "/pricing" },
      },
    })
  }

  const TemplateThumb = ({
    template,
    locked,
  }: {
    template: typeof TEMPLATES[number]
    locked: boolean
  }) => (
    <button
      key={template.id}
      onClick={() => {
        if (locked) {
          handleLockedTemplate()
        } else {
          setTemplate(template.id)
        }
      }}
      className="shrink-0 flex flex-col items-center gap-1 group"
    >
      <div
        className={cn(
          "w-12 h-16 rounded-lg border-2 overflow-hidden transition-all relative",
          locked
            ? "border-border opacity-50 cursor-not-allowed"
            : config.templateId === template.id
              ? "border-primary shadow-md shadow-primary/20"
              : "border-border group-hover:border-primary/40"
        )}
      >
        <div className="h-4 w-full" style={{ backgroundColor: locked ? "#9ca3af" : config.colorScheme }} />
        <div className="p-1 space-y-0.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-0.5 bg-gray-200 rounded w-full" />
          ))}
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <Lock className="h-3.5 w-3.5 text-white drop-shadow" />
          </div>
        )}
      </div>
      <span className={cn(
        "text-[9px] font-medium transition-colors",
        locked
          ? "text-muted-foreground/60"
          : config.templateId === template.id ? "text-primary" : "text-muted-foreground"
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
          {regularTemplates.map((t) => <TemplateThumb key={t.id} template={t} locked={false} />)}
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
          {proTemplates.map((t) => <TemplateThumb key={t.id} template={t} locked={!hasAccess} />)}
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
          {ultraTemplates.map((t) => <TemplateThumb key={t.id} template={t} locked={!hasAccess} />)}
        </div>
      </div>
    </div>
  )
}
