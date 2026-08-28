"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, FileText, Search, Sparkles, Tag, User, Briefcase } from "lucide-react"
import { scoreBand, type ReportSection, type ReportSectionId, type ReportCheck } from "@/lib/ats/report"

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
  /** Qué chequeo ya se aplicó. Lo sabe el panel; la sección sólo ordena con él. */
  isApplied?: (checkId: string) => boolean
  /** Lo que va debajo de los chequeos: la tabla de términos, el panel de viñetas. */
  children?: React.ReactNode
}

export default function ReportSectionCard({ section, defaultOpen = false, renderCheck, isApplied, children }: Props) {
  /**
   * LO APLICADO BAJA, NO SE MEZCLA (reportado con captura, 2026-08-28).
   *
   *   «Cuando aplico un improve bullet o lo borro, ¿cómo lo veo como aplicado?
   *    Sería mejor que las cosas que se aplican vayan a aplicados.»
   *
   * La tarjeta aplicada ya se pinta en gris y con su tilde, pero seguía en el
   * mismo renglón donde estaba: entre las pendientes. Con doce tarjetas abiertas
   * eso obliga a recorrer la lista entera para saber qué queda por hacer, y el
   * trabajo terminado compite por la atención con el que falta.
   *
   * No se ocultan —ver que algo se aplicó es la mitad de la confianza— y no se
   * mueven de sección: bajan al final de la suya, con el orden relativo intacto.
   * `sort` de Array es estable, así que dos aplicadas conservan su orden.
   */
  const ordenadas = isApplied
    ? [...section.checks].sort((a, b) => Number(isApplied(a.id)) - Number(isApplied(b.id)))
    : section.checks
  const t = useTranslations("editor.ats")
  const [open, setOpen] = useState(defaultOpen)
  const Icon = SECTION_ICON[section.id]

  const openCount = section.checks.filter((c) => c.state !== "pass").length
  const total = section.checks.length
  /**
   * DOS NÚMEROS CIERTOS QUE JUNTOS SE LEEN COMO UNA MENTIRA.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-28) ────────────────────────
   *
   *   «Esta al 100 pero aún muestra cosas por hacer.»
   *
   * Y los dos números son correctos: el porcentaje mide COBERTURA DE PUNTAJE y
   * la insignia cuenta HALLAZGOS. Una sección puede tener el puntaje entero y
   * seguir teniendo avisos que no pesan — cada tarjeta ya lo dice, una por una,
   * con su «no mueve el puntaje». Lo que faltaba era decirlo ARRIBA, donde
   * están los dos números juntos.
   *
   * Es la regla que este panel ya aplicó en la cabecera: dos cifras que cuentan
   * cosas distintas, o se explican, o una sobra.
   */
  const openWeightless = openCount > 0 && section.checks.every((c) => c.state === "pass" || !c.weight)
  const scored = section.scoreCategory !== null
  const pct = section.coveragePct
  /** Rojo, amarillo o verde — decidido por el único dueño de la regla. */
  const banda = scored && pct !== null ? scoreBand(pct) : null

  return (
    <div
      className="overflow-hidden rounded-xl border transition-colors"
      style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}
    >
      {/*
        DOS LÍNEAS, Y EL TÍTULO MANDA EN LA PRIMERA.
        ── EL DEFECTO (reportado con captura, 2026-08-21) ──────────────────────
        Todo vivía en UNA fila flex con cinco hijos: icono, título, porcentaje,
        chip de conteo y chevron. En un riel de ~320px sólo hay ~292 útiles, así
        que el título —el único elástico— se comía el sobrante de los otros
        cuatro. Con chip y porcentaje juntos le quedaban ~120px y se partía a
        mitad de frase: «Que te / encuentren», «Habilidades / duras». Las filas
        sin chip entraban en una línea, y esa diferencia era lo que se veía feo:
        la misma tarjeta con dos alturas y dos ritmos según qué datos trajera.
        Ahora la primera línea lleva SÓLO lo que identifica la sección —icono,
        nombre, cobertura— y todo lo que la mide baja a la segunda. El título
        pasa de ~120px a ~188px: entra siempre, y las seis tarjetas miden igual.
      */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-col gap-2 px-3.5 py-3 text-left transition-colors hover:brightness-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
        style={{ outlineColor: "var(--a-accent-ink)" }}
      >
        <span className="flex w-full items-center gap-2.5">
          {/*
            EL SEMÁFORO SE VE, Y NO SÓLO POR EL COLOR.
            La regla del CEO —<55 rojo · 55-79 amarillo · ≥80 verde— vivía sólo en
            una barra de 1px al pie: con el rojo y el verde a esa altura, las seis
            tarjetas se leían iguales de un vistazo. El punto la pone a la altura
            del título, y como el color por sí solo no puede portar significado
            (un daltónico ve seis puntos grises), el estado viaja además en el
            `aria-label` y en la palabra que acompaña al número.
          */}
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={
              banda
                ? { background: `var(--a-${banda}-soft)`, color: `var(--a-${banda}-ink)` }
                : { background: "var(--a-surface-3)", color: "var(--a-ink-2)" }
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold leading-snug" style={{ color: "var(--a-ink)" }}>
              {t(`section_${section.id}`)}
            </span>
            {/* La excepción se dice; la regla no. «Mueve el puntaje» repetido en
                las seis tarjetas era ruido que ocupaba el lugar de la señal. */}
            {!scored && (
              <span className="block text-[10px] leading-tight" style={{ color: "var(--a-muted-2)" }}>
                {t("section_no_score")}
              </span>
            )}
          </span>

          {scored && pct !== null && (
            <span className="flex shrink-0 items-baseline gap-1">
              <span
                className="text-[17px] font-black leading-none tabular-nums"
                style={{ color: `var(--a-${banda}-ink)` }}
              >
                {pct}
              </span>
              <small className="text-[9px] font-semibold" style={{ color: "var(--a-muted-2)" }}>%</small>
            </span>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--a-muted-2)" }}
          />
        </span>

        {/*
          LA BARRA OCUPA EL ANCHO, y el chip se apoya en su derecha. Antes competía
          con el rótulo repetido y quedaba de ~90px: a esa medida un 25% y un 60%
          se ven casi igual, que es lo contrario de lo que una barra sirve.
        */}
        {(scored && pct !== null) || total > 0 ? (
          <span className="flex w-full items-center gap-2 pl-[38px]">
            {scored && pct !== null && (
              <span
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--a-track)" }}
                role="img"
                aria-label={`${pct}% — ${t(`section_band_${banda}`)}`}
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: `var(--a-${banda})` }}
                />
              </span>
            )}

            {total > 0 && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${scored && pct !== null ? "" : "ml-auto"}`}
                style={
                  openCount > 0
                    ? { background: "var(--a-warn-soft)", color: "var(--a-warn-ink)" }
                    : { background: "var(--a-ok-soft)", color: "var(--a-ok-ink)" }
                }
              >
                {openCount > 0
                  ? openWeightless
                    ? t("section_open_no_score", { count: openCount })
                    : t("section_open", { count: openCount })
                  : t("section_clean", { count: total })}
              </span>
            )}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
            {t(`section_${section.id}_blurb`)}
          </p>
          {ordenadas.map((c) => (
            <div key={c.id}>{renderCheck(c)}</div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}
