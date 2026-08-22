"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, FileText, Search, Sparkles, Tag, User, Briefcase } from "lucide-react"
import type { ReportSection, ReportSectionId, ReportCheck } from "@/lib/ats/report"

/**
 * Una sección del informe.
 *
 * LO QUE ESTA TARJETA RESUELVE: el panel anterior mostraba un 100 grande y, más
 * abajo, arreglos críticos, sin que nada explicara cómo las dos cosas podían ser
 * ciertas. La respuesta es que sólo algunas secciones mueven el número — y ahora
 * cada una lo declara en su encabezado, al lado de su cobertura o en lugar de ella.
 *
 * Una sección sin categoría de puntaje dice «no mueve el número» y no muestra
 * porcentaje. Inventarle uno para que la fila quede pareja sería volver al defecto.
 */

const SECTION_ICON: Record<ReportSectionId, typeof Search> = {
  search: Search,
  hard: Tag,
  soft: User,
  other: Sparkles,
  format: FileText,
  tips: Briefcase,
}

interface Props {
  section: ReportSection
  /** Abierta de entrada. Las que puntúan lo están; las de consejos, no. */
  defaultOpen?: boolean
  renderCheck: (check: ReportCheck) => React.ReactNode
  /** Lo que va debajo de los chequeos: la tabla de términos, el panel de viñetas. */
  children?: React.ReactNode
}

export default function ReportSectionCard({ section, defaultOpen = false, renderCheck, children }: Props) {
  const t = useTranslations("editor.ats")
  const [open, setOpen] = useState(defaultOpen)
  const Icon = SECTION_ICON[section.id]

  const openCount = section.checks.filter((c) => c.state !== "pass").length
  const total = section.checks.length
  const scored = section.scoreCategory !== null
  const pct = section.coveragePct

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--a-surface-3)", color: "var(--a-ink-2)" }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-tight" style={{ color: "var(--a-ink)" }}>
            {t(`section_${section.id}`)}
          </span>
          {/* Lo que decide si el usuario puede confiar en el número de arriba. */}
          <span className="mt-0.5 block text-[10px] leading-tight" style={{ color: "var(--a-muted-2)" }}>
            {scored ? t("section_moves_score") : t("section_no_score")}
          </span>
        </span>

        {scored && pct !== null && (
          <span className="shrink-0 text-[15px] font-bold tabular-nums" style={{ color: "var(--a-ink)" }}>
            {pct}
            <small className="ml-0.5 text-[9px] font-semibold" style={{ color: "var(--a-muted-2)" }}>%</small>
          </span>
        )}

        {total > 0 && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold"
            style={
              openCount > 0
                ? { background: "var(--a-warn-soft)", color: "var(--a-warn-ink)" }
                : { background: "var(--a-ok-soft)", color: "var(--a-ok-ink)" }
            }
          >
            {openCount > 0 ? t("section_open", { count: openCount }) : t("section_clean", { count: total })}
          </span>
        )}

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--a-muted-2)" }}
        />
      </button>

      {scored && pct !== null && (
        <div className="h-[3px] w-full" style={{ background: "var(--a-track)" }}>
          <span
            className="block h-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? "var(--a-ok)" : pct >= 55 ? "var(--a-warn)" : "var(--a-bad)",
            }}
          />
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
            {t(`section_${section.id}_blurb`)}
          </p>
          {section.checks.map((c) => (
            <div key={c.id}>{renderCheck(c)}</div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
