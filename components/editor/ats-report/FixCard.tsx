"use client"

import { useTranslations } from "next-intl"
import { ArrowRight, Check, Loader2, RotateCcw, Sparkles, Trash2 } from "lucide-react"
import type { ReportCheck, ReportResolution } from "@/lib/ats/report"
import BulletAnatomy from "./BulletAnatomy"

/**
 * Una corrección, con el cambio exacto a la vista antes de tocar el CV.
 *
 * TRES REGLAS QUE ESTA TARJETA NO PUEDE ROMPER:
 *
 * 1. EL DIAGNÓSTICO VA ARRIBA DEL TEXTO. El usuario lee POR QUÉ esta línea
 *    necesita trabajo antes de ver la reescritura, nunca después. Al revés, la
 *    propuesta se lee como una opinión de estilo.
 * 2. LA CIFRA SE CONFIRMA, NO SE DESCARTA. Cuando la reescritura trae un número
 *    que el CV no respalda, llega marcada. Antes se tiraba la sugerencia entera y
 *    se perdía una línea mejor en todo lo demás por un dato que él conoce.
 * 3. NADA SE APLICA SIN QUE SE VEA. `before` y `after` juntos, siempre.
 */

const SEVERITY_STYLE = {
  crit: { bg: "var(--a-bad-soft)", fg: "var(--a-bad)", key: "sev_critical" },
  warn: { bg: "var(--a-warn-soft)", fg: "var(--a-warn)", key: "sev_warning" },
  pass: { bg: "var(--a-ok-soft)", fg: "var(--a-ok)", key: "sev_done" },
} as const

interface Props {
  check: ReportCheck
  resolution?: ReportResolution
  /** Términos de la vacante, para medir cuáles aterrizan en la reescritura. */
  terms: readonly string[]
  applied: boolean
  onApply: (checkId: string) => void
  onUndo: (checkId: string) => void
  /** Sólo para viñetas: a veces la línea no se arregla, se corta. */
  onRemove?: (checkId: string) => void
  /** Y lo que va en su lugar: un término de la vacante, escrito por el ejecutor. */
  onReplace?: (term: string) => void
  focused?: boolean
  /**
   * Su lugar en la lista, como en el diseño. Numerar no es decoración: convierte
   * «veinte tarjetas» en una cola con principio y final, y le da al usuario una
   * referencia para volver («me quedé en la 07») cuando el modal se cierra.
   */
  order?: number
  /**
   * Lo decide el padre, que es quien sabe si la petición está en vuelo.
   *
   * La primera versión tenía su propio estado y lo apagaba en un `.finally` sobre
   * `Promise.resolve(onApply(...))` — pero `onApply` devuelve `void`, así que la
   * promesa resolvía en el mismo tick y el spinner no se veía nunca.
   */
  busy?: boolean
}

