// lib/ats3/findings.ts
//
// LAS TARJETAS: la decisión del ATS, dicha como algo que la persona puede hacer
// (CEO, 2026-09-29). El código no juzga ninguna línea: traduce lo que el ATS
// decidió y le pone la ganancia que mide el puntaje.

import { findingId, mismaRaiz, nodeHash, normalize, nuevaEn, type Finding, type JobSpec, type NodeId, type ResumeTree } from "@/lib/ats3/contracts"
import { BULLETS_PER_ROLE_MAX, BULLETS_PER_ROLE_MIN, SKILLS_MAX } from "@/lib/ats3/ledger"
import { cargoNucleo, cvTextOf, experienceYears, gainOf, titleWritten, type AuditFacts, type Score } from "@/lib/ats3/score"

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

export function findingsOf(tree: ResumeTree, audit: AuditFacts, score: Score, spec?: JobSpec, cerradas: readonly string[] = []): Finding[] {
  const out: Finding[] = []
  const textoDe = new Map<NodeId, string>([[tree.summary.id, tree.summary.text], ...tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, b.text] as [NodeId, string]))])
  const tarjeta = (f: Omit<Finding, "id" | "nodeText" | "nodeHash"> & { matiz?: string }): Finding => {
    const { matiz, ...resto } = f
    const texto = textoDe.get(f.nodeId) ?? ""
    return { id: findingId(f.nodeId, f.type, matiz), nodeText: texto, nodeHash: nodeHash(texto), ...resto }
  }

  /**
   * ── CUÁNTAS TARJETAS DE SKILL (CEO, 2026-10-05) ───────────────────────────
   *
   * Una tarjeta por skill que falta daba 37 contra X-Team; ubicarlas en «el
   * trabajo más cercano» daba 28 y Tailor inventaba («the Flashlight feature»,
   * «Rendered Rappi with Skia»). Se escribe con verdad sólo donde la persona YA
   * hizo ese trabajo: eso lo decide el ATS (`writeIn`) y el código comprueba que
   * la viñeta exista, que Tailor no la haya cerrado y que lleve UNA skill. Esas
   * van una por tarjeta, en su línea. Todas las demás —sin evidencia en el CV—
   * van en UNA tarjeta: la persona dice cuál tiene y dónde la usó, y recién ahí
   * Tailor la escribe. Nada se pierde y nada se escribe sin respaldo.
   * Lo deseable que falta no se escribe: un plus que el CV no tiene.
   */
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

  // Una credencial —título, licencia, idioma— se tiene o no se tiene: se avisa sin botón, fuera del cupo.
  for (const h of audit.hard) {
    if (h.status !== "missing" || h.requirement !== "MUST" || !credencial.has(normalize(h.skill)) || enCondicion(h.skill)) continue
    out.push(tarjeta({ type: "missing_skill", component: "must", remedy: "none", subject: h.skill, matiz: normalize(h.skill), nodeId: tree.summary.id, gain: gainOf(score, "must"), detail: h.status }))
  }

  const orden = new Map((spec?.mustHave ?? []).map((r, i) => [normalize(r.skill), i] as const))
  const duras = audit.hard
    .filter((h) => h.status !== "demonstrated" && h.requirement === "MUST" && !credencial.has(normalize(h.skill)))
    .sort((x, y) => (orden.get(normalize(x.skill)) ?? 999) - (orden.get(normalize(y.skill)) ?? 999))
  type Candidata = { nombre: string; component: "must" | "soft"; status: string; question: string | null }
  const candidata = (nombre: string, component: "must" | "soft", status: string, question: string | null = null): Candidata => ({ nombre, component, status, question })
  const rolDe = new Map(tree.roles.flatMap((r) => r.bullets.map((b) => [b.id, r.id] as const)))
  const cerradasSet = new Set(cerradas)
  /**
   * ── EL PLAN POR PUESTO (CEO, 2026-10-05) ──────────────────────────────────
   * Cada línea lleva como mucho UNA dura y UNA blanda (la blanda como el hecho
   * que la muestra). Lo que encaja con un puesto pero con ninguna línea va en una
   * viñeta nueva de ese puesto, hasta 6. Un puesto con menos de 4 al que la
   * vacante no le aporta nada pregunta qué otro trabajo hubo ahí. El resto —sin
   * evidencia en el CV— va a la tarjeta agrupada.
   */
  const porLinea = new Map<string, { dura?: Candidata; blanda?: Candidata }>()
  const porPuesto = new Map<string, Candidata[]>()
  const sinEvidencia: Candidata[] = []
  for (const h of duras) {
    const c = candidata(h.skill, "must", h.status, h.question)
    const role = h.writeIn ? rolDe.get(h.writeIn) : undefined
    if (!h.writeIn || !role) {
      sinEvidencia.push(c)
      continue
    }
    const linea = porLinea.get(h.writeIn)
    if (h.writeInRelation === "same_task" && !cerradasSet.has(h.writeIn) && !linea?.dura) {
      porLinea.set(h.writeIn, { ...linea, dura: c })
      continue
    }
    // Encaja con el puesto y no con una línea libre: viñeta nueva de ese puesto.
    porPuesto.set(role, [...(porPuesto.get(role) ?? []), c])
  }
  for (const x of audit.soft.filter((y) => y.status !== "demonstrated")) {
    const c: Candidata = { nombre: x.signal, component: "soft", status: x.status, question: null }
    const linea = x.writeIn ? porLinea.get(x.writeIn) : undefined
    if (x.writeIn && rolDe.has(x.writeIn) && !cerradasSet.has(x.writeIn) && !linea?.blanda) porLinea.set(x.writeIn, { ...linea, blanda: c })
    else sinEvidencia.push(c)
  }
  // Una tarjeta por línea, con su dura y su blanda juntas.
  for (const [nodeId, { dura, blanda }] of porLinea) {
    const juntas = [dura, blanda].filter((c): c is Candidata => Boolean(c))
    const nombres = juntas.map((c) => c.nombre)
    out.push(
      tarjeta({
        type: "missing_skill",
        component: dura ? "must" : "soft",
        remedy: "ask",
        subject: nombres.join(" + "),
        terms: nombres,
        matiz: nombres.map(normalize).join("+"),
        nodeId,
        gain: juntas.reduce((n, c) => n + gainOf(score, c.component) * falta(c.status), 0),
        detail: juntas[0].status,
        roleId: rolDe.get(nodeId),
        ...(dura?.question ? { question: dura.question } : {}),
      }),
    )
  }
  // Las viñetas nuevas, puesto por puesto: hasta 6; y el puesto que queda debajo de 4 pregunta.
  for (const r of tree.roles) {
    const n = r.bullets.length
    const nuevas = (porPuesto.get(r.id) ?? []).slice(0, Math.max(0, BULLETS_PER_ROLE_MAX - n))
    for (const c of porPuesto.get(r.id)?.slice(nuevas.length) ?? []) sinEvidencia.push(c)
    for (const c of nuevas) {
      out.push(
        tarjeta({
          type: "missing_skill",
          component: "must",
          remedy: "ask",
          subject: c.nombre,
          terms: [c.nombre],
          matiz: normalize(c.nombre),
          nodeId: nuevaEn(r.id),
          gain: gainOf(score, "must") * falta(c.status),
          detail: c.status,
          roleId: r.id,
          ...(c.question ? { question: c.question } : {}),
        }),
      )
    }
    if (n > 0 && n + nuevas.length < BULLETS_PER_ROLE_MIN) {
      out.push(
        tarjeta({
          type: "role_short",
          component: "must",
          remedy: "ask",
          subject: [r.title, r.company].filter(Boolean).join(" — "),
          matiz: r.id,
          nodeId: nuevaEn(r.id),
          gain: 0,
          detail: String(n + nuevas.length),
          roleId: r.id,
        }),
      )
    }
  }
  if (sinEvidencia.length > 0) {
    const nombres = sinEvidencia.map((c) => c.nombre)
    out.push(
      tarjeta({
        type: "missing_skills",
        component: sinEvidencia.some((c) => c.component === "must") ? "must" : "soft",
        remedy: "ask",
        subjects: nombres,
        // El id cambia si cambia la lista: cerrar una no esconde las demás en el próximo análisis.
        matiz: [...nombres].map(normalize).sort().join("|"),
        nodeId: tree.summary.id,
        gain: sinEvidencia.reduce((n, c) => n + gainOf(score, c.component) * falta(c.status), 0),
        detail: String(nombres.length),
      }),
    )
  }

  // ── lo que filtra y no se redacta: sólo se avisa (CEO, 2026-09-30) ─────────
  for (const c of audit.conditions ?? []) {
    if (c.met === "yes") continue
    /**
     * UN NIVEL DE IDIOMA QUE SE CUMPLE NO SE AVISA (2026-10-02). Visto en local: «La
     * vacante exige: Inglés A1 — tu CV dice Inglés B2… probablemente te filtre». El
     * modelo no comparó los niveles; el marco europeo se compara sin dudas.
     */
    const pide = nivelIdioma(c.text)
    const tiene = nivelIdioma(c.cvSays ?? "")
    if (pide !== null && tiene !== null && tiene >= pide) continue
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
  /**
   * UN REQUISITO CON ALTERNATIVAS NO ES UN NOMBRE (2026-10-02). Visto en local: la
   * tarjeta proponía agregar «RESTful APIs | GraphQL» a Habilidades, con la barra,
   * y el CV ya decía «RESTful APIs». Se escribe UNA alternativa: la que la persona
   * ya declaró, o la que el ATS citó del CV; si no se sabe cuál, ninguna.
   */
  const citaDe = new Map(audit.hard.map((h) => [normalize(h.skill), normalize(h.cvWording ?? "")] as const))
  for (const r of [...spec.mustHave, ...spec.niceToHave]) {
    const n = normalize(r.skill)
    const opciones = r.skill.split(/\s*\|\s*/).filter(Boolean)
    if (opciones.length > 1) {
      const declarada = opciones.find((o) => comoLoEscribio.has(normalize(o)))
      const citada = opciones.find((o) => normalize(o) && (citaDe.get(n) ?? "").includes(normalize(o)))
      const una = declarada ?? (demostradas.has(n) && !credenciales.has(n) ? citada : undefined)
      if (una) meter(una)
      continue
    }
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

/** El nivel del marco europeo que dice un texto (A1=1 … C2=6, nativo=7), o null si no dice ninguno. */
function nivelIdioma(texto: string): number | null {
  if (/\b(nativ[oa]|native|lengua materna|mother tongue)\b/i.test(texto)) return 7
  const m = texto.match(/\b([ABC])([12])\b/i)
  return m ? (m[1].toUpperCase().charCodeAt(0) - 65) * 2 + Number(m[2]) : null
}
