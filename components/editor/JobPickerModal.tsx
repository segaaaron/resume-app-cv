"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Z_MODAL_FOLLOW_UP } from "@/lib/ui/z-layers"
import { useTranslations } from "next-intl"
import { Briefcase, X } from "lucide-react"

export interface PickableJob {
  id: string
  jobTitle: string
  employer: string
  startDate?: string
  endDate?: string
}

interface Props {
  title: string
  subtitle: string
  jobs: PickableJob[]
  /** Role the analysis suggests — shown first, badged, and focused. */
  recommendedId?: string
  recommendedLabel?: string
  onPick: (id: string) => void
  onClose: () => void
}

/**
 * "Where should this go?" — the answer to a suggestion that has no obvious home.
 *
 * The soft-skill weaver used to dead-end here: when the model could not pick a
 * role where the behaviour credibly fits, the user got an info toast ("I did not
 * find a role where this fits naturally") and nothing to press. The model's
 * inability to choose is not a reason to refuse the user — only the candidate
 * knows which job that really happened in. So the roles are listed and they pick.
 */
export default function JobPickerModal({ title, subtitle, jobs, recommendedId, recommendedLabel, onPick, onClose }: Props) {
  const t = useTranslations("editor.ats")
  const cardRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") { onClose(); return }
    if (e.key !== "Tab" || !cardRef.current) return
    const f = cardRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
    if (f.length === 0) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      /* ENCIMA DE QUIEN LO ABRIÓ. Esto se abre DESDE el modal del ejecutor
         (`z-9999`) y estaba en `z-130`: quedaba detrás, invisible y sin poder
         cerrarse, con la app esperando una respuesta que el usuario no veía. */
      style={{ zIndex: Z_MODAL_FOLLOW_UP }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-picker-title"
      onKeyDown={onKeyDown}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={cardRef}
        className="relative w-full max-w-md rounded-3xl border border-cyan-100 bg-white p-5 shadow-[0_40px_100px_-20px_rgba(26,46,74,0.45)] animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("job_picker_close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="job-picker-title" className="pr-8 text-[15px] font-black text-[#1a2e4a] leading-tight">{title}</h2>
        <p className="mt-1 text-[11.5px] text-slate-500 leading-relaxed">{subtitle}</p>

        <ul className="mt-4 flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          {/* The suggested role leads the list: a recommendation the user can
              override beats both a silent choice and a blank question. */}
          {[...jobs].sort((a, b) => Number(b.id === recommendedId) - Number(a.id === recommendedId)).map((j, i) => {
            const recommended = !!recommendedId && j.id === recommendedId
            const period = [j.startDate, j.endDate].filter(Boolean).join(" – ")
            return (
              <li key={j.id}>
                <button
                  ref={i === 0 ? firstRef : undefined}
                  type="button"
                  onClick={() => onPick(j.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition-all hover:border-[#00D4FF] hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:ring-offset-1 ${
                    recommended ? "border-[#00D4FF] bg-cyan-50/50" : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0077B6] text-white shadow-sm">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12.5px] font-bold text-[#1a2e4a]">{j.jobTitle || t("job_picker_untitled")}</span>
                      {recommended && recommendedLabel && (
                        <span className="shrink-0 rounded-full bg-[#00D4FF]/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#0077B6]">
                          {recommendedLabel}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[10.5px] text-slate-500">
                      {[j.employer, period].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>,
    document.body,
  )
}
