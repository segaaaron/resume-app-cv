// lib/ats3/judgments.ts
//
// LOS JUICIOS FIJADOS: lo que la auditoría decidió de una línea se conserva
// mientras ese texto exista, y lo que reconoció de cómo escribe el CV un
// requisito entra como variante verificada.

import { nodeHash, normalize, type JobSpec, type Resolution, type ResumeTree } from "@/lib/ats3/contracts"
import { cvTextOf, formaPosible, type AuditFacts } from "@/lib/ats3/score"

/**
 * UN JUICIO SÓLO PUEDE CAMBIAR SI CAMBIÓ EL TEXTO QUE LO SOSTIENE (CEO, 2026-09-28).
 *
 * ── EL DEFECTO QUE ESTO CIERRA, MEDIDO ──────────────────────────────────────
 * La auditoría se pedía de nuevo con cualquier cambio del CV, y el modelo no
 * juzga igual dos veces: con la misma vacante y dos líneas AGREGADAS, 8 de 42
 * viñetas que nadie tocó cambiaron de juicio y las tarjetas pasaron de 3 a 12.
 * «Arreglo una cosa y aparece trabajo en otro lado» — el panel contradiciéndose
 * sobre lo que el usuario no tocó. Lo mismo con la cobertura: «async/await»
 * pasó de faltante a implícito sin que ninguna línea cambiara.
 *
 * La regla: cada juicio se guarda atado al hash del texto que lo sostiene, y
 * el siguiente análisis lo RESPETA mientras ese texto exista.
 *   · los tres ejes de una viñeta → por el hash de la viñeta;
 *   · las funciones del resumen   → por el hash del resumen y la vacante;
 *   · un requisito o una blanda   → por la línea que lo prueba. Uno que no
 *     tenía prueba sólo cambia si la cita nueva es una línea NUEVA o editada:
 *     el modelo no puede descubrir hoy en una línea vieja lo que ayer no vio.
 *
 * Lo que el código mide —el término escrito, la cifra, la apertura— no pasa
 * por acá: no oscila.
 */
type Ejes = { hasActionVerb: boolean; hasResult: boolean; hasMethod: boolean }
type Estado<S> = { status: S; evidencia: string | null; forma?: { cvWording: string; match: "SAME" | "EQUIVALENT" | "MISSPELLED" } }
export interface Juicios {
  lineas: Record<string, Ejes>
  resumen: Record<string, AuditFacts["summary"]>
  requisitos: Record<string, Estado<AuditFacts["coverage"][number]["status"]>>
  blandas: Record<string, Estado<AuditFacts["softCoverage"][number]["status"]>>
}
export const JUICIOS_VACIOS: Juicios = { lineas: {}, resumen: {}, requisitos: {}, blandas: {} }

/**
 * LO MISMO ESCRITO DISTINTO CUENTA COMO ESCRITO (CEO, 2026-09-28: «la IA
 * debería saber todo esto»). El comparador cuenta palabras juntas y en orden, y
 * tu «CoreData» no era «Core Data» ni «SOLID design principles» era «SOLID
 * principles»: el panel pedía lo que ya tenías. Quien sabe que es lo mismo es
 * la auditoría (`match: SAME`); el código sólo comprueba que ese texto esté de
 * verdad en el CV, y lo agrega como variante del requisito. Sin listas a mano.
 */
export function conFormasDelCv(spec: JobSpec, audit: AuditFacts, tree: ResumeTree): JobSpec {
  const texto = cvTextOf(tree)
  const formas = new Map<string, string>()
  for (const c of audit.coverage) {
    if (c.match === "SAME" && c.cvWording && formaPosible(c.skill, c.cvWording, c.match, texto)) formas.set(normalize(c.skill), c.cvWording.trim())
  }
  if (formas.size === 0) return spec
  const con = (r: JobSpec["mustHave"][number]) => {
    const w = formas.get(normalize(r.skill))
    return w ? { ...r, cvForms: [w] } : r
  }
  return { ...spec, mustHave: spec.mustHave.map(con), niceToHave: spec.niceToHave.map(con) }
}

