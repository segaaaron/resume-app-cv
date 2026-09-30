// lib/ats3/rewrite.ts
//
// TAILOR: ejecuta la decisión del ATS sobre UNA línea (CEO, 2026-09-29).
//
// Recibe lo que el ATS dijo de esa línea —por qué, qué tiene que decir, qué
// skills escribir, si lleva cifra— y lo que la persona contó. Una llamada, los
// tres controles de `guards.ts`, y como mucho un reintento que dice qué falló.

import { buildTermIndex, mismaRaiz, normalize, rolDeNueva, termKey, termsIn, type AnchoredSuggestion, type JobSpec, type NodeId, type ResumeTree, type Suggestion } from "@/lib/ats3/contracts"
import { checkSuggestion, droppedFigures, droppedNames, figureSlots, findNode, repairSuggestion, retryNudge, similarTo, toFirstPerson, addsNothing, type GuardVerdict } from "@/lib/ats3/guards"
import { cvTextOf, experienceYears, statesQuantity, termsOf, titleForms } from "@/lib/ats3/score"
import { type AtsAi, type AtsStore, cacheKey } from "@/lib/ats3/ports"
import { opensWeakly } from "@/lib/services/ai/shared/empty-phrasing"

export interface RewriteRequest {
  tree: ResumeTree
  nodeId: NodeId
  spec: JobSpec
  language: "es" | "en"
  model: string
  jdKey: string
  /** Por qué el ATS pide mejorarla (o qué le falta al resumen). */
  reason?: string
  /** Qué tiene que decir la línea nueva, según el ATS. */
  instruction?: string
  /** Los hechos nuevos del CV que la línea tiene que decir, con su fuente (ATS). */
  facts?: string[]
  /** Las skills que el ATS decidió escribir en esta línea; en el resumen, el cargo. */
  terms?: string[]
  /** Este puesto necesita la cifra de este logro. */
  needsFigure?: boolean
  /** Lo que la persona contestó a la pregunta del ATS. */
  told?: string
  /** Skill que pide la vacante y el CV no muestra: la IA escribe el trabajo con ella en esta línea; la persona confirma si es verdad. */
  propone?: boolean
  /** La línea dice qué se hizo y no qué logró: se escribe el logro con el hueco de su cifra. */
  logro?: boolean
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
  /**
   * LOS HECHOS QUE EL ATS DECLARÓ, EN LAS PALABRAS QUE LOS DISTINGUEN (CEO, 2026-09-29).
   * De cada hecho («Xcode Instruments para medir el rendimiento — habilidades») se
   * quedan las palabras que la línea original no dice: son las que prueban que el
   * hecho entró. Sin la fuente, que no se escribe.
   */
  const palabrasOriginal = new Set(normalize(original).split(" "))
  const hechos = (req.facts ?? [])
    .map((f) => ({ f: f.split(/\s+[—–-]\s+/)[0].trim(), w: normalize(f.split(/\s+[—–-]\s+/)[0]).split(" ").filter((x) => x.length >= 4 && !palabrasOriginal.has(x)) }))
    .filter((h) => h.w.length > 0)
  /**
   * LO QUE LA LÍNEA NUEVA PUEDE DECIR Y LO QUE NO (CEO, 2026-09-29), comprobado
   * sobre el texto y no pedido en prosa, que el modelo se saltaba:
   *  · una frase del aviso (3+ palabras seguidas de sus responsabilidades o de
   *    cómo escribe un requisito) que no es el nombre de una skill es relleno:
   *    «contributing to technical design and delivery»;
   *  · un nombre técnico nuevo (sigla o palabra con mayúscula a mitad de frase)
   *    que no está en el CV, en lo que la persona contó ni en lo que el ATS
   *    mandó escribir es una afirmación sin respaldo: «SDK», «Apigee».
   */
  const nombresPermitidos = [...terms, ...(req.facts ?? [])]
  const ngramas = (t: string, n = 3) => {
    const w = normalize(t).split(" ").filter(Boolean)
    return new Set(w.slice(0, Math.max(0, w.length - n + 1)).map((_, i) => w.slice(i, i + n).join(" ")))
  }
  const delAviso = new Set(
    [...(req.spec.responsibilities ?? []), ...[...(req.spec.mustHave ?? []), ...(req.spec.niceToHave ?? [])].map((r) => r.raw)].flatMap((t) => [...ngramas(t)]),
  )
  const skillsDelAviso = [...(req.spec.mustHave ?? []), ...(req.spec.niceToHave ?? [])].flatMap((r) => r.skill.split(/\s*\|\s*/))
  const deSkills = new Set([...nombresPermitidos, ...skillsDelAviso].flatMap((t) => [...ngramas(t)]))
  const yaEnCv = ngramas(cvTextOf(req.tree) + " " + (req.told ?? ""))
  const copiaDelAviso = (texto: string) =>
    [...ngramas(texto)].filter((g) => delAviso.has(g) && !deSkills.has(g) && !yaEnCv.has(g) && ![...nombresPermitidos, ...skillsDelAviso].some((t) => normalize(t).includes(g)))
  const respaldo = normalize([cvTextOf(req.tree), req.told ?? "", ...nombresPermitidos].join(" ")).split(" ")
  const sinRespaldo = (texto: string) =>
    [...new Set((texto.replace(/\[[^\]]+\]/g, " ").match(/(?<=\S\s+)[A-Z][A-Za-z0-9+.#/-]*|\b[A-Z]{2,}[A-Za-z0-9]*\b/g) ?? []).flatMap((x) => x.replace(/[.,;:]+$/, "").split(/[-/]/).filter((p) => /^[A-Z]/.test(p))))]
      // Por raíz: «REST» está respaldado por «RESTful».
      .filter((x) => x.length >= 2 && !normalize(x).split(" ").every((w) => respaldo.some((r) => mismaRaiz(r, w))))
  /**
   * EDICIÓN MÍNIMA, COMPROBADA: ninguna palabra con contenido de la línea se pierde
   * (por su raíz, así «tests» y «testing» son la misma) y lo nuevo es lo pedido
   * —herramientas, skills, lo que contó la persona— más a lo sumo 4 palabras de
   * unión. Lo demás es reescritura libre, que es lo que inventaba.
   */
  const raiz = (w: string) => w.slice(0, 5)
  const contenido = (t: string) => normalize(t.replace(/\[[^\]]+\]/g, " ")).split(" ").filter((w) => w.length >= 4)
  const pedidas = new Set(contenido([...nombresPermitidos, req.told ?? ""].join(" ")).map(raiz))
  /**
   * LA APERTURA DÉBIL SÍ SE CAMBIA: «Responsable del…», «Helped with…» le sacan la
   * autoría a la persona, y conservarla palabra por palabra dejaba la línea igual
   * de débil (medido en oficios). Esas primeras palabras pueden irse y entra el
   * verbo que dice lo que hizo.
   */
  const aperturaDebil = !isSummary && opensWeakly(original)
  const apertura = new Set(aperturaDebil ? contenido(original.split(/\s+/).slice(0, 3).join(" ")).map(raiz) : [])
  const edicion = (texto: string) => {
    const orig = new Set(contenido(original).map(raiz))
    const nueva = new Set(contenido(texto).map(raiz))
    const perdidas = contenido(original).filter((w) => !nueva.has(raiz(w)) && !apertura.has(raiz(w)))
    const libres = [...new Set(contenido(texto).filter((w) => !orig.has(raiz(w)) && !pedidas.has(raiz(w))))]
    return { perdidas: [...new Set(perdidas)], libres: aperturaDebil ? libres.slice(1) : libres }
  }
  /** Lo que la tarjeta pidió insertar y no está escrito: skills, herramientas, el hueco de la cifra. */
  const pedidoFaltante = (s: Suggestion): string[] => {
    const escritas = termsIn(buildTermIndex(terms.map((t) => ({ canonical: t, variants: titleForms(t) }))), s.text)
    return [
      ...terms.filter((t) => !escritas.has(t)),
      ...hechosFaltantes(s.text),
      ...(req.needsFigure && s.placeholders.length === 0 && !statesQuantity(s.text) ? ["[cifra]"] : []),
    ]
  }
  /**
   * LA IA ESCRIBE LA SKILL QUE PIDE LA VACANTE (CEO, 2026-09-30): no se inserta
   * un nombre con calzador, se escribe el trabajo hecho con ella —una cláusula—
   * y la persona confirma si es verdad. Por eso admite más palabras nuevas.
   */
  const topeLibres = req.propone ? 16 : req.logro ? 12 : 4
  const hayPedido = terms.length > 0 || (req.facts ?? []).length > 0 || Boolean(req.needsFigure) || Boolean(req.logro) || nueva
  const hechosFaltantes = (texto: string) => {
    const dice = new Set(normalize(texto).split(" "))
    return hechos.filter((h) => !h.w.some((x) => dice.has(x))).map((h) => h.f)
  }
  const pedido = JSON.stringify([req.reason ?? "", req.instruction ?? "", req.facts ?? [], terms, Boolean(req.needsFigure), req.told ?? "", Boolean(req.propone), Boolean(req.logro), nueva])
  const key = cacheKey.fix(req.nodeId, node.hash, req.jdKey, req.model, pedido)

  /** ¿Qué le falta a esta propuesta? Vacío si pasa los tres controles. */
  const problemas = (s: Suggestion): string[] => {
    const v = checkSuggestion(s, ctx)
    if (!v.ok) return [retryNudge(v, req.language)]
    const out: string[] = []
    // 2 · no se pierde ningún hecho: nombres propios y cifras (una cifra que
    // quedó precargada en su hueco no se perdió).
    const perdidos = isSummary ? [] : droppedNames(original, s.text)
    const precargadas = new Set(Object.values(figureSlots(original, s)).map((c) => c.replace(/^\$/, "")))
    const cifras = droppedFigures(original, s.text.replace(/\[[^\]]+\]/g, " ")).filter((c) => !precargadas.has(c))
    if (perdidos.length || cifras.length) {
      out.push(req.language === "en"
        ? `You dropped facts the line states: ${[...perdidos, ...cifras].join(", ")}. Keep them.`
        : `Soltaste hechos que la línea dice: ${[...perdidos, ...cifras].join(", ")}. Conservalos.`)
    }
    // 3 · no puede ser casi igual a la línea ni a otra del CV.
    const parecida = hayPedido && pedidoFaltante(s).length === 0 ? null : similarTo(s, ctx)
    if (parecida) {
      out.push(req.language === "en"
        ? `Your line says nearly the same as "${parecida}". Write what the ATS asked for.`
        : `Tu línea dice casi lo mismo que «${parecida}». Escribí lo que pidió el ATS.`)
    }
    // La apertura que el prompt prohíbe («Participé en…», «Helped with…»): le
    // saca la autoría a la persona y baja su nivel de participación.
    if (!isSummary && opensWeakly(s.text)) {
      out.push(req.language === "en" ? "Open with a past-tense action verb that says what the person did, not a duty formula." : "Abrí con un verbo de acción en pasado que diga lo que la persona hizo, no con una fórmula de tarea.")
    }
    // Lo que el ATS decidió: las skills y, si el puesto la pide, la cifra.
    const escritas = termsIn(buildTermIndex(terms.map((t) => ({ canonical: t, variants: titleForms(t) }))), s.text)
    const faltan = terms.filter((t) => !escritas.has(t))
    if (faltan.length) out.push(req.language === "en" ? `Write: ${faltan.join(", ")}.` : `Escribí: ${faltan.join(", ")}.`)
    const copiadas = isSummary ? [] : copiaDelAviso(s.text)
    if (copiadas.length) {
      out.push(req.language === "en" ? `You copied words from the posting: "${copiadas.join('", "')}". Say the person's work in their own terms; from the posting only skill names are written.` : `Copiaste palabras del aviso: «${copiadas.join("», «")}». Decí el trabajo de la persona con sus términos; del aviso sólo se escriben nombres de skills.`)
    }
    const inventados = isSummary ? [] : sinRespaldo(s.text)
    if (inventados.length) {
      out.push(req.language === "en" ? `These names are not in the CV: ${inventados.join(", ")}. Remove them.` : `Estos nombres no están en el CV: ${inventados.join(", ")}. Sacalos.`)
    }
    if (!isSummary) {
      const { perdidas, libres } = nueva ? { perdidas: [], libres: [] } : edicion(s.text)
      if (perdidas.length) out.push(req.language === "en" ? `You removed words from the line: ${perdidas.join(", ")}. Keep the line word for word.` : `Sacaste palabras de la línea: ${perdidas.join(", ")}. Conservá la línea palabra por palabra.`)
      if (libres.length > topeLibres) out.push(req.language === "en" ? `You added words nobody asked for: ${libres.join(", ")}. Insert only what was given.` : `Agregaste palabras que nadie pidió: ${libres.join(", ")}. Insertá sólo lo pedido.`)
    }
    // Un hueco suelto («… stock counts [n]») no dice qué se cuenta: lleva su unidad adentro o la palabra al lado.
    // Un porcentaje va con su conector («by [x%]», «en un [x%]»): pegado a un sustantivo no se lee.
    const conector = /(?:\b(?:by|of|to|from|about|around|over|up to|en un|en una|de un|de una|un|una|del|de|en|hasta|por)|%|\d)\s*$/i
    // Al final de la frase o después de una coma, el hueco sólo se lee con su conector delante («by [x%].»).
    const sueltos = s.placeholders
      .map((p) => p.token)
      .filter((tk) => {
        const i = s.text.indexOf(tk)
        if (i < 0) return false
        const antes = s.text.slice(0, i).trimEnd()
        const despues = s.text.slice(i + tk.length).trim()
        const alFinal = /^[.;]?$/.test(despues) || antes.endsWith(",")
        return alFinal && !conector.test(antes)
      })
    if (sueltos.length) {
      out.push(req.language === "en" ? `The slot ${sueltos.join(", ")} is left hanging at the end: put the unit inside it ([n pallets/day], [x%]) or next to what it counts.` : `El hueco ${sueltos.join(", ")} quedó suelto al final: poné la unidad adentro ([n piezas/día], [x%]) o junto a lo que cuenta.`)
    }
    const pegados = s.placeholders
      .map((p) => p.token)
      .filter((tk) => /%/.test(tk) && s.text.includes(tk) && !conector.test(s.text.slice(0, s.text.indexOf(tk)).trimEnd()))
    if (pegados.length) {
      out.push(req.language === "en" ? `The slot ${pegados.join(", ")} is glued to a noun: write it with its connector ("reducing crashes by [x%]").` : `El hueco ${pegados.join(", ")} quedó pegado a un sustantivo: escribilo con su conector («reduciendo errores en un [x%]»).`)
    }
    // Una frase que el original no repetía y la nueva repite («reduce latency… and reduce latency»).
    const tri = (t: string) => {
      // Por raíz: «reduce latency» y «reducing latency» son la misma frase.
      const w = normalize(t.replace(/\[[^\]]+\]/g, " ")).split(" ").filter((x) => x.length >= 4).map((x) => x.slice(0, 5))
      return w.slice(0, Math.max(0, w.length - 1)).map((_, k) => w.slice(k, k + 2).join(" "))
    }
    const vecesOrig = new Map<string, number>()
    for (const g of tri(original)) vecesOrig.set(g, (vecesOrig.get(g) ?? 0) + 1)
    const vecesNueva = new Map<string, number>()
    for (const g of tri(s.text)) vecesNueva.set(g, (vecesNueva.get(g) ?? 0) + 1)
    const repetidas = [...vecesNueva].filter(([g, n]) => n > 1 && n > (vecesOrig.get(g) ?? 0)).map(([g]) => g)
    if (repetidas.length) {
      out.push(req.language === "en" ? `You repeated "${repetidas.join('", "')}". Say it once.` : `Repetiste «${repetidas.join("», «")}». Decilo una vez.`)
    }
    // «Controlé del control…»: la misma raíz dos veces a una o dos palabras, que el original no tenía.
    const pegadas = (t: string) => {
      const w = normalize(t.replace(/\[[^\]]+\]/g, " ")).split(" ").filter(Boolean)
      const out = new Set<string>()
      w.forEach((x, i) => {
        if (x.length < 5) return
        for (const y of w.slice(i + 1, i + 3)) if (y.length >= 5 && y.slice(0, 5) === x.slice(0, 5)) out.add(x.slice(0, 5))
      })
      return out
    }
    const yaPegadas = pegadas(original)
    const nuevasPegadas = [...pegadas(s.text)].filter((r) => !yaPegadas.has(r))
    if (!isSummary && nuevasPegadas.length) {
      out.push(req.language === "en" ? "The same word is repeated right next to itself. Rewrite that part as one clean phrase." : "Repetiste la misma palabra una al lado de la otra. Escribí esa parte como una sola frase limpia.")
    }
    const sinEscribir = hechosFaltantes(s.text)
    if (sinEscribir.length) {
      out.push(req.language === "en" ? `These facts are missing from your line: ${sinEscribir.join("; ")}. Write them.` : `Estos hechos no están en tu línea: ${sinEscribir.join("; ")}. Escribilos.`)
    }
    if (req.needsFigure && s.placeholders.length === 0 && !statesQuantity(s.text)) {
      out.push(req.language === "en" ? "This line carries its figure: add its typed slot." : "Esta línea lleva su cifra: agregá su hueco tipado.")
    }
    return out
  }

