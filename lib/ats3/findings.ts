// lib/ats3/findings.ts
//
// LAS TARJETAS: la decisión del ATS, dicha como algo que la persona puede hacer
// (CEO, 2026-09-29). El código no juzga ninguna línea: traduce lo que el ATS
// decidió y le pone la ganancia que mide el puntaje.

import { findingId, mismaRaiz, nodeHash, normalize, type Finding, type JobSpec, type NodeId, type ResumeTree } from "@/lib/ats3/contracts"
import { SKILLS_MAX } from "@/lib/ats3/ledger"
import { opensWeakly } from "@/lib/services/ai/shared/empty-phrasing"
import { cargoNucleo, cvTextOf, experienceYears, gainOf, statesQuantity, titleWritten, type AuditFacts, type Score } from "@/lib/ats3/score"

/**
 * ¿EL CV RESPALDA ESTE NOMBRE? Cada palabra del nombre aparece en algún lado del
 * CV, por su raíz (4 letras): «REST web services» sí (RESTful, web, services);
 * «SDK architecture» no, si el CV nunca dice SDK (medido 2026-09-29: el ATS la dio
 * por demostrada y la mandaba escribir en la línea de TCA). Lo que no está
 * respaldado no se escribe en el CV: se le pregunta a la persona.
 */
export function respaldadoEnCv(tree: ResumeTree, nombre: string): boolean {
  return alternativaRespaldada(tree, nombre) !== null
}

/**
 * «Soldadura MIG | TIG» se cumple con cualquiera de las dos: devuelve la primera
 * alternativa que el CV respalda —la que se escribe—, o null.
 */
export function alternativaRespaldada(tree: ResumeTree, nombre: string): string | null {
  const palabras = normalize(cvTextOf(tree)).split(" ")
  const opciones = nombre.split(/\s*\|\s*/).filter(Boolean)
  return (
    opciones.find((o) =>
      normalize(o)
        .split(" ")
        .filter((w) => w.length >= 3)
        .every((w) => palabras.some((p) => mismaRaiz(p, w))),
    ) ?? null
  )
}

/**
 * LO QUE HAY PARA HACER EN CADA VIÑETA, comprobable (CEO, 2026-09-29): las skills
 * del aviso que el CV respalda y el ATS mandó escribir ahí, la cifra que el
 * puesto pide y la línea no dice, y las herramientas de las habilidades que ese
 * trabajo usó. Un solo dueño: de acá salen las tarjetas y la decisión que se ve.
 */
export function trabajoPorViñeta(tree: ResumeTree, audit: AuditFacts): Map<NodeId, Trabajo> {
  /**
   * NINGÚN NOMBRE DEL AVISO SE ESCRIBE DENTRO DE UNA VIÑETA (CEO, 2026-09-29).
   * Esa puerta (`writeIn`) metía afirmaciones que el CV no hace: «Integrated API
   * design, RESTful APIs…» sobre una línea de integración. Un requisito que el CV
   * demuestra con otras palabras va a Habilidades (`skillPlan`); uno que no
   * muestra se pregunta. En la viñeta sólo entra lo verificado: la herramienta
   * de la lista de la persona, su cifra, y el verbo en lugar de la apertura débil.
   */
  const textoDe = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, b.text] as const)))
  return new Map(
    audit.bullets
      // Una línea que Tailor ya cerró no tiene trabajo: ni cifra, ni herramienta, ni apertura.
      .filter((d) => d.decision !== "remove" && !d.cerrada)
      .map((d) => [
        d.id,
        {
          pideCifra: d.needsFigure && !statesQuantity(textoDe.get(d.id) ?? ""),
          facts: d.facts ?? [],
          // «Responsable de…», «Helped with…»: se prueba con la lista de aperturas del proyecto.
          aperturaDebil: opensWeakly(textoDe.get(d.id) ?? ""),
          pideLogro: Boolean(d.needsOutcome),
        },
      ]),
  )
}

export type Trabajo = { pideCifra: boolean; facts: string[]; aperturaDebil: boolean; pideLogro: boolean }

/** Hay algo verificable que hacer en esta viñeta. */
export function hayTrabajo(t: Trabajo | undefined): boolean {
  return Boolean(t && (t.pideCifra || t.facts.length > 0 || t.aperturaDebil || t.pideLogro))
}