export function fijarJuicios(
  tree: ResumeTree,
  audit: AuditFacts,
  previos: Juicios,
  jdKey: string,
  log: Resolution[] = [],
): { audit: AuditFacts; juicios: Juicios } {
  const lineas = tree.roles.flatMap((r) => r.bullets)
  // El resumen también puede ser la evidencia que P2 cita: sin él en el mapa,
  // una cita al resumen se guardaba como «sin evidencia» y el requisito saltaba
  // a otra línea en el análisis siguiente (medido el 2026-09-28 con Coforge).
  const citables = [...lineas, tree.summary]
  const hashDe = new Map(citables.map((b) => [b.id, b.hash]))
  const idDe = new Map(citables.map((b) => [b.hash, b.id]))
  const vistas = new Set([...Object.keys(previos.lineas), ...Object.keys(previos.resumen).map((k) => k.slice(jdKey.length + 1))])
  /**
   * LO QUE EL ATS YA ACEPTÓ DE UNA LÍNEA NO SE PIERDE AL REESCRIBIRLA CON TAILOR
   * (2026-09-28, medido con el CV del CEO contra BairesDev). La tarjeta pedía
   * sólo el tamaño; Tailor escribió «…across 10 releases» y al reanalizar P2
   * leyó el texto nuevo desde cero y dijo «no dice en qué terminó», algo que
   * sobre la línea vieja había aceptado. Tailor no puede soltar contenido (lo
   * impide `drops_content`), así que un eje que la línea tenía lo sigue teniendo:
   * la línea escrita por Tailor hereda los ejes de la que reemplazó, y P2 sólo
   * puede sumar. El hash viejo sale del registro de lo aplicado (`before`);
   * si Tailor reescribió dos veces sin analizar en medio, se sigue la cadena.
   */
  const reemplazo = new Map<string, string>()
  for (const r of log) {
    if (r.resolvedBy === "AI_SUGGESTION" && r.kind !== "dropped" && r.before) reemplazo.set(r.nodeHashAtResolution, nodeHash(r.before))
  }
  /**
   * Y LO QUE LA TARJETA PROMETIÓ, TAILOR YA LO CUMPLIÓ. Una línea sólo se
   * entrega si cada eje que su tarjeta pedía pasó `ejesFaltan` —declarado por
   * el modelo y con palabras nuevas que el código ve—, y la tarjeta de una línea
   * junta TODO lo que le falta. Lo que no pedía, la línea vieja ya lo tenía.
   * Re-juzgarla desde cero era el ATS desdiciendo su propia entrega (medido:
   * «no dice en qué terminó» sobre la línea que Tailor acababa de cerrar).
   */
  const heredar = (h: string, nuevo: Ejes): Ejes => {
    let viejo = reemplazo.get(h)
    for (let i = 0; viejo && !previos.lineas[viejo] && i < 10; i++) viejo = reemplazo.get(viejo)
    return viejo && previos.lineas[viejo] ? { hasActionVerb: true, hasResult: true, hasMethod: true } : nuevo
  }

  /**
   * Y UNA LÍNEA DE TAILOR NO ES EVIDENCIA NUEVA (medido el mismo día con
   * Coforge): Tailor escribió «Clean Architecture» en la viñeta de TCA y al
   * reanalizar P2 citó esa línea como prueba de «Mobile Architecture», que antes
   * era «sin rastro» — una tarjeta nueva sobre la línea recién arreglada, nacida
   * de la redacción de la IA y no de un hecho de la persona. Para descubrir un
   * requisito, cuenta la línea que la persona escribió o editó; la de Tailor
   * hereda lo que valía la que reemplazó.
   */
  // La blanda es otra cosa: la tarjeta le pidió a Tailor tejerla en esa línea,
  // así que ahí la línea de Tailor SÍ es la prueba que se buscaba.
  const nueva = (id: string | null, deTailorVale = false) =>
    Boolean(id && hashDe.has(id) && !vistas.has(hashDe.get(id)!) && (deTailorVale || !reemplazo.has(hashDe.get(id)!)))
  const sucesor = new Map([...reemplazo].map(([nuevo, viejo]) => [viejo, nuevo]))
  const vigente = (h: string) => {
    let x: string | undefined = h
    for (let i = 0; x && !idDe.has(x) && i < 10; i++) x = sucesor.get(x)
    return x ? idDe.get(x) : undefined
  }

  // Sólo se guardan las líneas que el CV tiene hoy: el registro no crece sin fin.
  const ejes: Record<string, Ejes> = {}
  const textoDe = new Map(lineas.map((b) => [b.id, b.text]))
  const bullets = audit.bullets.map((b) => {
    const h = hashDe.get(b.id)
    if (!h) return b
    const leido = previos.lineas[h] ?? heredar(h, { hasActionVerb: b.hasActionVerb, hasResult: b.hasResult, hasMethod: b.hasMethod })
    /**
     * UN PORCENTAJE ESCRITO ES UN RESULTADO (2026-09-28, medido contra la API con
     * el CV del CEO). P2 juzgó «…contributing to a reduction in crash rates by
     * 20%» como sin resultado; la tarjeta pedía escribirlo y la IA de Tailor, que
     * lo veía escrito, se negaba: el ATS y Tailor contradiciéndose sobre la misma
     * línea. Lo que el texto prueba, el código lo fija.
     */
    const fijo = { ...leido, hasResult: leido.hasResult || /\d+(?:[.,]\d+)?\s?%/.test(textoDe.get(b.id) ?? "") }
    ejes[h] = fijo
    return { ...b, ...fijo }
  })

  const claveResumen = `${jdKey}:${tree.summary.hash}`
  const summary = previos.resumen[claveResumen] ?? audit.summary

  /** El mismo criterio para requisitos y blandas: la prueba manda. */
  const fijar = <S extends string>(clave: string, nuevo: Estado<S> & { id: string | null }, guardados: Record<string, Estado<S>>, deTailorVale = false) => {
    const antes = guardados[clave]
    const lineaDeAntes = antes?.evidencia ? vigente(antes.evidencia) : undefined
    if (antes && lineaDeAntes) return { status: antes.status, id: lineaDeAntes }
    if (antes && !antes.evidencia && !nueva(nuevo.id, deTailorVale)) return { status: antes.status, id: null }
    // Sin juicio guardado —la auditoría omitió ese requisito la vez anterior—
    // la línea de Tailor tampoco es evidencia nueva (medido el 2026-09-28:
    // «Scrum | Kanban» apareció sobre «…agile team collaboration…», que había
    // escrito Tailor). Queda como estaba, o sin encontrar.
    if (!deTailorVale && nuevo.id && hashDe.has(nuevo.id) && reemplazo.has(hashDe.get(nuevo.id)!)) {
      return { status: (antes?.status ?? "NOT_FOUND") as S, id: null }
    }
    return { status: nuevo.status, id: nuevo.id }
  }
  const requisitos = { ...previos.requisitos }
  const texto = cvTextOf(tree)
  const coverage = audit.coverage.map((c) => {
    const clave = `${jdKey}:${normalize(c.skill)}`
    const r = fijar(clave, { status: c.status, evidencia: null, id: c.evidenceNodeId }, previos.requisitos)
    /**
     * CÓMO LO ESCRIBE EL CV, TAMBIÉN FIJADO (medido el 2026-09-28 con Coforge):
     * la auditoría reconoció «RESTful APIs» como «external APIs» y en el
     * análisis siguiente contestó distinto — el requisito volvía como faltante
     * sobre la línea que Tailor acababa de arreglar. Lo reconocido se conserva
     * mientras ese texto siga en el CV; si ya no está, vale lo de hoy.
     */
    const antes = previos.requisitos[clave]?.forma
    const nueva = c.cvWording && c.match && formaPosible(c.skill, c.cvWording, c.match, texto) ? { cvWording: c.cvWording, match: c.match } : undefined
    const forma = antes && formaPosible(c.skill, antes.cvWording, antes.match, texto) ? antes : nueva
    requisitos[clave] = { status: r.status, evidencia: r.id ? (hashDe.get(r.id) ?? null) : null, ...(forma ? { forma } : {}) }
    return { ...c, status: r.status, evidenceNodeId: r.id, cvWording: forma?.cvWording ?? null, match: forma?.match ?? null }
  })
  const blandas = { ...previos.blandas }
  const softCoverage = audit.softCoverage.map((s) => {
    const clave = `${jdKey}:${normalize(s.signal)}`
    const r = fijar(clave, { status: s.status, evidencia: null, id: s.evidenceNodeId }, previos.blandas, true)
    blandas[clave] = { status: r.status, evidencia: r.id ? (hashDe.get(r.id) ?? null) : null }
    return { ...s, status: r.status, evidenceNodeId: r.id }
  })

  return {
    audit: { ...audit, bullets, summary, coverage, softCoverage },
    juicios: { lineas: ejes, resumen: { ...previos.resumen, [claveResumen]: summary }, requisitos, blandas },
  }
}
