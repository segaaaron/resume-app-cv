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
import { droppedNames, isStale, loyalty, type GuardVerdict } from "@/lib/ats3/guards"
import { cvTextOf, deltaOf, gainOf, scoreResume, statesQuantity, termsOf, titleForms, type AuditFacts, type ParseChecks, type Score } from "@/lib/ats3/score"
import { type RawResume, buildTree, readableChecks, writeInto } from "@/lib/ats3/cv"
import { findingsOf, hayTrabajo, respaldadoEnCv, trabajoPorViñeta } from "@/lib/ats3/findings"
import { BULLETS_PER_ROLE_MAX, BULLETS_PER_ROLE_MIN } from "@/lib/ats3/ledger"
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
   * mandó hacer queda en «mantener», y el panel no vuelve a pedirlo.
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
    const [primera, herramientas] = await Promise.all([
      input.ai.audit(tree, spec, arregladas),
      // Si falla, el diagnóstico sigue: las herramientas son un plus, no la base.
      input.ai.matchTools(tree).catch(() => [] as { id: string; tools: string[]; sinTamano?: boolean; sinLogro?: boolean }[]),
    ])
    audit = primera
    telemetry.calls += 2
    /**
     * CADA VIÑETA TIENE SU DECISIÓN. Lo que faltó se pide UNA vez más, sólo esas
     * líneas, dentro de la misma petición: la cuota no cambia. Lo que tampoco
     * vuelva queda sin decisión y no se cuenta.
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
      const segunda = await input.ai.audit(resto, spec, arregladas)
      telemetry.calls++
      audit = { ...audit, bullets: [...audit.bullets, ...segunda.bullets.filter((b) => faltan.has(b.id))] }
    }
    /**
     * LOS TOPES DE VIÑETAS POR PUESTO: el prompt los pide y el código los valida
     * (CEO, 2026-09-29). Medido contra la API: dejó 11 en un puesto con tope 6 y
     * vació otro entero. Se le pide UNA vez más nombrando el puesto; el código no
     * elige qué viñeta va o se queda.
     */
    const fuera = rangoDeViñetas(tree, audit)
    if (fuera.length > 0) {
      const otra = await input.ai.audit(tree, spec, arregladas, fuera.join("\n"))
      telemetry.calls++
      if (rangoDeViñetas(tree, otra).length < fuera.length && otra.bullets.length >= audit.bullets.length) audit = otra
    }
    // Las herramientas que cada trabajo usó viajan como hechos de esa viñeta.
    // Un requisito del aviso no es una herramienta que agregar: ése lo cubren las skills.
    const delAviso = new Set([...spec.mustHave, ...spec.niceToHave].flatMap((r) => r.skill.split(/\s*\|\s*/)).map(normalize))
    const deViñeta = new Map(
      herramientas.map((h) => [h.id, h.tools.filter((t) => !delAviso.has(normalize(t)))] as const).filter(([, t]) => t.length > 0),
    )
    // Y las que afirman un resultado sin decir cuánto piden la cifra de la persona.
    const sinTamano = new Set(herramientas.filter((h) => h.sinTamano).map((h) => h.id))
    // Y las que dicen qué se hizo sin qué se logró: X-Y-Z, el logro con el hueco de su cifra.
    const sinLogro = new Set(herramientas.filter((h) => h.sinLogro).map((h) => h.id))
    audit = {
      ...audit,
      bullets: audit.bullets.map((b) =>
        b.decision === "remove" ? b : { ...b, ...(deViñeta.has(b.id) ? { facts: deViñeta.get(b.id) } : {}), ...(sinTamano.has(b.id) || sinLogro.has(b.id) ? { needsFigure: true } : {}), ...(sinLogro.has(b.id) ? { needsOutcome: true } : {}) },
      ),
    }
    await input.store.write("ats3-audit", auditKey, audit)
  }
  audit = await fijarJuicios(tree, audit, input.store, cacheKey.judge(input.resumeId, jdKey))

  /**
   * LO QUE TAILOR YA ARREGLÓ SIGUIENDO AL ATS QUEDA EN «MANTENER». El ATS lo
   * recibe dicho, y el código lo garantiza: volver a pedir mejorar la línea que
   * él mismo mandó escribir es el bucle que este motor existe para no tener.
   */
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
  audit = {
    ...audit,
    hard: audit.hard.map((h) =>
      h.status !== "missing" && !citado(h) && !(h.status === "listed" ? dicho(h.skill) : respaldadoEnCv(tree, h.skill)) && (sinDondeTenerla || !credenciales.has(normalize(h.skill)))
        ? { ...h, status: "missing" as const, evidenceNodeId: null }
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
  /**
   * LA DECISIÓN QUE SE VE ES LA QUE SE PUEDE HACER: «mejorar» si hay algo
   * verificable que agregar, «sirve» si no. Si no, la anatomía decía «18 hay que
   * mejorarlas» y Tailor no tenía ni una tarjeta para ellas (visto en local).
   */
  /**
   * SACAR «POR REPETIDA» SE COMPRUEBA (CEO, 2026-09-29). Medido con el CV real: el
   * ATS sacó «Refactored the lunch box module…» citándose a sí misma, y «Resolved
   * critical bugs… 20%» para dejar «Improved app stability…» sin ningún número.
   * Una línea que cita a otra como la que queda sólo se saca si la citada existe,
   * es otra, y no deja atrás una cifra que la citada no tiene.
   */
  {
    // Si el ATS dijo «son repetidas» pero sacaba la que tiene cifra, se queda ésa y
    // se va la citada: el juicio de repetición es suyo, cuál es más fuerte se prueba.
    const todas = tree.roles.flatMap((r) => r.bullets)
    const sacar = new Map<string, string>()
    const quedan = new Set<string>()
    for (const b of audit.bullets) {
      if (b.decision !== "remove") continue
      const v = sacarSeSostiene(tree, b.id, b.reason)
      if (v === true) continue
      quedan.add(b.id)
      if (typeof v === "string" && !quedan.has(v)) {
        const esta = todas.find((x) => x.id === b.id)?.text ?? ""
        const inicio = esta.split(/\s+/).slice(0, 6).join(" ")
        sacar.set(v, input.language === "en" ? `Says the same as "${inicio}…", which carries the figure.` : `Dice lo mismo que «${inicio}…», que trae la cifra.`)
      }
    }
    audit = {
      ...audit,
      bullets: audit.bullets.map((b) =>
        quedan.has(b.id) ? { ...b, decision: "keep" as const, reason: seQueda(input.language) } : sacar.has(b.id) ? { ...b, decision: "remove" as const, reason: sacar.get(b.id)! } : b,
      ),
    }
  }
  /**
   * UNA LÍNEA QUE TAILOR YA CERRÓ NO RECIBE MÁS ENCARGOS. Ni cifra, ni herramienta,
   * ni una skill para escribir ahí: medido el 2026-09-29, el reanálisis mandaba
   * escribir «mobile application lifecycle» en la línea que Tailor acababa de
   * escribir. La skill que falta se le pregunta a la persona.
   */
  const yaArregladas = new Set(arregladas)
  const textoDe = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, b.text.trim()] as const)))
  const cerradas = new Set(audit.bullets.filter((b) => yaArregladas.has(textoDe.get(b.id) ?? "")).map((b) => b.id))
  audit = {
    ...audit,
    bullets: audit.bullets.map((b) => (cerradas.has(b.id) ? { ...b, decision: "keep" as const, instruction: null, needsFigure: false, needsOutcome: false, facts: [], cerrada: true } : b)),
  }
  /**
   * EL RANGO DE VIÑETAS POR PUESTO LO GARANTIZA EL CÓDIGO (CEO, 2026-09-29): el
   * prompt lo pide y el modelo igual vaciaba puestos (Salamanca quedó con 0 de 9).
   * Si un puesto queda por debajo del mínimo, vuelven las que traen cifra y
   * después las primeras del CV; si queda por encima del máximo, se van las
   * últimas sin cifra. Es la regla de `ledger.ts`, en un solo lugar.
   */
  /**
   * LO QUE EL ATS YA DECIDIÓ CONSERVAR NO SE VUELVE A DISCUTIR (CEO, 2026-09-29).
   * Medido en local: después de aplicar lo que el ATS sacó, el reanálisis del CV
   * ya recortado quería sacar 6 viñetas más que la pasada anterior había
   * conservado. Cada vuelta recortaba otra vez. Una viñeta conservada cuyo texto
   * no cambió se sigue conservando para este CV y esta vacante; se juzga de nuevo
   * sólo lo que cambió.
   */
  const lockKey = cacheKey.lock(input.resumeId, jdKey)
  const conservadas = new Set(((await input.store.read("ats3-lock", lockKey)) as string[] | null) ?? [])
  const textoNorm = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, normalize(b.text)] as const)))
  audit = {
    ...audit,
    bullets: audit.bullets.map((b) => (b.decision === "remove" && conservadas.has(textoNorm.get(b.id) ?? "") ? { ...b, decision: "keep" as const, reason: seQueda(input.language) } : b)),
  }
  /**
   * NO SE SACA LA PRUEBA DE LO QUE PIDE LA VACANTE (CEO, 2026-09-30): «me pediste
   * sacar viñetas y el score bajó». La línea que demuestra una skill del aviso vale
   * en el puntaje (demostrada 1, nombrada 0,6): sacarla nunca es «no aporta».
   */
  const pruebas = new Set([...audit.hard, ...audit.soft].flatMap((x) => (x.status === "demonstrated" && x.evidenceNodeId ? [x.evidenceNodeId] : [])))
  audit = { ...audit, bullets: audit.bullets.map((b) => (b.decision === "remove" && pruebas.has(b.id) ? { ...b, decision: "keep" as const, reason: seQueda(input.language, true) } : b)) }
  audit = { ...audit, bullets: ajustarAlRango(tree, spec, audit.bullets, pruebas, input.language) }
  const quedan = audit.bullets.filter((b) => b.decision !== "remove").map((b) => textoNorm.get(b.id) ?? "").filter(Boolean)
  await input.store.write("ats3-lock", lockKey, [...new Set([...conservadas, ...quedan])])
  const trabajo = trabajoPorViñeta(tree, audit)
  audit = {
    ...audit,
    bullets: audit.bullets.map((b) =>
      b.decision === "remove" ? b : hayTrabajo(trabajo.get(b.id)) ? { ...b, decision: "improve" as const } : { ...b, decision: "keep" as const, instruction: null },
    ),
  }

  // ── acto 1: el puntaje, que no cuesta una sola llamada ────────────────────
  // La lectura del documento la mide el motor: es el único que tiene el CV entero.
  const checks = readableChecks(tree)
  const score = scoreResume(tree, spec, audit, checks)
  yield { act: "score", score, tree, audit, checks }

  // ── las tarjetas: la decisión del ATS, una por viñeta ─────────────────────
  const all = findingsOf(tree, audit, score, spec)
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
 * EL MOTIVO DE UNA VIÑETA QUE EL CÓDIGO CONSERVA (2026-10-02). El modelo la mandaba
 * sacar —«dice casi lo mismo que…»— y el código lo descartó; la línea quedaba
 * en «Sirve» con ese motivo debajo. Visto en local: cuatro viñetas así en la misma
 * pantalla. Lo que se ve es lo que se decidió.
 */