  // Lo guardado pasa por los mismos controles: un control nuevo vale también para lo ya guardado.
  const guardada = (await req.store.read("ats3-fix", key)) as Suggestion | null
  const cached = guardada ? repairSuggestion(guardada) : null
  if (cached && cached.changed && problemas(cached).length === 0) {
    return { ok: true, suggestion: anchor(cached, node.hash, node.text), served: true, calls: 0 }
  }

  const ask = (nudge?: string) =>
    isSummary
      ? req.ai.rewriteSummary({
          current: original,
          focus: req.reason,
          mustWrite: terms,
          yearsOfExperience: Math.floor(experienceYears(req.tree)) || null,
          cvLines: req.tree.roles.flatMap((r) => r.bullets.map((b) => b.text)),
          otherSections: req.tree.otherText,
          spec: req.spec,
          topBullets: topBulletsOf(req.tree),
          provenTerms: provenTermsOf(req.tree, req.spec),
          declaredSkills: req.tree.declaredSkills,
          nudge,
        })
      : req.ai.rewriteBullet({
          original,
          bulletId: req.nodeId,
          roleContext: role ? `${role.title} — ${role.company}` : "",
          roleLines: role?.bullets.filter((b) => b.id !== req.nodeId).map((b) => b.text),
          siblings,
          reason: req.reason,
          instruction: req.instruction,
          facts: req.facts,
          terms,
          needsFigure: req.needsFigure,
          told: req.told?.trim() || undefined,
          propone: req.propone,
          logro: req.logro,
          nueva,
          language: req.language,
          nudge,
        })