export function findingsOf(tree: ResumeTree, audit: AuditFacts, score: Score, spec?: JobSpec): Finding[] {
  const out: Finding[] = []
  const textoDe = new Map<NodeId, string>([[tree.summary.id, tree.summary.text], ...tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, b.text] as [NodeId, string]))])
  const tarjeta = (f: Omit<Finding, "id" | "nodeText" | "nodeHash"> & { matiz?: string }): Finding => {
    const { matiz, ...resto } = f
    const texto = textoDe.get(f.nodeId) ?? ""
    return { id: findingId(f.nodeId, f.type, matiz), nodeText: texto, nodeHash: nodeHash(texto), ...resto }
  }

  const trabajo = trabajoPorViñeta(tree, audit)

  // ── las viñetas ─────────────────────────────────────────────────────────────
  const decision = new Map(audit.bullets.map((b) => [b.id, b]))
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const d = decision.get(b.id)
      if (!d) continue
      if (d.decision === "remove") {
        out.push(tarjeta({ type: "remove_bullet", component: "bullets", remedy: "remove", nodeId: b.id, gain: gainOf(score, "bullets"), detail: "", reason: d.reason }))
        continue
      }
      const t = trabajo.get(b.id)
      const pideCifra = t?.pideCifra ?? false
      /**
       * «Mantener» con una skill que escribir o una cifra que el puesto pide
       * TAMBIÉN es trabajo sobre esa línea: se hace en la misma tarjeta.
       */
      // Un hecho nuevo del CV (la herramienta que ese trabajo usó) también es trabajo sobre la línea.
      const facts = t?.facts ?? []
      /**
       * SÓLO LO QUE SE PUEDE COMPROBAR (CEO, 2026-09-29). Una tarjeta de mejorar
       * existe si hay algo concreto que agregar: la herramienta que ese trabajo
       * usó, la skill del aviso que el CV respalda, o la cifra que el puesto pide.
       * «Mejorar» sin nada de eso era una reescritura libre, y medido en 8 corridas
       * mezclaba logros de puestos distintos y metía frases del aviso.
       */
      if (hayTrabajo(t)) {
        out.push(
          tarjeta({
            type: "improve_bullet",
            component: "bullets",
            remedy: "rewrite",
            nodeId: b.id,
            gain: (d.decision === "improve" ? gainOf(score, "bullets") : 0) + (pideCifra ? gainOf(score, "metric") : 0),
            detail: "",
            ...(facts.length ? { facts } : {}),
            ...(t?.aperturaDebil ? { weakOpener: true } : {}),
            ...(pideCifra ? { needsFigure: true } : {}),
            ...(t?.pideLogro ? { needsOutcome: true } : {}),
          }),
        )
      }
    }
  }

  // ── las skills sin ninguna línea donde escribirlas: se le pregunta a la persona
  const credencial = new Set(
    [...(spec?.mustHave ?? []), ...(spec?.niceToHave ?? [])].filter((r) => r.kind === "credential").map((r) => normalize(r.skill)),
  )
  /**
   * NINGUNA SKILL SUELTA (CEO, 2026-09-30): la que sólo está nombrada en la lista
   * vale 0,6 y la IA la puede demostrar en una línea; antes quedaba sin tarjeta.
   * Lo que se promete es lo que falta para 1: todo si falta, 0,4 si está nombrada.
   */
  const falta = (status: string) => (status === "listed" ? 0.4 : 1)
  const condiciones = (audit.conditions ?? []).map((c) => normalize(c.text).split(" "))
  const enCondicion = (skill: string) =>
    condiciones.some((palabras) => normalize(skill).split(" ").filter(Boolean).every((w) => palabras.some((p) => mismaRaiz(p, w))))
  for (const h of audit.hard) {
    if (h.status === "demonstrated") continue
    const key = h.requirement === "MUST" ? "must" : "nice"
    /**
     * Una credencial —título, licencia, idioma— se tiene o no se tiene: vive en
     * su sección del CV, no en una viñeta. La tarjeta lo dice sin botón de IA;
     * si ya está nombrada, no hay nada más que hacer.
     */
    const esCredencial = credencial.has(normalize(h.skill))
    if (h.status === "listed" && esCredencial) continue
    // Una credencial que ya es una condición del aviso («Fluent English is mandatory») la avisa esa condición: no se repite.
    if (esCredencial && enCondicion(h.skill)) continue
    out.push(
      tarjeta({
        type: "missing_skill",
        component: key,
        remedy: esCredencial ? "none" : "ask",
        subject: h.skill,
        matiz: normalize(h.skill),
        nodeId: tree.summary.id,
        gain: gainOf(score, key) * falta(h.status),
        detail: h.status,
        ...(h.question && !esCredencial ? { question: h.question } : {}),
      }),
    )
  }

  // ── las soft skills que el CV no demuestra: también se preguntan ────────────
  // Una soft se demuestra con un logro. Sin uno en el CV, se le pide a la persona
  // y con lo que cuente Tailor la escribe en su puesto.
  for (const x of audit.soft) {
    if (x.status === "demonstrated") continue
    out.push(
      tarjeta({
        type: "missing_skill",
        component: "soft",
        remedy: "ask",
        subject: x.signal,
        matiz: normalize(x.signal),
        nodeId: tree.summary.id,
        gain: gainOf(score, "soft") * falta(x.status),
        detail: x.status,
      }),
    )
  }

  // ── lo que filtra y no se redacta: sólo se avisa (CEO, 2026-09-30) ─────────
  for (const c of audit.conditions ?? []) {
    if (c.met === "yes") continue
    out.push(
      tarjeta({
        type: "eligibility",
        component: "must",
        remedy: "none",
        subject: c.text,
        matiz: normalize(c.text),
        nodeId: tree.summary.id,
        gain: 0,
        detail: c.met,
        ...(c.cvSays ? { reason: c.cvSays } : {}),
      }),
    )
  }

  // ── el cargo que la vacante busca, escrito tal cual ─────────────────────────
  const cargo = cargoNucleo(spec?.roleTitleRaw ?? "")
  if (cargo && spec && !titleWritten(tree, spec)) {
    out.push(tarjeta({ type: "title_mismatch", component: "title", remedy: "rewrite", subject: cargo, nodeId: tree.summary.id, gain: gainOf(score, "title"), detail: cargo }))
  }

  // ── los años que la vacante pide: no se redactan ────────────────────────────
  const pideAnios = spec?.yearsRequired ?? null
  if (pideAnios) {
    const tiene = experienceYears(tree)
    const comp = score.components.find((c) => c.key === "years")
    if (tiene < pideAnios && comp) {
      out.push(tarjeta({ type: "years_short", component: "years", remedy: "none", nodeId: tree.summary.id, gain: comp.effectiveWeight - comp.points, detail: `${Math.floor(tiene)}/${pideAnios}` }))
    }
  }

  // ── el resumen ──────────────────────────────────────────────────────────────
  const faltan = (["identity", "proof", "fit"] as const).filter((k) => !audit.summary[k])
  if (faltan.length > 0) {
    out.push(tarjeta({ type: "summary_gap", component: "summary", remedy: "rewrite", nodeId: tree.summary.id, gain: gainOf(score, "summary"), detail: faltan.join(", ") }))
  }

  return out
}