function seQueda(language: "es" | "en", prueba = false): string {
  if (prueba) return language === "en" ? "Stays: it proves a skill the posting asks for." : "Se queda: prueba una skill que pide el aviso."
  return language === "en" ? "Stays: it shows experience and does not repeat another line." : "Se queda: muestra experiencia y no repite a otra línea."
}

/**
 * UNA LÍNEA QUE NO CAMBIÓ CONSERVA SU JUICIO ENTRE ANÁLISIS (2026-10-02).
 *
 * El comentario de P2 lo prometía desde p2-8 y la función se había perdido con la
 * reescritura del motor. Medido en producción con el CV de Hapi: el editor marcaba
 * 75 después de aplicar, y el reanálisis —que vuelve a preguntar todo— dio 66 con
 * las mismas líneas: blandas 65 → 40%, impacto 70 → 55%. El modelo cambió de
 * opinión sobre lo que nadie tocó, y el número bajó sin una razón en el CV.
 *
 * Se fija por TEXTO, para este CV y esta vacante: la decisión de cada viñeta que
 * sigue igual, y la skill que una línea demostraba mientras esa línea siga ahí.
 * Lo que cambió se juzga de nuevo; lo que se fijó sigue pasando por los controles
 * del código que corren después (respaldo en el CV, credenciales, rango).
 */
