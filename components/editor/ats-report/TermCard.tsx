"use client"

import { useTranslations } from "next-intl"
import { PRESSABLE } from "../ats-panel/panel-helpers"
import { Loader2, Plus, Sparkles } from "lucide-react"
import type { ReportTerm } from "@/lib/ats/report"

/**
 * Un término que la vacante pide y el CV no dice, como tarjeta del ejecutor.
 *
 * POR QUÉ ACÁ Y NO SÓLO EN LA TABLA. Las duras pesan .45 — más que cualquier
 * otra cosa del informe — y vivían fuera del ejecutor, con dos botones al
 * costado de una fila. Por eso el panel decía «5 términos sin decir» y el botón
 * ofrecía «resolver 1»: lo más caro del CV no estaba contado como trabajo.
 *
 * LOS DOS BOTONES NO SON LO MISMO, y por eso siguen siendo dos: escribirlo
 * dentro de una viñeta con fecha es una prueba; agregarlo a la lista es una
 * afirmación. Para el filtro valen igual; para quien entrevista, no.
 */
interface Props {
  term: ReportTerm
  order?: number
  onWeave: (term: string) => void
  onAdd: (term: string) => void
  added: boolean
  busy: boolean
}

export default function TermCard({ term, order, onWeave, onAdd, added, busy }: Props) {
  const t = useTranslations("editor.ats")
  /**
   * Ya está en Habilidades; lo que le falta es la viñeta que lo respalde.
   * Ofrecerle «agregar a la lista» sería un botón que no cambia nada — la clase
   * de clic que este panel viene borrando.
   */
  const unbacked = term.cv > 0

  return (
    <div
      className="rounded-xl border"
      data-term={term.term}
      style={{
        borderColor: added ? "var(--a-ok)" : "var(--a-border)",
        background: added ? "var(--a-surface-2)" : "var(--a-surface)",
        boxShadow: "var(--a-sh-sm)",
      }}
    >
      <header className="flex items-start gap-2.5 px-3.5 pt-3.5">
        {order !== undefined && (
          <span className="mt-0.5 shrink-0 text-[11px] font-bold tabular-nums" style={{ color: "var(--a-muted-2)" }}>
            {String(order).padStart(2, "0")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em]"
              style={
                unbacked
                  ? { background: "var(--a-warn-soft)", color: "var(--a-warn-ink)" }
                  : { background: "var(--a-bad-soft)", color: "var(--a-bad-ink)" }
              }>
              {t(`section_${term.section}`)}
            </span>
            {unbacked && (
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "var(--a-warn-soft)", color: "var(--a-warn-ink)" }}>
                {t("term_list_only")}
              </span>
            )}
            <span className="text-[9.5px] font-bold tabular-nums" style={{ color: "var(--a-accent-ink)" }}>
              {term.jd} / {term.cv}
            </span>
          </div>
          <h3 className="text-[13px] font-bold leading-snug" style={{ color: "var(--a-ink)" }}>
            {t(unbacked ? "term_card_title_unbacked" : "term_card_title", { term: term.term })}
          </h3>
          <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
            <b style={{ color: "var(--a-ink-2)" }}>{t("why_matters")}</b>{" "}
            {/* EL MISMO DATO NO PUEDE DECIRSE DE DOS FORMAS QUE SE CONTRADICEN.
                (reportado con captura, 2026-08-28)

                Con `jd === 0` esta tarjeta decía «el aviso lo pide 0 veces… es
                la palanca más grande del puntaje»: las dos mitades de la misma
                frase peleándose. Y `jd === 0` NO significa que el aviso no lo
                pida — significa que el contador no pudo contarlo, porque la
                extracción devuelve la forma canónica («Asynchronous
                programming») y el aviso lo escribe con otras palabras.

                La tabla de términos ya lo decía bien, con su propia frase. Eran
                dos componentes contestando lo mismo distinto. Se usa la que ya
                existe: un dato, una redacción. */}
            {term.jd > 0
              ? t(unbacked ? "term_card_why_unbacked" : "term_card_why", { jd: term.jd })
              : t(unbacked ? "term_card_why_unbacked_uncounted" : "term_card_why_uncounted")}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-3.5 py-3">
        <button type="button" onClick={() => onWeave(term.term)} disabled={busy || added}
          className={`${PRESSABLE} flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white`}
          style={{ background: "var(--a-ai)" }}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {t("term_card_weave")}
        </button>
        {!unbacked && (
          <button type="button" onClick={() => onAdd(term.term)} disabled={busy || added}
            className={`${PRESSABLE} flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold`}
            style={{ borderColor: "var(--a-border)", color: "var(--a-ink-2)" }}>
            <Plus className="h-3 w-3" /> {t("term_card_add")}
          </button>
        )}
      </div>

      <p className="border-t px-3.5 py-2 text-[10.5px] leading-snug"
        style={{ borderColor: "var(--a-border)", color: "var(--a-muted-2)" }}>
        {t(unbacked ? "term_card_note_unbacked" : "term_card_note")}
      </p>
    </div>
  )
}
