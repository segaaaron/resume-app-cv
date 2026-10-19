// lib/ats3/rewrite.ts
//
// TAILOR: ejecuta la decisión del ATS sobre UNA línea (CEO, 2026-09-29).
//
// Recibe lo que el ATS dijo de esa línea —por qué, qué tiene que decir, qué
// skills escribir, si lleva cifra— y lo que la persona contó. Una llamada, los
// tres controles de `guards.ts`, y como mucho un reintento que dice qué falló.

import { buildTermIndex, normalize, rolDeNueva, termKey, termsIn, type AnchoredSuggestion, type JobSpec, type NodeId, type ResumeTree, type Suggestion } from "@/lib/ats3/contracts"
import { checkSuggestion, findNode, repairSuggestion, retryNudge, toFirstPerson, type GuardVerdict } from "@/lib/ats3/guards"
import { cvTextOf, experienceYears, statesQuantity, termsOf, titleForms } from "@/lib/ats3/score"
import { type AtsAi, type AtsStore, cacheKey } from "@/lib/ats3/ports"
import { isTrivialEdit } from "@/lib/services/ai/shared/text-similarity"

export interface RewriteRequest {
  tree: ResumeTree
  nodeId: NodeId
  spec: JobSpec
  language: "es" | "en"
  model: string
  jdKey: string
  /** Por qué el ATS pide mejorarla (o qué le falta al resumen). */
  reason?: string
  /** Las skills que el ATS decidió escribir en esta línea; en el resumen, el cargo. */
  terms?: string[]
  /** Este puesto necesita la cifra de este logro. */
  needsFigure?: boolean
  /** Lo que la persona contestó a la pregunta del ATS. */
  told?: string
  /** Skill que pide la vacante y el CV no muestra: la IA escribe el trabajo con ella en esta línea; la persona confirma si es verdad. */
  propone?: boolean
  /** Viñeta nueva: no hay línea original que conservar (se agrega o reemplaza a la señalada). */
  nueva?: boolean
  ai: AtsAi
  store: AtsStore
}

export type RewriteResult =
  | { ok: true; suggestion: AnchoredSuggestion; served: boolean; calls: number }
  /** La propuesta era la misma línea: no hay mejora que ofrecer, y se dice. */
  | { ok: false; alreadyGood: true; calls: number }
  | { ok: false; alreadyGood?: false; verdict: GuardVerdict; calls: number }

export async function runRewrite(req: RewriteRequest): Promise<RewriteResult> {
  const node = findNode(req.tree, req.nodeId)
  if (!node) return { ok: false, verdict: { ok: false, reason: "stale", detail: req.nodeId }, calls: 0 }

  const isSummary = req.nodeId === req.tree.summary.id
  // Una viñeta nueva (agregada o en lugar de otra) no conserva nada: la línea que
  // se pisa se muestra como «antes», pero no se le exige quedar dentro.
  const nueva = Boolean(req.nueva) || rolDeNueva(req.nodeId) !== null
  const original = nueva ? "" : node.text
  const role = req.tree.roles.find((r) => r.id === rolDeNueva(req.nodeId) || r.bullets.some((b) => b.id === req.nodeId))
  const siblings = req.tree.roles.flatMap((r) => r.bullets).filter((b) => b.id !== req.nodeId).map((b) => b.text)
  const ctx = {
    original,
    nueva,
    siblings: isSummary ? [] : siblings,
    // La identidad del CV, no sus viñetas: un hecho traído de otra viñeta del
    // puesto SÍ es un aporte; la plataforma repetida, no.
    known: [req.tree.summary.text, ...req.tree.roles.map((r) => r.title), ...req.tree.declaredSkills, req.tree.otherText].join(" "),
  }
  const terms = req.terms ?? []
  const pedido = JSON.stringify([req.reason ?? "", terms, Boolean(req.needsFigure), req.told ?? "", Boolean(req.propone), nueva])
  const key = cacheKey.fix(req.nodeId, node.hash, req.jdKey, req.model, pedido)

  /** Lo único que se vuelve a pedir: una respuesta vacía o pensada sobre otra versión de la línea. */
  const problemas = (s: Suggestion): string[] => {
    const v = checkSuggestion(s, ctx)
    return v.ok ? [] : [retryNudge(v, req.language)]
  }

  // La tercera persona regular se corrige, no se rechaza («Atendió» → «Atendí»).
  const preparar = (s: Suggestion): Suggestion => {
    const enPrimera = req.language !== "en" && !isSummary ? toFirstPerson(s.text) : null
    // «A | B» es la forma del motor para un requisito con alternativas: en una frase del CV
    // nunca va la barra (medido: «JavaScript | TypeScript» en un resumen). Se lee como «A / B».
    s = { ...s, text: s.text.replace(/\s*\|\s*/g, " / ") }
    const texto = enPrimera ?? s.text
    return repairSuggestion({ ...s, text: texto })
  }

  // Lo guardado pasa por los mismos controles: un control nuevo vale también para lo ya guardado.
  const guardada = (await req.store.read("ats3-fix", key)) as Suggestion | null
  const cached = guardada && guardada.changed ? preparar(guardada) : guardada
  if (cached && cached.changed && problemas(cached).length === 0) {
    return { ok: true, suggestion: anchor(cached, node.hash, node.text), served: true, calls: 0 }
  }

  const ask = (nudge?: string) =>
    isSummary
      ? req.ai.rewriteSummary({
          current: original,
          focus: req.reason,
          mustWrite: terms,
          yearsOfExperience: aniosDichos(original) ?? (Math.floor(experienceYears(req.tree)) || null),
          cvLines: req.tree.roles.flatMap((r) => r.bullets.map((b) => b.text)),
          otherSections: req.tree.otherText,
          spec: req.spec,
          topBullets: topBulletsOf(req.tree),
          provenTerms: provenTermsOf(req.tree, req.spec),
          declaredSkills: req.tree.declaredSkills,
          career: req.tree.roles.map((r) => ({ title: r.title, company: r.company, from: r.startDate, to: r.endDate })),
          nudge,
        })
      : req.ai.rewriteBullet({
          original,
          bulletId: req.nodeId,
          roleContext: role ? `${role.title} — ${role.company}` : "",
          roleLines: role?.bullets.filter((b) => b.id !== req.nodeId).map((b) => b.text),
          siblings,
          reason: req.reason,
          terms,
          needsFigure: req.needsFigure,
          told: req.told?.trim() || undefined,
          propone: req.propone,
          nueva,
          vacante: {
            cargo: req.spec.roleTitleRaw ?? "",
            responsabilidades: req.spec.responsibilities ?? [],
            // Lo que la vacante pide, con su frase: ahí suelen estar las tecnologías y procesos del trabajo.
            requisitos: [...(req.spec.mustHave ?? []), ...(req.spec.niceToHave ?? [])].map((r) => r.raw || r.skill),
            mide: req.spec.metricThatMatters ?? null,
          },
          language: req.language,
          nudge,
        })

  let calls = 1
  let first = await ask()
  // Una skill pedida no se abandona al primer «no puedo»: se pide una vez más.
  if (!first.changed && req.propone && !isSummary) {
    first = await ask(req.language === "en" ? `Write it: the person asked the AI to write ${terms.join(", ")} into this line and will confirm whether it is true. Write the work done with it, fitting what this line already does.` : `Escríbelo: la persona le pidió a la IA escribir ${terms.join(", ")} en esta línea y va a confirmar si es verdad. Escribe el trabajo hecho con eso, acorde a lo que la línea ya hace.`)
    calls++
  }
  // Tailor dice que no puede escribirlo sin afirmar algo que la persona no dijo.
  if (!first.changed) return { ok: false, verdict: { ok: false, reason: "declined", detail: "" }, calls }
  first = preparar(first)

  const antes = problemas(first)
  if (antes.length > 0) {
    const segundo = await ask(antes.join("\n"))
    calls++
    if (segundo.changed) {
      const reparado = preparar(segundo)
      if (problemas(reparado).length < antes.length) first = reparado
    }
  }

  /**
   * LA REGLA DEL 90% (CEO, 2026-08-22): una propuesta 90% o más igual a la línea
   * original no es una mejora; 90% o más igual a otra línea del CV la repite.
   */
  if (!nueva && isTrivialEdit(original, first.text)) return { ok: false, alreadyGood: true, calls }
  const repite = ctx.siblings.find((b) => isTrivialEdit(b, first.text))
  if (repite) return { ok: false, verdict: { ok: false, reason: "repeats", detail: repite }, calls }
  const v = checkSuggestion(first, ctx)
  if (!v.ok) return { ok: false, verdict: v, calls }

  await req.store.write("ats3-fix", key, first)
  return { ok: true, suggestion: anchor(first, node.hash, node.text), served: false, calls }
}