type Juicio = Omit<AuditFacts["bullets"][number], "id">
type Juicios = { bullets: Record<string, Juicio>; skills: Record<string, { status: "demonstrated" | "listed" | "missing"; evidencia: string | null }> }

async function fijarJuicios(tree: ResumeTree, audit: AuditFacts, store: AtsStore, key: string): Promise<AuditFacts> {
  const previos = ((await store.read("ats3-judge", key)) as Juicios | null) ?? { bullets: {}, skills: {} }
  const textoDe = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, normalize(b.text)] as const)))
  const idDe = new Map([...textoDe].map(([id, t]) => [t, id] as const))
  const rango = { missing: 0, listed: 1, demonstrated: 2 } as const
  const fijar = <T extends { status: "demonstrated" | "listed" | "missing"; evidenceNodeId: string | null }>(x: T, nombre: string): T => {
    const p = previos.skills[normalize(nombre)]
    if (!p || rango[p.status] <= rango[x.status]) return x
    // Demostrada en una línea que ya no está: no hay prueba que conservar.
    if (p.status === "demonstrated") return p.evidencia && idDe.has(p.evidencia) ? { ...x, status: "demonstrated", evidenceNodeId: idDe.get(p.evidencia)! } : x
    return { ...x, status: p.status, evidenceNodeId: null }
  }
  const fijada: AuditFacts = {
    ...audit,
    bullets: audit.bullets.map((b) => {
      const p = previos.bullets[textoDe.get(b.id) ?? ""]
      return p ? { ...p, id: b.id } : b
    }),
    hard: audit.hard.map((h) => fijar(h, h.skill)),
    soft: audit.soft.map((x) => fijar(x, x.signal)),
  }
  const ahora: Juicios = { bullets: { ...previos.bullets }, skills: { ...previos.skills } }
  for (const b of fijada.bullets) {
    const t = textoDe.get(b.id)
    if (!t) continue
    ahora.bullets[t] = b
  }
  for (const x of [...fijada.hard.map((h) => ({ n: h.skill, s: h })), ...fijada.soft.map((y) => ({ n: y.signal, s: y }))]) {
    ahora.skills[normalize(x.n)] = { status: x.s.status, evidencia: x.s.evidenceNodeId ? textoDe.get(x.s.evidenceNodeId) ?? null : null }
  }
  // Con tope: las líneas viejas se guardan para que un «Deshacer» recupere su juicio, no para siempre.
  const textos = Object.keys(ahora.bullets)
  for (const t of textos.slice(0, Math.max(0, textos.length - 300))) delete ahora.bullets[t]
  await store.write("ats3-judge", key, ahora)
  return fijada
}