  // La tercera persona regular se corrige, no se rechaza («Atendió» → «Atendí»).
  const preparar = (s: Suggestion): Suggestion => {
    const enPrimera = req.language !== "en" && !isSummary ? toFirstPerson(s.text) : null
    return repairSuggestion(enPrimera ? { ...s, text: enPrimera } : s)
  }

  let calls = 1
  let first = await ask()
  // Una skill pedida no se abandona al primer «no puedo»: se pide una vez más.
  if (!first.changed && req.propone && !isSummary) {
    first = await ask(req.language === "en" ? `Write it: the person asked the AI to write ${terms.join(", ")} into this line and will confirm whether it is true. Write the work done with it, fitting what this line already does.` : `Escribilo: la persona le pidió a la IA escribir ${terms.join(", ")} en esta línea y va a confirmar si es verdad. Escribí el trabajo hecho con eso, acorde a lo que la línea ya hace.`)
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

  // Si sigue siendo la misma línea, no hay mejora: se dice, no se ofrece. Salvo que
  // escriba la herramienta que el ATS declaró: una palabra, pero es un hecho nuevo.
  // Lo que la tarjeta pidió y no se escribió: no es «ya está bien», es no poder hacerlo.
  if (!isSummary && hayPedido && pedidoFaltante(first).length > 0) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: pedidoFaltante(first).join(", ") }, calls }
  }
  const parecida = hayPedido ? null : similarTo(first, ctx)
  if (parecida === original) return { ok: false, alreadyGood: true, calls }
  if (parecida) return { ok: false, verdict: { ok: false, reason: "declined", detail: parecida }, calls }
  const v = checkSuggestion(first, ctx)
  if (!v.ok) return { ok: false, verdict: v, calls }
  // Una palabra repetida pegada a sí misma que sobrevivió al reintento: español o inglés roto, no se ofrece.
  if (!isSummary && problemas(first).some((p) => /Repetiste la misma palabra|same word is repeated/.test(p))) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: "palabra repetida" }, calls }
  }
  // Relleno del aviso, un nombre sin respaldo o una reescritura libre que sobrevivió al reintento: no se ofrece.
  const ed = isSummary || nueva ? { perdidas: [], libres: [] } : edicion(first.text)
  if (ed.perdidas.length > 0 || ed.libres.length > topeLibres) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: [...ed.perdidas, ...ed.libres].join(", ") }, calls }
  }
  if (!isSummary && (copiaDelAviso(first.text).length > 0 || sinRespaldo(first.text).length > 0)) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: [...copiaDelAviso(first.text), ...sinRespaldo(first.text)].join(", ") }, calls }
  }
  // El ATS pidió reescribir para decir hechos nuevos: si no dice ninguno, no aporta.
  if (hechos.length > 0 && hechosFaltantes(first.text).length === hechos.length) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: hechos.map((h) => h.f).join("; ") }, calls }
  }
  if (!isSummary && droppedNames(original, first.text).length > 0) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: droppedNames(original, first.text).join(", ") }, calls }
  }

  /**
   * «NO TENGO ESE DATO» DEJA TU LÍNEA COMO ESTÁ si la versión sin cifra trae un
   * número que tu línea no dice (lo decidió el modelo) o no agrega nada.
   */
  const cifrasDe = (x: string) => new Set(x.match(/\d+(?:[.,]\d+)?/g) ?? [])
  const delOriginal = cifrasDe(original)
  const variante = first.variantWithoutMetric
  if (
    first.placeholders.length > 0 &&
    (!variante || [...cifrasDe(variante)].some((n) => !delOriginal.has(n)) || addsNothing(original, variante, ctx.known))
  ) {
    first = { ...first, variantWithoutMetric: original }
  }

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
  const pedidos = [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])].map((r) => index.byKey.get(termKey(r.skill)) ?? r.skill)
  return [...new Set(pedidos.filter((t) => escritos.has(t)))].filter((t) => normalize(t))
}
