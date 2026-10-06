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

import { buildTermIndex, findingId, nodeHash, normalize, sha256, termsIn, type AnchoredSuggestion, type Finding, type JobSpec, type Resolution, type ResumeTree } from "@/lib/ats3/contracts"
import { isStale, loyalty, type GuardVerdict } from "@/lib/ats3/guards"
import { cvTextOf, deltaOf, gainOf, scoreResume, statesQuantity, termsOf, titleForms, type AuditFacts, type ParseChecks, type Score } from "@/lib/ats3/score"
import { type RawResume, buildTree, readableChecks, writeInto } from "@/lib/ats3/cv"
import { findingsOf, respaldadoEnCv } from "@/lib/ats3/findings"
import { type AtsAi, type AtsStore, cacheKey } from "@/lib/ats3/ports"
// Viven con quien mide; se re-exportan porque el motor es la puerta de siempre.
export { cvTextOf, termsOf } from "@/lib/ats3/score"
// Cada módulo del motor, por la misma puerta: quien ya importa de acá no cambia.
export { cacheKey } from "@/lib/ats3/ports"
export type { AtsAi, AtsStore, CacheKind, RewriteInput, SummaryInput } from "@/lib/ats3/ports"
export { buildTree, readBullets, readableChecks, writeBack, writeInto } from "@/lib/ats3/cv"
export type { RawResume } from "@/lib/ats3/cv"
export { findingsOf, skillPlan } from "@/lib/ats3/findings"
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
  | { act: "score"; score: Score; tree: ResumeTree; audit: AuditFacts; checks: ParseChecks }
  | { act: "job"; spec: JobSpec }
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
  /**
   * LA VACANTE SALE APENAS SE LEE (2026-09-30). La ruta abre el stream con el
   * primer acto, y el navegador espera la respuesta 120 s como mucho: cuando el
   * primer acto era el puntaje, esa espera cubría la vacante Y la auditoría, y
   * un aviso largo la pasaba (medido en producción, Sezzle, dos veces). Con la
   * vacante primero, lo que tarde la auditoría corre con el stream ya abierto.
   */
  yield { act: "job", spec }

  /**
   * LO QUE TAILOR YA ESCRIBIÓ SIGUIENDO AL ATS, Y SIGUE EN EL CV (CEO, 2026-09-29).
   *
   * Una línea reescrita cambia de id —el id sale del texto—, así que el
   * registro por id no la reconoce. Viaja al ATS por su texto: lo que él mismo
   * mandó escribir cuenta como prueba de esa skill, y el panel no vuelve a pedirlo.
   */
  const log = ((await input.store.read("ats3-log", cacheKey.log(input.resumeId, jdKey))) as Resolution[] | null) ?? []
  const lineas = new Set(tree.roles.flatMap((r) => r.bullets.map((b) => b.text.trim())))
  const arregladas = [...new Set(log.filter((r) => r.kind === "applied" && r.after && lineas.has(r.after.trim())).map((r) => r.after!.trim()))]

  // ── acto 3: el diagnóstico ────────────────────────────────────────────────
  const auditKey = cacheKey.audit(sha256(treeHash(tree), ...arregladas), jdKey, input.model)
  let audit = (await input.store.read("ats3-audit", auditKey)) as AuditFacts | null
  if (audit) {
    telemetry.served.audit = true
  } else {
    audit = await input.ai.audit(tree, spec)
    telemetry.calls++
    /**
     * CADA REQUISITO DE LA VACANTE TIENE SU JUICIO (2026-10-05). Medido contra la
     * API con Sezzle: P2 contestó las obligatorias y se salteó TODAS las
     * deseables. El puntaje las contaba como faltantes y ninguna tenía tarjeta:
     * puntos perdidos sin decir por qué. Lo que faltó se pide UNA vez más, sólo
     * eso, dentro de la misma petición.
     */
    const faltan = sinJuicio(spec, audit)
    if (faltan.mustHave.length + faltan.niceToHave.length + faltan.softSignals.length > 0) {
      const resto = await input.ai.audit(tree, { ...spec, ...faltan, conditions: [] })
      telemetry.calls++
      const ya = new Set(audit.hard.map((h) => normalize(h.skill)))
      const yaBlandas = new Set(audit.soft.map((x) => normalize(x.signal)))
      audit = {
        ...audit,
        hard: [...audit.hard, ...resto.hard.filter((h) => !ya.has(normalize(h.skill)))],
        soft: [...audit.soft, ...resto.soft.filter((x) => !yaBlandas.has(normalize(x.signal)))],
      }
    }
    await input.store.write("ats3-audit", auditKey, audit)
  }
  audit = await fijarJuicios(tree, audit, input.store, cacheKey.judge(input.resumeId, jdKey))

  // Una skill «demostrada» o «listada» cuyo nombre el CV no respalda no está en el CV: falta.
  /**
   * SALVO UNA CREDENCIAL, QUE SE ESCRIBE DISTINTO EN CADA PAÍS (2026-09-30). Medido
   * en producción: «Bachelor's degree» quedaba como faltante con «Systems engineer —
   * Catolica University» en la educación, porque esta comprobación exige las
   * palabras del aviso. Un título es lo que es, no cómo se llama: eso lo juzga el
   * ATS. El código sólo puede probar que no hay nada que juzgar —un CV sin
   * educación, certificaciones ni idiomas—.
   */
  const credenciales = new Set([...spec.mustHave, ...spec.niceToHave].filter((r) => r.kind === "credential").map((r) => normalize(r.skill)))
  const sinDondeTenerla = !tree.otherText.trim()
  /**
   * Y SALVO LO QUE EL ATS CITA CON LAS PALABRAS DEL CV (2026-10-02). Medido contra
   * la API con el aviso de Tekton: P2 daba «Mobile» por demostrado en la viñeta de
   * «aplicaciones móviles» (4 de 4) y esta comprobación lo bajaba a faltante,
   * porque exige la palabra del aviso. Que dos formas o dos idiomas digan lo mismo
   * es semántica y lo decide el ATS; el código sólo comprueba lo que puede: que
   * las palabras citadas estén de verdad donde dice —la línea de la prueba o, si
   * sólo está nombrada, el CV—.
   */
  const textoCv = normalize(cvTextOf(tree))
  const lineaDe = new Map([tree.summary, ...tree.roles.flatMap((r) => r.bullets)].map((b) => [b.id, normalize(b.text)] as const))
  const citado = (h: AuditFacts["hard"][number]) => {
    const c = normalize(h.cvWording ?? "")
    if (c.length < 3) return false
    const donde = h.status === "demonstrated" && h.evidenceNodeId ? lineaDe.get(h.evidenceNodeId) ?? "" : textoCv
    return ` ${donde} `.includes(` ${c} `)
  }
  /**
   * «SÓLO EN LA LISTA» ES EL NOMBRE ENTERO, NO SUS PALABRAS SUELTAS (2026-10-02).
   * Visto en local: «Clean Code — sólo en la lista» con «Clean Architecture» en
   * Habilidades y «código» en una viñeta: cada palabra estaba en algún lado, el
   * requisito en ninguno. «Listada» afirma que el nombre está escrito, y eso se
   * prueba con la frase —o una alternativa— o con la cita del ATS. «Demostrada»
   * apunta a una viñeta y sigue con la vara de raíces: ahí lo semántico lo juzga
   * el ATS («Atendí a los clientes» demuestra «atención al cliente»).
   */
  const dicho = (nombre: string) => {
    const opciones = nombre.split(/\s*\|\s*/).filter(Boolean)
    const indice = buildTermIndex(opciones.map((o) => ({ canonical: o, variants: titleForms(o) })))
    return termsIn(indice, cvTextOf(tree)).size > 0
  }
  /**
   * Y SI TAMPOCO VOLVIÓ, DECIDE EL CÓDIGO CON LO QUE PUEDE PROBAR: el nombre está
   * escrito en el CV (nombrado; si una viñeta lo escribe, más abajo pasa a
   * demostrado) o no está (falta, con su tarjeta). Las duras; una blanda, no. Así el puntaje y las tarjetas
   * recorren la MISMA lista —la de la vacante— y no pueden discrepar.
   */
  {
    const faltan = sinJuicio(spec, audit)
    const estado = (nombre: string) => (dicho(nombre) ? ("listed" as const) : ("missing" as const))
    audit = {
      ...audit,
      hard: [
        ...audit.hard,
        ...faltan.mustHave.map((r) => ({ skill: r.skill, requirement: "MUST" as const, status: estado(r.skill), evidenceNodeId: null, writeIn: null, question: null })),
        ...faltan.niceToHave.map((r) => ({ skill: r.skill, requirement: "NICE" as const, status: estado(r.skill), evidenceNodeId: null, writeIn: null, question: null })),
      ],
      // Una blanda no se prueba por la palabra («trust» está en «user trust»): sin juicio, falta.
      soft: [...audit.soft, ...faltan.softSignals.map((x) => ({ signal: x, status: "missing" as const, evidenceNodeId: null, writeIn: null }))],
    }
  }
  audit = {
    ...audit,
    hard: audit.hard.map((h) =>
      h.status !== "missing" && !citado(h) && !(h.status === "listed" ? dicho(h.skill) : respaldadoEnCv(tree, h.skill)) && (sinDondeTenerla || !credenciales.has(normalize(h.skill)))
        ? { ...h, status: "missing" as const, evidenceNodeId: null }
        : // Y AL REVÉS (2026-10-05): «falta» con el nombre escrito en el CV es falso.
          // Medido con Sezzle: «CI/CD — falta» con CI/CD en Habilidades. Queda
          // nombrada; si una viñeta lo escribe, más abajo pasa a demostrada.
          h.status === "missing" && dicho(h.skill)
          ? { ...h, status: "listed" as const, evidenceNodeId: null }
          : h,
    ),
  }
  /**
   * LO QUE TAILOR ESCRIBIÓ QUEDA PROBADO (CEO, 2026-09-30): si una línea que la
   * persona confirmó nombra la skill, esa línea es su prueba. Sin esto el modelo
   * podía volver a leerla «sólo en la lista» y abrir otra tarjeta para escribirla
   * de nuevo.
   */
  /**
   * Y UNA SKILL DURA QUE UNA VIÑETA ESCRIBE CON SU NOMBRE ESTÁ EN LA EXPERIENCIA
   * (2026-10-02). Medido en producción: «TypeScript — tu CV sólo lo nombra en la
   * lista» con la viñeta «Created web applications with Angular and TypeScript»
   * en el mismo CV. Que el nombre está escrito en una línea lo prueba el código;
   * las blandas no, porque nombrar «comunicación» no la demuestra.
   */
  {
    const viñetas = tree.roles.flatMap((r) => r.bullets)
    const deTailor = viñetas.filter((b) => arregladas.includes(b.text.trim()))
    const prueba = <T extends { status: string; evidenceNodeId: string | null }>(x: T, nombre: string, lineas: typeof viñetas): T => {
      if (x.status === "demonstrated") return x
      const indice = buildTermIndex([{ canonical: nombre, variants: titleForms(nombre) }])
      const linea = lineas.find((b) => termsIn(indice, b.text).size > 0)
      return linea ? { ...x, status: "demonstrated", evidenceNodeId: linea.id } : x
    }
    audit = {
      ...audit,
      hard: audit.hard.map((h) => prueba(h, h.skill, credenciales.has(normalize(h.skill)) ? deTailor : viñetas)),
      soft: audit.soft.map((x) => prueba(x, x.signal, deTailor)),
    }
  }

  // ── acto 1: el puntaje, que no cuesta una sola llamada ────────────────────
  // La lectura del documento la mide el motor: es el único que tiene el CV entero.
  const checks = readableChecks(tree)
  const score = scoreResume(tree, spec, audit, checks)
  yield { act: "score", score, tree, audit, checks }

  // ── las tarjetas: la decisión del ATS, una por viñeta ─────────────────────
  // Una línea que Tailor ya escribió no recibe otra skill: se cerró con lo que el ATS pidió.
  const cerradas = tree.roles.flatMap((r) => r.bullets).filter((b) => arregladas.includes(b.text.trim())).map((b) => b.id)
  const all = findingsOf(tree, audit, score, spec, cerradas)
  for (const [nombre, ok] of Object.entries(checks)) {
    // Un chequeo que falla y no genera tarjeta es un punto perdido que nadie
    // le dijo al usuario cómo recuperar. Se arregla en el documento: sin IA.
    if (ok === false) {
      all.push({
        // El matiz es el chequeo: sin él los siete comparten id.
        id: findingId(tree.summary.id, "parse_risk", nombre),
        type: "parse_risk",
        component: "checks",
        remedy: "none",
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
 * UNA LÍNEA QUE NO CAMBIÓ CONSERVA SU JUICIO ENTRE ANÁLISIS (2026-10-02).
 *
 * Medido en producción con el CV de Hapi: el reanálisis —que vuelve a preguntar
 * todo— bajó el número con las mismas líneas, porque el modelo cambió de opinión
 * sobre lo que nadie tocó. Se fija por TEXTO, para este CV y esta vacante: la
 * skill que una línea demostraba mientras esa línea siga ahí. Lo fijado sigue
 * pasando por los controles del código que corren después.
 */
type Juicios = { skills: Record<string, { status: "demonstrated" | "listed" | "missing"; evidencia: string | null }> }

async function fijarJuicios(tree: ResumeTree, audit: AuditFacts, store: AtsStore, key: string): Promise<AuditFacts> {
  const previos = ((await store.read("ats3-judge", key)) as Juicios | null) ?? { skills: {} }
  const textoDe = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, normalize(b.text)] as const)))
  const idDe = new Map([...textoDe].map(([id, t]) => [t, id] as const))
  const rango = { missing: 0, listed: 1, demonstrated: 2 } as const
  const fijar = <T extends { status: "demonstrated" | "listed" | "missing"; evidenceNodeId: string | null }>(x: T, nombre: string): T => {
    const p = previos.skills?.[normalize(nombre)]
    if (!p || rango[p.status] <= rango[x.status]) return x
    // Demostrada en una línea que ya no está: no hay prueba que conservar.
    if (p.status === "demonstrated") return p.evidencia && idDe.has(p.evidencia) ? { ...x, status: "demonstrated", evidenceNodeId: idDe.get(p.evidencia)! } : x
    return { ...x, status: p.status, evidenceNodeId: null }
  }
  const fijada: AuditFacts = {
    ...audit,
    hard: audit.hard.map((h) => fijar(h, h.skill)),
    soft: audit.soft.map((x) => fijar(x, x.signal)),
  }
  const ahora: Juicios = { skills: { ...previos.skills } }
  for (const x of [...fijada.hard.map((h) => ({ n: h.skill, s: h })), ...fijada.soft.map((y) => ({ n: y.signal, s: y }))]) {
    ahora.skills[normalize(x.n)] = { status: x.s.status, evidencia: x.s.evidenceNodeId ? textoDe.get(x.s.evidenceNodeId) ?? null : null }
  }
  await store.write("ats3-judge", key, ahora)
  return fijada
}

