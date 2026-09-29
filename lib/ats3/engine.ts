// lib/ats3/engine.ts
//
// EL ORQUESTADOR. Lee el CV, decide qué se pregunta y qué se sirve del caché,
// aplica los parches sobre una copia y mide el delta real.
//
// ── LA REGLA QUE ORDENA TODO EL MOTOR ───────────────────────────────────────
// El modelo PROPONE contenido; el código DECIDE. Ninguna salida de modelo llega
// al usuario sin pasar por `guards.ts`, y ningún puntaje sale de un modelo:
// se recalcula acá, sobre una copia, y se resta.
//
// ── POR QUÉ EL MOTOR NO IMPORTA EL MÓDULO DE IA ─────────────────────────────
// Recibe un PUERTO (`AtsAi`): seis funciones que devuelven datos ya validados.
// Con eso, todo lo que este archivo decide —qué se cachea, qué se reintenta, qué
// se aplica, cuánto sumó— se prueba ejecutándolo, sin red y sin gastar un token.
// Un motor que sólo se puede probar llamando a OpenAI no se prueba nunca.
//
// ── EL CACHÉ, EN UNA LÍNEA ──────────────────────────────────────────────────
// Cada capa se direcciona por CONTENIDO: la clave es el hash de todo aquello de
// lo que depende la respuesta, incluido el modelo y la versión del prompt. Si
// nada de eso cambió, la respuesta guardada sigue siendo válida por definición,
// y reanalizar cuesta cero.

import { buildTermIndex, findingId, nodeHash, sha256, type AnchoredSuggestion, type Finding, type JobSpec, type Resolution, type ResumeTree } from "@/lib/ats3/contracts"
import { afterAccept, type Ledger } from "@/lib/ats3/ledger"
import { isStale, loyalty, type GuardVerdict } from "@/lib/ats3/guards"
import { coverageOf, cvTextOf, deltaOf, gainOf, postingWeights, scoreResume, softCoverageOf, termsOf, type AuditFacts, type ParseChecks, type Score } from "@/lib/ats3/score"
import { type RawResume, buildTree, readableChecks, writeInto } from "@/lib/ats3/cv"
import { findingsOf } from "@/lib/ats3/findings"
import { JUICIOS_VACIOS, type Juicios, conFormasDelCv, fijarJuicios } from "@/lib/ats3/judgments"
import { type AtsAi, type AtsStore, cacheKey } from "@/lib/ats3/ports"
// Viven con quien mide; se re-exportan porque el motor es la puerta de siempre.
export { coverageOf, cvTextOf, termsOf } from "@/lib/ats3/score"
// Cada módulo del motor, por la misma puerta: quien ya importa de acá no cambia.
export { cacheKey } from "@/lib/ats3/ports"
export type { AtsAi, AtsStore, CacheKind, RewriteInput, SummaryInput } from "@/lib/ats3/ports"
export { buildTree, readBullets, readableChecks, writeBack, writeInto } from "@/lib/ats3/cv"
export type { RawResume } from "@/lib/ats3/cv"
export { findingsOf, sameRoot, skillPlan } from "@/lib/ats3/findings"
export { JUICIOS_VACIOS, conFormasDelCv, fijarJuicios } from "@/lib/ats3/judgments"
export type { Juicios } from "@/lib/ats3/judgments"
export { runRewrite } from "@/lib/ats3/rewrite"
export type { RewriteRequest, RewriteResult } from "@/lib/ats3/rewrite"

// ─────────────────────────────────────────────────────────────────────────────
// EL ANÁLISIS, EN ACTOS
//
// El puntaje está listo en milisegundos; la auditoría tarda segundos. Hacer
// esperar al primero por el segundo es regalar pantalla quieta.
// ─────────────────────────────────────────────────────────────────────────────

export type Act =
  /**
   * El puntaje viaja con los DOS insumos con los que se calculó.
   *
   * Sin ellos la pantalla no puede volver a medir cuando el usuario arregla algo
   * —y hasta hoy no lo hacía: el dial quedaba clavado hasta reanalizar, que
   * cuesta una llamada—. Con la auditoría y las verificaciones en la mano, el
   * re-cálculo es la MISMA función del motor sobre el CV nuevo: cero llamadas,
   * cero lógica de puntaje en la interfaz, y ningún número que el código no
   * pueda probar.
   */
  | { act: "score"; score: Score; tree: ResumeTree; audit: AuditFacts; checks: ParseChecks; weights: Record<string, number> }
  | { act: "job"; spec: JobSpec }
  /** Lo que la vacante pide y el CV ya demuestra: guía dónde gastar términos. */
  | { act: "covered"; terms: string[] }
  /**
   * `resolved` es EL REGISTRO DE LO QUE EL USUARIO YA CERRÓ, y viaja acá.
   *
   * El motor lo lee igual para no volver a señalar lo mismo; entregarlo cuesta
   * cero y es lo único que le permite a la pantalla volver a dibujar «Hechas»
   * después de recargar. Sin esto ese registro vivía en memoria y se perdía con
   * un F5, junto con todo el trabajo que la persona había hecho.
   */
  | { act: "findings"; findings: Finding[]; suppressed: number; regressed: Finding[]; resolved: Resolution[] }

