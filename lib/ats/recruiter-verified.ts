import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { isImprovableLine } from "./bullet-strength"
import { resolveBulletIndex } from "./bullet-locate"
import type { RecruiterFix } from "./build-report"

/**
 * EL ÁRBITRO: un hallazgo del modelo entra al panel sólo si el CV lo respalda.
 *
 * ── LA REGLA DE NEGOCIO, TEXTUAL (CEO, 2026-08-21) ─────────────────────────
 *
 *   «El que manda es el ATS. Si tenés otras cosas que validar, deberías validar
 *    contra la respuesta del ATS y no a ciegas.»
 *
 * Y eso NO se estaba cumpliendo en un canal, justo el más ruidoso. Auditados los
 * ocho productores que escriben en el informe, siete salen de mediciones
 * deterministas —el puntaje, el desglose, las keywords del matcher, las erratas
 * de `findNearMisses`, los requisitos ya refinados contra el CV, los chequeos de
 * redacción, la estructura—. El octavo, `analysis.criticalFixes`, llegaba del
 * modelo a la pantalla con UN filtro: que el usuario no lo hubiera aceptado ya
 * (`panel-report.ts`). Nada comprobaba que lo que afirmaba fuera cierto.
 *
 * Lo que eso produjo, visto en pantalla y reportado con captura:
 *
 *   · «"…" en , índice 3, está en infinitivo» — el modelo no supo nombrar el
 *     puesto, dejó el hueco, y lo mostramos con la coma colgando. Un usuario no
 *     distingue un error del modelo de un error del producto: lee un producto
 *     roto.
 *   · Un hallazgo etiquetado como crítico sobre un CV con la nota en 100.
 *
 * ── QUÉ SE VERIFICA, Y POR QUÉ SÓLO ESTO ───────────────────────────────────
 *
 * Las tres preguntas son de HECHO, verificables contra el documento, y ninguna
 * juzga si el consejo es bueno — eso es del modelo y ahí no nos metemos:
 *
 *   1. ¿La línea que dice tocar EXISTE? Un `rewrite_bullet` que apunta a un
 *      puesto o a un índice que no están manda al usuario a buscar algo que no
 *      hay, y el botón no puede aplicar nada.
 *   2. ¿El texto que ENTRECOMILLA está en el CV? El prompt le pide citar el
 *      texto real. Una cita que no aparece es una afirmación sobre un CV que no
 *      es éste.
 *   3. ¿La frase está entera? Una referencia con el nombre en blanco («en ,
 *      índice 3») no se arregla con maquillaje: significa que el modelo perdió
 *      el dato, y el hallazgo se apoya en él.
 *
 * FALLA CERRADO SÓLO CUANDO PUEDE COMPROBAR. Si el hallazgo no cita nada y no
 * apunta a ninguna línea, pasa: no hay nada que contrastar, y descartarlo sería
 * censurar la lectura general del reclutador, que es justamente lo que aporta.
 */

/** Cita entre comillas rectas o tipográficas, tal como las escribe el modelo. */
const QUOTED = /[“"«]([^”"»]{12,})[”"»]/g

/**
 * El hueco delator: una preposición, un ESPACIO, y la coma. El nombre se cayó.
 *
 * `\s+` Y NO `\s*`, y la diferencia es todo el guard. Con `\s*` esto mataba
 * prosa perfectamente normal — medido antes de que llegara a producción:
 *
 *   «Responsable de, entre otras cosas, la atención al cliente.»   ← descartado
 *   «A cargo de, además, la caja.»                                  ← descartado
 *   «Trabajó en, por ejemplo, tres sucursales.»                     ← descartado
 *
 * Tres hallazgos buenos tirados por una coma incidental. Lo que separa el hueco
 * real de la coma legítima es justamente el espacio: cuando el nombre desaparece
 * queda «en , índice 3» —con el hueco a la vista—; cuando la coma es de la frase
 * va pegada a la palabra, «de, entre otras».
 *
 * No se limpia — se descarta. El hallazgo dice «en <puesto>, índice 3»: sin el
 * puesto, lo que queda no le dice al usuario dónde mirar.
 */
const EMPTY_REFERENCE = /\b(?:en|in|de|of|del|para|por|for)\s+,/i

/** Sin acentos, sin puntuación, un espacio: como comparan los demás chequeos. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

interface Role {
  id?: string
  description?: string
}

export interface VerifyContext {
  /** Los puestos del CV, para resolver `targetId` e `index`. */
  roles: readonly Role[]
  /** Todo el texto del CV, normalizado una vez. */
  haystack: string
}