function anchor(s: Suggestion, hash: string, originalText: string): AnchoredSuggestion {
  return { ...s, basedOnHash: hash, originalText }
}

/** La prueba del resumen: los logros con cifra de los puestos más recientes. */
function topBulletsOf(tree: ResumeTree): string[] {
  const todas = tree.roles.flatMap((r) => r.bullets.map((b) => b.text))
  return [...todas.filter(statesQuantity), ...todas.filter((t) => !statesQuantity(t))].slice(0, 3)
}

/** Lo que la vacante pide y el CV ya escribe: lo único de la vacante que el resumen puede nombrar. */
function provenTermsOf(tree: ResumeTree, spec: JobSpec): string[] {
  const index = buildTermIndex(termsOf(spec, tree))
  const escritos = termsIn(index, cvTextOf(tree))
  /**
   * «A | B» ES UN REQUISITO, NO UN NOMBRE QUE SE ESCRIBE (2026-10-02). Medido contra
   * la API con Sezzle: el resumen decía «JavaScript | TypeScript» y «Claude | large
   * language model tools», con la barra, porque se le pasaba el requisito entero.
   * Se pasa la alternativa que el CV escribe.
   */
  const cv = cvTextOf(tree)
  const pedidos = [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])].flatMap((r) => {
    const opciones = r.skill.split(/\s*\|\s*/).filter(Boolean)
    if (opciones.length > 1) return opciones.filter((o) => termsIn(buildTermIndex([{ canonical: o, variants: titleForms(o) }]), cv).size > 0).slice(0, 1)
    const t = index.byKey.get(termKey(r.skill)) ?? r.skill
    return escritos.has(t) ? [t] : []
  })
  return [...new Set(pedidos)].filter((t) => normalize(t))
}

/**
 * LOS AÑOS QUE LA PERSONA YA DICE EN SU RESUMEN MANDAN (2026-09-30).
 *
 * Con fechas de sólo año, «2015 — 2016» se cuenta como dos años enteros aunque
 * hayan sido meses: medido en producción, un CV que dice «7+ years» recibía una
 * propuesta de resumen con «11 years». Lo que la persona afirma de sí misma no
 * lo corrige el cálculo; el cálculo sólo decide cuando el resumen no lo dice.
 */
function aniosDichos(resumen: string): number | null {
  const m = resumen.match(/(\d{1,2})\s*\+?\s*(?:years?|años?)/i)
  return m ? Number(m[1]) : null
}