/** Lo que la vacante pide y la auditoría no juzgó: requisitos y blandas sin respuesta. */
function sinJuicio(spec: JobSpec, audit: AuditFacts): Pick<JobSpec, "mustHave" | "niceToHave" | "softSignals"> {
  const duras = new Set(audit.hard.map((h) => `${h.requirement}:${normalize(h.skill)}`))
  const blandas = new Set(audit.soft.map((x) => normalize(x.signal)))
  return {
    mustHave: (spec.mustHave ?? []).filter((r) => !duras.has(`MUST:${normalize(r.skill)}`)),
    niceToHave: (spec.niceToHave ?? []).filter((r) => !duras.has(`NICE:${normalize(r.skill)}`)),
    softSignals: (spec.softSignals ?? []).filter((x) => normalize(x) && !blandas.has(normalize(x))),
  }
}

/**
 * LA VIÑETA QUE MENOS APORTA A ESTA VACANTE en un puesto, con la misma vara que
 * el rango: nunca la que prueba una skill del aviso, después la que menos
 * requisitos nombra y sin cifra. Es la que se reemplaza cuando el puesto está lleno.
 */
export function menosAporta(tree: ResumeTree, spec: JobSpec, audit: AuditFacts, roleId: string): string | null {
  const role = tree.roles.find((r) => r.id === roleId)
  if (!role || role.bullets.length === 0) return null
  const pruebas = new Set([...audit.hard, ...audit.soft].flatMap((x) => (x.status === "demonstrated" && x.evidenceNodeId ? [x.evidenceNodeId] : [])))
  const indice = buildTermIndex(termsOf(spec, tree))
  const peso = (b: { id: string; text: string }) => (pruebas.has(b.id) ? 100 : 0) + termsIn(indice, b.text).size * 2 + (statesQuantity(b.text) ? 1 : 0)
  // Empate: la de más abajo, que es la que menos se lee.
  return [...role.bullets].map((b, i) => ({ b, i })).sort((x, y) => peso(x.b) - peso(y.b) || y.i - x.i)[0].b.id
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
    // Idiomas, certificaciones, educación: el ATS también los lee.
    "other",
    tree.otherText,
  ).slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// APLICAR: sobre una copia, y recién después sobre el CV
// ─────────────────────────────────────────────────────────────────────────────

export interface ApplyResult {
  ok: boolean
  tree: ResumeTree
  delta: number
  reason?: GuardVerdict
}

/**
 * Aplica una sugerencia y devuelve cuánto sumó DE VERDAD: copia → recálculo →
 * delta → recién ahí el árbol real. Si algo falla en el medio, el CV del
 * usuario nunca se tocó.
 */
export function applySuggestion(tree: ResumeTree, s: AnchoredSuggestion, spec: JobSpec, audit: AuditFacts, checks: ParseChecks): ApplyResult {
  if (isStale(s.basedOnHash, s.bulletId, tree)) {
    return { ok: false, tree, delta: 0, reason: { ok: false, reason: "stale", detail: s.bulletId } }
  }
  const before = scoreResume(tree, spec, audit, checks)
  const copy = writeInto(tree, s.bulletId, s.text)
  const after = scoreResume(copy, spec, audit, checks)
  return { ok: true, tree: copy, delta: deltaOf(before, after) }
}