export interface AnalysisInput {
  raw: RawResume
  jdText: string
  language: "es" | "en"
  resumeId: string
  model: string
  ai: AtsAi
  store: AtsStore
}

export interface AnalysisTelemetry {
  /** Llamadas al modelo que ESTA corrida gastó de verdad. */
  calls: number
  served: { jd: boolean; audit: boolean }
}

export async function* runAnalysis(input: AnalysisInput): AsyncGenerator<Act, AnalysisTelemetry> {
  const telemetry: AnalysisTelemetry = { calls: 0, served: { jd: false, audit: false } }
  const tree = buildTree(input.raw)

  // ── acto 2: la vacante ────────────────────────────────────────────────────
  const jdKey = cacheKey.jd(input.jdText, input.model)
  let spec = (await input.store.read("ats3-jd", jdKey)) as JobSpec | null
  if (spec) {
    telemetry.served.jd = true
  } else {
    spec = await input.ai.parseJob(input.jdText, input.language)
    telemetry.calls++
    await input.store.write("ats3-jd", jdKey, spec)
  }

  let index = buildTermIndex(termsOf(spec, tree))

  // ── acto 3: la auditoría ──────────────────────────────────────────────────
  const auditKey = cacheKey.audit(treeHash(tree), jdKey, input.model)
  let audit = (await input.store.read("ats3-audit", auditKey)) as AuditFacts | null
  if (audit) {
    telemetry.served.audit = true
  } else {
    audit = await input.ai.audit(tree, spec)
    telemetry.calls++
    /**
     * CADA VIÑETA TIENE SU JUICIO, O LA PANTALLA NO PUEDE DECIR «12/12».
     *
     * ── MEDIDO EN PRODUCCIÓN (2026-09-24) ─────────────────────────────────────
     * Sobre un CV de 42 viñetas la auditoría devolvió 12. Las otras 30 no
     * recibieron hallazgo ni cuenta, y el cuadro dijo «12/12 abren con acción»:
     * el usuario leyó que su CV entero estaba revisado. Rellenar lo que falta
     * sería inventar un juicio; callarlo, mentir por omisión.
     *
     * Lo que faltó se pide UNA vez más, sólo esas líneas, dentro de la misma
     * petición: la cuota del usuario no cambia. Lo que tampoco vuelva queda sin
     * juicio, y la pantalla lo cuenta contra el total de líneas del CV.
     */
    const juzgadas = new Set(audit.bullets.map((b) => b.id))
    const faltan = new Set(tree.roles.flatMap((r) => r.bullets).filter((b) => !juzgadas.has(b.id)).map((b) => b.id))
    if (faltan.size > 0) {
      const resto: ResumeTree = {
        ...tree,
        roles: tree.roles
          .map((r) => ({ ...r, bullets: r.bullets.filter((b) => faltan.has(b.id)) }))
          .filter((r) => r.bullets.length > 0),
      }
      const segunda = await input.ai.audit(resto, spec)
      telemetry.calls++
      audit = { ...audit, bullets: [...audit.bullets, ...segunda.bullets.filter((b) => faltan.has(b.id))] }
    }
    await input.store.write("ats3-audit", auditKey, audit)
  }

  // Un juicio sólo cambia si cambió el texto que lo sostiene. Ver `fijarJuicios`.
  const lockKey = cacheKey.lock(input.resumeId, input.model)
  const previos = ((await input.store.read("ats3-lock", lockKey)) as Juicios | null) ?? JUICIOS_VACIOS
  const log = ((await input.store.read("ats3-log", cacheKey.log(input.resumeId, jdKey))) as Resolution[] | null) ?? []
  const fijado = fijarJuicios(tree, audit, previos, jdKey, log)
  audit = fijado.audit
  if (JSON.stringify(fijado.juicios) !== JSON.stringify(previos)) await input.store.write("ats3-lock", lockKey, fijado.juicios)

  // Lo que el CV escribe distinto y la auditoría reconoció como lo mismo pasa a
  // ser variante del requisito: desde acá lo cuentan igual el puntaje, la tabla
  // y Tailor. Ver `conFormasDelCv`.
  spec = conFormasDelCv(spec, audit, tree)
  index = buildTermIndex(termsOf(spec, tree))

  // El modelo aporta la cita; el estado de cada requisito lo decide el código
  // sobre el CV entero. Ver `coverageOf`.
  audit = { ...audit, coverage: coverageOf(spec, audit, tree, index), softCoverage: softCoverageOf(spec, audit, tree) }

  // ── acto 1: el puntaje, que no cuesta una sola llamada ────────────────────
  //
  // ── UN SOLO DUEÑO PARA «¿ESTE CV SE LEE BIEN?» (CEO, 2026-09-09) ──────────
  //
  // Acá se fusionaba lo que el motor mide con lo que mandara el CLIENTE, y el
  // cliente ganaba: `{ ...readableChecks(tree), ...input.checks }`. La idea era
  // dejar lugar a una medición futura sobre el PDF renderizado — pero esa
  // medición no existe, el panel manda `{}`, y mientras tanto la pregunta tenía
  // dos dueños con el de afuera decidiendo. El borde aceptaba cualquier clave
  // con cualquier booleano y pisaba lo que el motor había leído del documento.
  //
  // El motor lee el CV: es el único que lo tiene entero delante. Si algún día se
  // mide el PDF de verdad, esa medición entra como un chequeo MÁS de
  // `readableChecks`, no como alguien que le corrige la respuesta desde afuera.
  const checks = readableChecks(tree)
  /**
   * Los pesos salen del TEXTO del aviso, no del modelo: la misma vacante da
   * siempre el mismo peso. Viajan con el puntaje porque la pantalla vuelve a
   * medir al aplicar y no recibe el aviso — un puntaje que cambia según quién
   * lo calcula es peor que uno más grueso.
   */
  const weights = postingWeights(spec, input.jdText)
  const score = scoreResume(tree, spec, audit, checks, weights)
  yield { act: "score", score, tree, audit, checks, weights }
  yield { act: "job", spec }
  yield {
    act: "covered",
    // DEMOSTRADO es escrito DENTRO de una línea: la misma vara que la tabla usa
    // para separar «probado» de «sólo en la lista».
    terms: audit.coverage.filter((c) => c.status === "FOUND" && c.evidenceNodeId).map((c) => c.skill),
  }

  // ── los hallazgos, filtrados por lo que el usuario ya resolvió ────────────
  const escritas = new Set(log.filter((r) => r.resolvedBy === "AI_SUGGESTION" && r.kind !== "dropped").map((r) => r.nodeHashAtResolution))
  const all = findingsOf(tree, audit, score, index, spec, new Set(tree.roles.flatMap((r) => r.bullets).filter((b) => escritas.has(b.hash)).map((b) => b.id)))
  for (const [nombre, ok] of Object.entries(checks)) {
    // Un chequeo que falla y no genera hallazgo es un punto perdido que el
    // usuario no puede recuperar porque nadie le dijo qué arreglar.
    if (ok === false) {
      all.push({
        // El matiz es el chequeo: sin él los siete comparten huella y cerrar
        // uno acusa a los demás de una regresión que nadie provocó.
        id: findingId(tree.summary.id, "parse_risk", nombre),
        type: "parse_risk",
        component: "checks",
        // Lo que un lector automático no extrae bien se arregla en el documento,
        // no reescribiendo una línea: la tarjeta lo dice y no ofrece botón. El
        // comentario lo prometía y el campo decía «rewrite»: el botón de la
        // tarjeta de fechas reescribía el RESUMEN (medido el 2026-09-24).
        remedy: "none",
        merged: ["parse_risk"],
        nodeId: tree.summary.id,
        nodeText: nombre,
        nodeHash: nodeHash(nombre),
        gain: gainOf(score, "checks"),
        detail: nombre,
      })
    }
  }

  const seen = loyalty(all, log, cvTextOf(tree))
  yield { act: "findings", findings: seen.shown, suppressed: seen.suppressed.length, regressed: seen.regressed, resolved: log }

  return telemetry
}