export function verifyContextOf(sectionData: Record<string, unknown>, resumeText: string): VerifyContext {
  return {
    roles: (sectionData.workExperience ?? []) as Role[],
    haystack: normalize(resumeText),
  }
}

/**
 * Por qué se descartó. Se devuelve en vez de un booleano para poder MEDIRLO:
 * un guard que sólo dice «no» esconde si está filtrando de más.
 */
export type RejectReason = "missing_target" | "quote_not_in_cv" | "broken_reference" | "line_has_no_defect" | "panel_only_action"

export function rejectionOf(fix: RecruiterFix, ctx: VerifyContext): RejectReason | null {
  // 1. La línea que dice tocar tiene que existir.
  const a = fix.action
  /**
   * 0. HAY ACCIONES QUE EL MODELO NO PUEDE PEDIR.
   *
   * `set_title` reescribe el titular —la identidad profesional de la persona— y
   * `weave_term` gasta una llamada tejiendo un término que el modelo elegiría
   * por su cuenta. Las dos existen para que DOS chequeos deterministas de «¿te
   * encuentran?» tengan botón; ninguna es una respuesta válida a «¿qué está mal
   * en este CV?». Están en el mismo enum porque el informe usa un solo tipo de
   * acción, y por eso el filtro vive acá y no en el esquema.
   */
  if (a?.kind === "set_title" || a?.kind === "weave_term" || a?.kind === "strip_glyphs") return "panel_only_action"
  if (a?.kind === "rewrite_bullet") {
    const role = ctx.roles.find((r) => r.id === a.targetId)
    if (!role) return "missing_target"
    const bullets = parseBullets(role.description ?? "")
    // El índice es una PISTA, no la identidad —`bullet-locate.ts`—, así que
    // alcanza con que el puesto tenga alguna línea que reescribir. Exigir que el
    // índice caiga justo descartaría hallazgos buenos cuyo número se corrió.
    if (bullets.length === 0) return "missing_target"
  }

  /**
   * 1.b LA LÍNEA QUE SEÑALA TIENE QUE TENER UN DEFECTO — el freno del bucle.
   *
   * ── MEDIDO CONTRA LA API REAL, 2026-08-21 ────────────────────────────────
   *
   * Se corrió el ATS sobre cuatro CVs, se aplicó TODO lo que ofreció, y se
   * volvió a correr sobre el CV ya corregido:
   *
   *   es-cajero-banco    22 → 25   apliqué 3   REINCIDENTES 3
   *   es-peluquera       14 → 37   apliqué 3   REINCIDENTES 3
   *   es-soldador        10 → 22   apliqué 3   REINCIDENTES 3
   *   es-recepcionista   15 → 31   apliqué 3   REINCIDENTES 3
   *
   * Cuatro de cuatro. Y lo que la segunda ronda volvía a señalar era EL TEXTO
   * QUE SE ACABABA DE APLICAR — «Realicé arqueo y cuadre diario de caja contra
   * efectivo, vouchers y comprobantes antes del cierre» marcado otra vez.
   *
   * Pasadas por el motor determinista, esas cuatro líneas dan:
   *
   *   mejorable=false   score=0   razones=[]
   *
   * ── LA CAUSA, Y POR QUÉ NINGÚN GUARD DE TEXTO LA ARREGLA ─────────────────
   *
   * Un modelo al que se le pregunta «¿qué está mal en este CV?» SIEMPRE
   * encuentra algo: es un crítico generativo, y un crítico generativo no tiene
   * condición de parada. Por buena que quede la línea, la próxima corrida
   * propone otra vuelta. No es un defecto del prompt — es la forma de la
   * pregunta.
   *
   * La condición de parada tiene que ser DETERMINISTA, y ya existía. Es la regla
   * que el CEO puso al principio de todo:
   *
   *   «El que manda es el ATS. Si tenés otras cosas que validar, deberías
   *    validar contra la respuesta del ATS y no a ciegas.»
   *
   * Así que la opinión del modelo sobre una línea entra sólo si el motor
   * determinista también ve algo ahí. Si la línea no tiene defecto, no hay nada
   * que arreglar por más que el modelo sepa escribirla distinto.
   *
   * ── EL ERROR SIMÉTRICO, VIGILADO ─────────────────────────────────────────
   *
   * Esto NO silencia al modelo sobre líneas malas: una con apertura de tarea,
   * frase vacía, demasiado corta o demasiado larga sigue pasando, con su botón.
   * Lo único que se calla es «puedo escribir esto distinto» sobre una línea que
   * ya está bien — que es el trabajo infinito.
   *
   * Y sólo aplica a `rewrite_bullet`. Un requisito, una errata o una habilidad
   * que falta no se juzgan por la calidad de una línea.
   */
  if (a?.kind === "rewrite_bullet") {
    /**
     * LA LÍNEA SE BUSCA POR SU TEXTO, NO POR SU POSICIÓN.
     *
     * ── LO REPORTADO (CEO, 2026-08-27) ──────────────────────────────────────
     *
     *   «Me lanza tips que ya se corrigieron y él los vuelve a levantar.»
     *
     * Esto no corre sólo en el servidor: `panel-report` lo vuelve a ejecutar en
     * CADA tecla, con hallazgos congelados del último análisis. Ahí sí hay
     * deriva — aplicar un arreglo borra o mueve líneas y todos los índices de
     * abajo se corren—, así que `bullets[a.index]` devolvía una línea distinta
     * de la señalada: el tip ya resuelto se comparaba contra una línea sana
     * ajena, `isImprovableLine` decía «esa está bien», y el hallazgo sobrevivía.
     *
     * Y el `?? 0` era peor que el drift: un hallazgo SIN índice se juzgaba
     * contra la primera línea del puesto, siempre, fuera cual fuera la que
     * nombraba.
     *
     * Ahora manda `originalText`, que el servidor adjunta cuando todavía no hay
     * deriva. Sin forma de identificar la línea el hallazgo NO se muestra: un
     * consejo sobre una línea que no podemos señalar es exactamente el «diagnóstico
     * sin salida» que este archivo existe para impedir.
     */
    const role = ctx.roles.find((r) => r.id === a.targetId)
    if (!role) return "missing_target"
    const lineas = parseBullets(role.description ?? "")
    const at = a.originalText?.trim()
      ? resolveBulletIndex(lineas, a.index ?? 0, a.originalText)
      : a.index !== undefined
      ? a.index
      : -1
    if (at < 0 || at >= lineas.length) return "missing_target"
    if (!isImprovableLine(lineas[at])) return "line_has_no_defect"
  }

  // 2. Una frase que quedó sin su nombre no se muestra.
  if (EMPTY_REFERENCE.test(fix.issue)) return "broken_reference"

  // 3. Lo que entrecomilla tiene que estar en el CV.
  //
  // Sólo se juzgan las citas LARGAS: el modelo entrecomilla también términos
  // sueltos («"Excel"») que no son una cita del documento sino la palabra de la
  // que habla. Doce caracteres es el corte que separa una de otra.
  for (const m of fix.issue.matchAll(QUOTED)) {
    const quoted = normalize(m[1])
    // El modelo corta la cita con puntos suspensivos: se compara el arranque,
    // que es lo que efectivamente citó.
    const head = quoted.split(" ").slice(0, 8).join(" ")
    if (head.length >= 12 && !ctx.haystack.includes(head)) return "quote_not_in_cv"
  }

  return null
}

/**
 * Los hallazgos que el CV respalda, y el recuento de lo descartado.
 *
 * El recuento viaja para que se pueda vigilar en el panel de errores: si un día
 * este filtro empieza a comerse la mitad de los hallazgos, es el prompt lo que
 * se rompió, y sin el número eso se ve como «el modelo dejó de encontrar cosas».
 */
export function verifiedRecruiterFixes(
  fixes: readonly RecruiterFix[],
  ctx: VerifyContext,
): { kept: RecruiterFix[]; rejected: Record<RejectReason, number> } {
  const rejected: Record<RejectReason, number> = {
    missing_target: 0,
    quote_not_in_cv: 0,
    broken_reference: 0,
    line_has_no_defect: 0,
    panel_only_action: 0,
  }
  const kept: RecruiterFix[] = []
  for (const f of fixes) {
    const why = rejectionOf(f, ctx)
    if (why) rejected[why] += 1
    else kept.push(f)
  }
  return { kept, rejected }
}