/**
 * ¿Se sostiene sacar esta viñeta? Si el motivo cita otra línea del CV («…» o "…"),
 * la citada tiene que existir, ser otra, y tener cifra si la que se va la tiene.
 * Si no cita ninguna (otra tecnología, otra tarea), decide el ATS.
 */
function sacarSeSostiene(tree: ResumeTree, id: string, reason: string): true | false | string {
  const todas = tree.roles.flatMap((r) => r.bullets)
  const esta = todas.find((b) => b.id === id)
  if (!esta) return true
  const citas = [...reason.matchAll(/[«"“]([^»"”]{12,})[»"”]/g)].map((m) => normalize(m[1].replace(/…$/, "")).slice(0, 40))
  if (citas.length === 0) return true
  const citadas = todas.filter((b) => b.id !== id && citas.some((c) => c.length >= 12 && normalize(b.text).startsWith(c)))
  // Se cita a sí misma, o cita algo que no está: no se saca.
  if (citadas.length === 0) return false
  /**
   * REPETIR ES DECIR LO MISMO, Y LO QUE QUEDA TIENE QUE DECIRLO (2026-09-30).
   * Medido en producción: el ATS mandó sacar «Implemented TCA architecture…»
   * por repetir a «Applied SOLID design principles…», y «Used AI-assisted
   * engineering tools (Claude Code, Codex, Copilot)…» por parecerse a una de
   * unit tests. Las dos se parecen en las palabras de siempre; ninguna repite:
   * sacarlas borraba TCA y Claude Code del CV. Una línea que nombra algo que la
   * citada no nombra no la repite.
   */
  if (droppedNames(esta.text, citadas.map((b) => b.text).join(" ")).length > 0) return false
  /**
   * Y TIENE QUE DECIR, EN SUS PALABRAS, LO QUE DICE LA QUE SE VA. Medido contra la
   * API con el aviso de Sezzle: «Collaborated in code reviews…» salía por
   * «repetir» a «Conducted unit and UI testing…» (comparten 10% de su contenido),
   * «networking layers» por «RESTful APIs» (0%), «user-friendly interfaces» por
   * «cross-platform apps» (30%). Las repetidas de verdad comparten 45–80%.
   *
   * ponytail: raíces de cinco letras, no significado; el piso de 40% sale de esos
   * ocho pares medidos. Si una repetida real queda debajo, la línea se conserva:
   * el error barato, porque mostrar experiencia vale más que una viñeta menos.
   */
  if (cubre(esta.text, citadas.map((b) => b.text).join(" ")) < 0.4) return false
  // Sacaba la que tiene cifra para dejar una sin cifra: se queda ésta y se va la citada.
  if (statesQuantity(esta.text) && citadas.every((b) => !statesQuantity(b.text))) return citadas[0].id
  return true
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

function ajustarAlRango(tree: ResumeTree, spec: JobSpec, bullets: AuditFacts["bullets"], pruebas: ReadonlySet<string> = new Set(), language: "es" | "en" = "es"): AuditFacts["bullets"] {
  const decision = new Map(bullets.map((b) => [b.id, b]))
  /**
   * CUÁL VUELVE O CUÁL SE VA: primero lo que prueba el puesto —cuántos requisitos
   * del aviso nombra, con el mismo índice que usa el puntaje—, después la cifra,
   * después el orden del CV. Sin la relevancia, Salamanca recuperaba Angular y
   * Flutter antes que sus líneas de iOS con cifra (medido 2026-09-29).
   */
  const indice = buildTermIndex(termsOf(spec, tree))
  // La prueba de una skill del aviso va primero: sacarla baja el puntaje.
  const peso = (b: { id: string; text: string }) => (pruebas.has(b.id) ? 100 : 0) + termsIn(indice, b.text).size * 2 + (statesQuantity(b.text) ? 1 : 0)
  const porPeso = <T extends { id: string; text: string }>(xs: T[]): T[] => xs.map((b, i) => ({ b, i })).sort((x, y) => peso(y.b) - peso(x.b) || x.i - y.i).map((x) => x.b)
  const cambios = new Map<string, "keep" | "remove">()
  const porExceso = new Map<string, string>()
  const todas = tree.roles.flatMap((r) => r.bullets)
  /**
   * SÓLO SE SACA LO QUE ES EL CASO (CEO, 2026-09-30): «es preferible mostrar
   * experiencia en cosas que quizás no pidan que mostrar sólo 1 o 2 viñetas». Una
   * viñeta se va si repite a otra que queda (la cita y existe) o si el puesto pasa
   * del máximo; «no le sirve a este puesto» sola no alcanza.
   */
  const repetida = (id: string, reason: string) => {
    const citas = [...reason.matchAll(/[«"“]([^»"”]{12,})[»"”]/g)].map((m) => normalize(m[1].replace(/…$/, "")).slice(0, 40))
    return citas.some((c) => todas.some((x) => x.id !== id && normalize(x.text).startsWith(c)))
  }
  for (const b of bullets) if (b.decision === "remove" && !repetida(b.id, b.reason)) cambios.set(b.id, "keep")
  const sale = (id: string) => (cambios.get(id) ?? decision.get(id)!.decision) === "remove"
  for (const r of tree.roles) {
    const juzgadas = r.bullets.filter((b) => decision.has(b.id))
    const quedan = juzgadas.filter((b) => !sale(b.id))
    const minimo = Math.min(BULLETS_PER_ROLE_MIN, juzgadas.length)
    if (quedan.length < minimo) {
      const sacadas = juzgadas.filter((b) => sale(b.id))
      for (const b of porPeso(sacadas).slice(0, minimo - quedan.length)) cambios.set(b.id, "keep")
    } else if (quedan.length > BULLETS_PER_ROLE_MAX) {
      const sobran = quedan.length - BULLETS_PER_ROLE_MAX
      /**
       * EL MOTIVO ES EL DEL CÓDIGO (2026-10-02). Se guardaba el del modelo, que es
       * el de su propia decisión —«mantener», o una repetición que el código ya
       * descartó—. Medido en producción: «Facilité ceremonias Agile» salía con
       * «se superpone con "Desarrollé y mantuve aplicaciones iOS"», que no repite.
       * La razón real es que el puesto pasa del máximo, y eso es lo que se dice.
       */
      const motivo = language === "en"
        ? `This role has ${quedan.length} bullets and recruiters read up to ${BULLETS_PER_ROLE_MAX}: this one proves the least for this posting.`
        : `Este puesto tiene ${quedan.length} viñetas y se leen hasta ${BULLETS_PER_ROLE_MAX}: ésta es la que menos prueba para esta vacante.`
      for (const b of porPeso(quedan).reverse().slice(0, sobran)) {
        cambios.set(b.id, "remove")
        porExceso.set(b.id, motivo)
      }
    }
  }
  return bullets.map((b) =>
    cambios.get(b.id) === "keep"
      ? { ...b, decision: "keep" as const, ...(b.decision === "remove" ? { reason: seQueda(language) } : {}) }
      : cambios.get(b.id) === "remove"
        ? { ...b, decision: "remove" as const, reason: porExceso.get(b.id) ?? b.reason }
        : b,
  )
}

/** Cuánto del contenido de `a` (raíces de cinco letras, palabras de 4+) dice también `b`. */
function cubre(a: string, b: string): number {
  const raices = (t: string) => [...new Set(normalize(t).split(" ").filter((w) => w.length >= 4).map((w) => w.slice(0, 5)))]
  const A = raices(a)
  const B = new Set(raices(b))
  return A.length === 0 ? 0 : A.filter((w) => B.has(w)).length / A.length
}

/** Los puestos que quedan fuera del rango de viñetas que se leen, dicho para el ATS. */
function rangoDeViñetas(tree: ResumeTree, audit: AuditFacts): string[] {
  const decision = new Map(audit.bullets.map((b) => [b.id, b.decision]))
  return tree.roles.flatMap((r) => {
    const quedan = r.bullets.filter((b) => decision.get(b.id) !== "remove").length
    const minimo = Math.min(BULLETS_PER_ROLE_MIN, r.bullets.length)
    if (quedan > BULLETS_PER_ROLE_MAX) return [`${r.title} — ${r.company}: quedan ${quedan} viñetas; el máximo es ${BULLETS_PER_ROLE_MAX}. Marcá remove las que menos prueban de este puesto.`]
    if (quedan < minimo) return [`${r.title} — ${r.company}: quedan ${quedan} viñetas; el mínimo es ${minimo}. Dejá las ${minimo} que más prueban de este puesto.`]
    return []
  })
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