export default function FixCard({
  check, resolution, terms, applied, onApply, onUndo, onRemove, onReplace, focused, order, busy,
}: Props) {
  const t = useTranslations("editor.ats")
  const sev = SEVERITY_STYLE[applied ? "pass" : check.state === "crit" ? "crit" : "warn"]

  const before = resolution?.before ?? ""
  const after = resolution?.text ?? ""
  const isBullet = check.action?.kind === "rewrite_bullet"
  /** La fusión viaja como `rewrite_bullet`, pero une dos líneas — no reescribe una. */
  const isMerge = check.id.startsWith("tips.merge")
  /**
   * CORTAR NO ES REESCRIBIR, y acá la diferencia es la que cierra el bucle.
   *
   * Un puesto con once líneas tiene un problema de VOLUMEN: reescribir la peor no
   * saca a ninguna del último puesto —otra ocupa su lugar— y el panel devuelve la
   * misma cantidad para siempre. Estas tarjetas ofrecen la tijera y nada más: es
   * la única acción que baja el conteo, y por eso la única que termina.
   */
  const isCut = check.id.startsWith("tips.cut")
  /** El término que la vacante pide y el CV no dice, para ofrecer el reemplazo. */
  const replacement = typeof check.params?.replacement === "string" ? check.params.replacement : ""
  /**
   * Hay hallazgos que no traen texto escrito y aun así se resuelven: fusionar dos
   * líneas es unirlas, no reescribirlas, y el trabajo lo hace otro camino. Sin
   * esto la tarjeta les apagaba el botón por no tener «después», y una función
   * entera quedaba inalcanzable dentro del rediseño.
   */
  const evidence = check.evidence ?? []
  // Una viñeta siempre es accionable: si tailor no escribió su reemplazo, el
  // botón se lo pide a la IA. Un hallazgo con botón apagado y sin otra salida es
  // un diagnóstico sin puerta, que es lo que este panel existe para no hacer.
  /**
   * QUÉ ACCIONES SABE APLICAR EL PANEL — las seis, no una.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-21) ───────────────────────
   *
   * «Además que el botón de Aplicar está deshabilitado.» Y lo estaba: esto
   * preguntaba sólo por `rewrite_bullet`, así que un hallazgo cuya acción fuera
   * `rewrite_summary`, `fix_dates`, `remove_duplicates`, `add_skill` o
   * `replace_text` llegaba con la tarjeta escrita y el botón gris — aunque el
   * manejador del panel las aplica TODAS (`ATSScorePanel`, ~840-915).
   *
   * Una tarjeta que propone algo y no deja apretarlo es peor que no mostrarla:
   * ocupa lugar, promete trabajo y no lo entrega.
   */
  /**
   * SÓLO LAS QUE SE APLICAN SOLAS. Éstas no necesitan que el modelo haya escrito
   * nada: se ejecutan con sus propios parámetros (`ATSScorePanel`, ~900-910).
   *
   * `rewrite_summary` NO está, y la ausencia es la parte importante: sin texto
   * escrito, aplicarlo guardaría un vacío sobre el resumen del usuario. Un
   * primer intento lo incluyó y el test que ya existía lo cazó — «aplicar un
   * vacío borraría el campo». La regla vieja era demasiado ANGOSTA, no
   * inexistente, y ensancharla de más habría cambiado un botón muerto por
   * pérdida de datos.
   */
  const a = check.action
  const canApplyAction =
    a?.kind === "fix_dates" ||
    a?.kind === "remove_duplicates" ||
    (a?.kind === "add_skill" && !!a.value) ||
    (a?.kind === "replace_text" && !!a.value && !!a.replacement)
  const actionable = !!after || evidence.length > 0 || isBullet || canApplyAction

  return (
    <article
      data-check={check.id}
      className="rounded-xl border transition-shadow"
      style={{
        borderColor: focused ? "var(--a-ai)" : "var(--a-border)",
        background: applied ? "var(--a-surface-2)" : "var(--a-surface)",
        boxShadow: focused ? "var(--a-sh-md)" : "var(--a-sh-sm)",
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
              style={{ background: sev.bg, color: sev.fg }}>
              {t(sev.key)}
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--a-muted-2)" }}>
              {t(`section_${check.section}`)}
            </span>
            {/* Cuánto mueve, también acá: es lo que decide si vale el clic. */}
            <span className="text-[9.5px] font-bold" style={{ color: check.weight > 0 ? "var(--a-accent-ink)" : "var(--a-muted-2)" }}>
              {check.weight > 0 ? t("check_points", { points: check.weight }) : t("check_no_score")}
            </span>
          </div>
          <h3 className="text-[13px] font-bold leading-snug" style={{ color: "var(--a-ink)" }}>
            {t(check.titleKey, check.params)}
          </h3>
          {check.detailKey && (
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
              <b style={{ color: "var(--a-ink-2)" }}>{t("why_matters")}</b>{" "}
              {t(check.detailKey, check.params)}
            </p>
          )}
        </div>
      </header>

      {/* La cifra propuesta, marcada para que él la confirme o la corrija. */}
      {resolution?.needsFigureConfirm && (
        <p className="mx-3.5 mt-2.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold leading-snug"
          style={{ background: "var(--a-warn-soft)", color: "var(--a-ink-2)" }}>
          {t("reason_confirm_figure_hint")}
        </p>
      )}

      {/* QUÉ CAMBIA SI APRIETA. Sin esto la tarjeta del reclutador mostraba una
          cita y un botón: ni el problema ni el arreglo, sólo prosa del modelo
          entre comillas. El texto ya llegaba en el informe (`fixHint`) y no lo
          pintaba nadie. Va antes del botón porque es lo que decide el clic. */}
      {!after && check.fixHint && (
        <p
          className="mx-3.5 mt-2.5 rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed"
          style={{ borderColor: "var(--a-ai)", background: "var(--a-ai-soft)", color: "var(--a-ink-2)" }}
        >
          <b className="mr-1 text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--a-ai-ink)" }}>
            {t("fix_hint_label")}
          </b>
          {check.fixHint}
        </p>
      )}

      {/* Sin reescritura, se muestran las líneas de las que habla: el usuario ve
          QUÉ se va a tocar antes de tocarlo, que es la regla que no cambia. */}
      {!after && evidence.length > 0 && (
        <ul className="flex flex-col gap-1.5 px-3.5 pt-3">
          {evidence.slice(0, 4).map((e, i) => (
            <li key={`${check.id}-ev-${i}`} className="rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed"
              style={{ borderColor: "var(--a-border)", background: "var(--a-surface-3)", color: "var(--a-ink-2)" }}>
              {e}
            </li>
          ))}
        </ul>
      )}

      {after && (
        <div className="px-3.5 pt-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--a-border)", background: "var(--a-surface-3)" }}>
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--a-muted-2)" }}>
                {t("diff_current")}
              </span>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
                {before || t("diff_empty")}
              </p>
            </div>
            <ArrowRight className="mx-auto hidden h-3.5 w-3.5 shrink-0 md:block" style={{ color: "var(--a-border-2)" }} />
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--a-ai)", background: "var(--a-ai-soft)" }}>
              <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--a-ai-ink)" }}>
                {t("diff_rewrite")}
              </span>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--a-ink)" }}>{after}</p>
            </div>
          </div>

          {isBullet && before && <div className="mt-2"><BulletAnatomy before={before} after={after} terms={terms} /></div>}

          {/* Qué medir, dicho junto a la línea y no en otra sección. El número lo
              pone el candidato: acá nunca va una cifra inventada. */}
          {resolution?.metricHint && (
            <p className="mt-2 rounded-lg px-2.5 py-1.5 text-[10.5px] leading-snug"
              style={{ background: "var(--a-warn-soft)", color: "var(--a-ink-2)" }}>
              {t("metric_hint_line", { hint: resolution.metricHint })}
            </p>
          )}
          {resolution?.demonstrates && (
            <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold"
              style={{ background: "var(--a-accent-soft)", color: "var(--a-accent-ink)" }}>
              {t("reason_demonstrates", { skill: resolution.demonstrates })}
            </span>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2 px-3.5 py-3">
        {applied ? (
          <>
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: "var(--a-ok)" }}>
              <Check className="h-3.5 w-3.5" /> {t("fix_applied")}
            </span>
            <button type="button" onClick={() => onUndo(check.id)}
              className="ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold"
              style={{ borderColor: "var(--a-border)", color: "var(--a-ink-2)" }}>
              <RotateCcw className="h-3 w-3" /> {t("fix_undo")}
            </button>
          </>
        ) : (
          <>
            {/* La tarjeta de corte NO ofrece reescribir: ver arriba. */}
            {isCut ? (
              <>
                {onRemove && (
                  <button type="button" onClick={() => onRemove(check.id)} disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white transition-opacity disabled:opacity-60"
                    style={{ background: "var(--a-bad)" }}>
                    <Trash2 className="h-3 w-3" /> {t("fix_remove")}
                  </button>
                )}
                {/* CORTAR DEJA UN HUECO. Decirle «cortá» sin decirle «poné esto»
                    es media instrucción — y lo que va en su lugar no se
                    improvisa: es un término que ESTA vacante pide y su CV no
                    dice, escrito por el ejecutor con la línea a la vista. */}
                {replacement && onReplace && (
                  <button type="button" onClick={() => onReplace(replacement)} disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold"
                    style={{ borderColor: "var(--a-ai)", color: "var(--a-ai-ink)", background: "var(--a-ai-soft)" }}>
                    <Sparkles className="h-3 w-3" /> {t("fix_replace_with", { term: replacement })}
                  </button>
                )}
              </>
            ) : (
            <button type="button" onClick={() => onApply(check.id)} disabled={busy || !actionable}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--a-ai)" }}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {busy
                ? t("fix_working")
                /* El botón DICE LO QUE HACE. En la tarjeta de fusión —«estas dos
                   líneas podrían ser el mismo trabajo»— decía «Mejorar la
                   viñeta», y lo que hace es unir DOS en una. El usuario apretaba
                   esperando una reescritura y recibía la respuesta de otra
                   pregunta: «las leí y cuentan trabajos distintos». La respuesta
                   era correcta; la pregunta que el botón prometía, no. */
                : isMerge ? t("fix_merge_pair")
                : isBullet ? t("fix_apply_bullet")
                : t("fix_apply")}
            </button>
            )}
            {/* Borrar es una salida legítima: una línea que no gana su renglón
                resta más de lo que suma, y reescribirla no la salva. */}
            {!isCut && isBullet && onRemove && (
              <button type="button" onClick={() => onRemove(check.id)}
                className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold"
                style={{ borderColor: "var(--a-border)", color: "var(--a-bad)" }}>
                <Trash2 className="h-3 w-3" /> {t("fix_remove")}
              </button>
            )}
          </>
        )}
      </footer>
    </article>
  )
}