/**
 * LA HUELLA DEL CV, Y CUBRE TODO LO QUE LA AUDITORÍA MIRA.
 *
 * Es la clave de la capa que pregunta por el documento entero: la auditoría
 * (P2). La regla que gobierna las claves de este
 * motor está escrita veinte líneas más arriba —«cada una nombra TODO de lo que
 * depende su respuesta»— y ésta la incumplía: contaba las viñetas y el resumen,
 * y `compactTree` le manda al modelo ADEMÁS el cargo, la empresa, el período y
 * las habilidades declaradas.
 *
 * La consecuencia no se veía como un error. El candidato corregía su cargo —lo
 * que la vacante pide, lo que `titleAlignment` puntúa— la huella salía idéntica,
 * se servía la auditoría vieja y el dial no se movía. Treinta días, que es lo
 * que tarda `purgeAiCaches` en borrar la fila. Hacer lo correcto y que el número
 * no responda es la forma callada del bucle que este motor existe para no tener.
 *
 * El orden es el del documento y no se ordena aparte: mover un puesto de sitio
 * cambia lo que el modelo lee —qué llega primero, qué queda enterrado— así que
 * también tiene que cambiar la huella.
 */
function treeHash(tree: ResumeTree): string {
  return sha256(
    ...tree.roles.flatMap((r) => [r.title, r.company, r.startDate, r.endDate, ...r.bullets.map((b) => b.hash)]),
    tree.summary.hash,
    // Separadas del resto: una habilidad que se llame igual que una empresa no
    // puede producir la misma huella que el caso donde están intercambiadas.
    "skills",
    ...tree.declaredSkills,
  ).slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// APLICAR: sobre una copia, y recién después sobre el CV
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplyResult {
  ok: boolean
  tree: ResumeTree
  ledger: Ledger
  delta: number
  reason?: GuardVerdict
}

// Acá vivía una `resolution` que nadie leía, y además mentía: armaba su id con
// el tipo quemado en "no_result", así que para un `no_metric` o un requisito —que
// lleva sujeto en su clave— habría anotado un hallazgo distinto del que se
// cerró. La resolución buena la arma el cliente con los ids que el motor ya le
// entregó, que son los únicos que `loyalty` puede emparejar.

/**
 * Aplica una sugerencia y devuelve cuánto sumó DE VERDAD.
 *
 * El orden importa y es el del documento v3: copia → recálculo → delta → recién
 * ahí el árbol real y el ledger. Si algo falla en el medio, el CV del usuario
 * nunca se tocó.
 */
export function applySuggestion(
  tree: ResumeTree,
  s: AnchoredSuggestion,
  spec: JobSpec,
  audit: AuditFacts,
  checks: ParseChecks,
  ledger: Ledger,
  /**
   * LOS MISMOS PESOS CON LOS QUE SE PINTA EL DIAL.
   *
   * ── LO QUE ESTO NO ARREGLA, MEDIDO ─────────────────────────────────────────
   * Hoy no cambia ni un decimal, y conviene que quede escrito para que nadie lo
   * "verifique" con una sonda que mide otra cosa. La auditoría es la MISMA antes
   * y después —esta función sólo reescribe un texto— y los pesos entran
   * únicamente en `must`/`nice`, que salen de `audit.coverage`. Lo que sí cambia
   * al reescribir —`metric`, `verbs`— se pondera con `COMPONENT_WEIGHT`, que es
   * fijo. Medido sobre un aviso que repite SAP tres veces: delta 6,5625 con
   * pesos y 6,5625 sin ellos.
   *
   * Se pasan igual, y por una sola razón: el número que esta función promete y
   * el que la pantalla pinta después tienen que salir de los MISMOS insumos, no
   * coincidir de casualidad. Hoy coinciden porque ningún componente que dependa
   * del árbol usa los pesos; el día que uno lo haga, esto ya está bien y nadie
   * tiene que acordarse.
   */
  termWeights: Record<string, number> = {},
): ApplyResult {
  if (isStale(s.basedOnHash, s.bulletId, tree)) {
    return { ok: false, tree, ledger, delta: 0, reason: { ok: false, reason: "stale", detail: s.bulletId } }
  }

  const before = scoreResume(tree, spec, audit, checks, termWeights)
  // Sobre la COPIA, como todo acá: si algo falla, el CV del usuario no se tocó.
  const copy = writeInto(tree, s.bulletId, s.text)
  const after = scoreResume(copy, spec, audit, checks, termWeights)

  return {
    ok: true,
    tree: copy,
    ledger: afterAccept(ledger, s),
    delta: deltaOf(before, after),
  }
}

export { openLedger } from "@/lib/ats3/ledger"