/**
 * LAS HABILIDADES QUE ESTE CV LLEVA PARA ESTA VACANTE — y en qué orden.
 *
 * Determinista, sin modelo y sin borrar nada: primero lo que el aviso pide y el
 * CV sostiene (porque ya está en la lista o porque una viñeta lo demuestra),
 * obligatorias antes que deseables; después las tuyas, en tu orden. Las
 * plantillas muestran las primeras `SKILLS_MAX`: el orden decide cuáles se ven.
 * Nunca entra algo que el CV no sostiene, ni una credencial (vive en su sección).
 */
export function skillPlan(
  declared: readonly string[],
  spec: JobSpec,
  audit: AuditFacts,
): { final: string[]; add: string[]; entering: string[]; leaving: string[] } {
  const comoLoEscribio = new Map(declared.map((d) => [normalize(d), d]))
  const nombre = (s: string) => comoLoEscribio.get(normalize(s)) ?? s
  const demostradas = new Set(audit.hard.filter((h) => h.status === "demonstrated").map((h) => normalize(h.skill)))
  const credenciales = new Set([...spec.mustHave, ...spec.niceToHave].filter((r) => r.kind === "credential").map((r) => normalize(r.skill)))

  const final: string[] = []
  const meter = (s: string) => {
    const n = normalize(s)
    if (!n || final.some((x) => normalize(x) === n)) return
    final.push(nombre(s))
  }
  for (const r of [...spec.mustHave, ...spec.niceToHave]) {
    const n = normalize(r.skill)
    if (comoLoEscribio.has(n) || (demostradas.has(n) && !credenciales.has(n))) meter(r.skill)
  }
  for (const s of declared) meter(s)

  const visibles = (xs: readonly string[]) => new Set(xs.slice(0, SKILLS_MAX).map(normalize))
  const hoy = visibles(declared)
  const despues = visibles(final)
  return {
    final,
    add: final.filter((s) => !comoLoEscribio.has(normalize(s))),
    /** Las que pasan a verse en la plantilla: nuevas, o tuyas que suben. */
    entering: final.slice(0, SKILLS_MAX).filter((s) => !hoy.has(normalize(s))),
    /** Las que dejan de verse. Siguen en tus datos. */
    leaving: declared.slice(0, SKILLS_MAX).filter((s) => !despues.has(normalize(s))),
  }
}
