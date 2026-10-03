// lib/ats3/rewrite.ts
//
// TAILOR: ejecuta la decisión del ATS sobre UNA línea (CEO, 2026-09-29).
//
// Recibe lo que el ATS dijo de esa línea —por qué, qué tiene que decir, qué
// skills escribir, si lleva cifra— y lo que la persona contó. Una llamada, los
// tres controles de `guards.ts`, y como mucho un reintento que dice qué falló.

import { buildTermIndex, mismaRaiz, normalize, rolDeNueva, specTerms, termKey, termsIn, type AnchoredSuggestion, type JobSpec, type NodeId, type ResumeTree, type Suggestion } from "@/lib/ats3/contracts"
import { checkSuggestion, droppedFigures, droppedNames, figureSlots, findNode, repairSuggestion, retryNudge, similarTo, toFirstPerson, addsNothing, type GuardVerdict } from "@/lib/ats3/guards"
import { cvTextOf, experienceYears, statesQuantity, termsOf, titleForms } from "@/lib/ats3/score"
import { type AtsAi, type AtsStore, cacheKey } from "@/lib/ats3/ports"
import { opensWeakly, weakOpenerWords } from "@/lib/services/ai/shared/empty-phrasing"

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
  const apertura = new Set(aperturaDebil ? contenido(weakOpenerWords(original).join(" ")).map(raiz) : [])
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
  /**
   * CADA PUESTO HABLA DE SU EMPRESA (2026-10-02). Medido en producción: con el
   * dato «En Salamanca Solutions construí aplicaciones web…» y el selector en el
   * primer puesto, Tailor escribió el trabajo de Salamanca dentro de la línea de
   * IA Interactive. Nada lo frenaba: la empresa está en el CV, así que tenía
   * «respaldo». Una línea que nombra la empresa de OTRO puesto le asigna ese
   * trabajo a un empleador que no lo hizo.
   */
  const otrasEmpresas = isSummary
    ? []
    : [...new Set(req.tree.roles.filter((r) => r !== role).map((r) => r.company.trim()).filter((c) => normalize(c).length >= 3 && normalize(c) !== normalize(role?.company ?? "")))]
  const nombraOtraEmpresa = (texto: string) => {
    const t = ` ${normalize(texto)} `
    return otrasEmpresas.filter((c) => t.includes(` ${normalize(c)} `))
  }
  /**
   * UNA CIFRA QUE LA PERSONA NO DIO PARA ESTA LÍNEA VA COMO HUECO (2026-10-02).
   * Medido en producción: la propuesta para Rappi decía «para 50 usuarios», el
   * número de otro puesto. Un número que no está en la línea, ni en lo que contó
   * la persona, ni en el nombre de lo que el ATS mandó escribir lo decidió el
   * modelo, y eso es lo único prohibido sobre las cifras.
   */
  const cifrasPermitidas = new Set([original, req.told ?? "", ...nombresPermitidos].flatMap((t) => [...t.matchAll(/\d[\d.,]*/g)].map((m) => m[0].replace(/\D/g, ""))))
  const cifrasNuevas = (texto: string) =>
    isSummary
      ? []
      : [...new Set([...texto.replace(/\[[^\]]+\]/g, " ").matchAll(/\d[\d.,]*\s*%?/g)].map((m) => m[0].trim()).filter((c) => {
          const d = c.replace(/\D/g, "")
          return d && !cifrasPermitidas.has(d) && !/^(19|20)\d{2}$/.test(d)
        }))]
  /** Oraciones del resumen en inglés que abren hablando de la persona en tercera («Holds a…», «Has worked…»). */
  const terceraEn = (texto: string) =>
    isSummary && req.language === "en"
      ? texto.split(/(?<=[.!?])\s+/).filter((o) => /^(?:[A-Z][a-z]+s)\s+(?:a|an|the|over|more|strong|deep|solid|extensive|worked|built|led|been|developed|delivered|shipped|experience)\b/.test(o.trim()))
      : []
  const pedido = JSON.stringify([req.reason ?? "", req.instruction ?? "", req.facts ?? [], terms, Boolean(req.needsFigure), req.told ?? "", Boolean(req.propone), Boolean(req.logro), nueva])
  const key = cacheKey.fix(req.nodeId, node.hash, req.jdKey, req.model, pedido)

  /**
   * LO QUE EL RESUMEN YA PROBABA DEL AVISO NO SE SUELTA (2026-09-30). Medido en
   * producción: la reescritura del cargo borró «Claude Code», que el aviso de
   * Sezzle exige, y nada la frenaba porque el resumen estaba exento. Exigirle
   * TODOS los nombres propios lo dejó sin poder acortar (medido: dos veces
   * declinado); lo que no puede perder es un requisito de la vacante que ya decía.
   */
  const indiceAviso = buildTermIndex(specTerms(req.spec))
  const yaProbaba = isSummary ? termsIn(indiceAviso, original) : new Set<string>()
  // Cada requisito que ya probaba, con la forma en que el resumen lo escribe («Swift», no «Objective-C | Swift»).
  const conservarEnResumen = [...yaProbaba].map((t) => t.split(/\s*\|\s*/).find((o) => termsIn(buildTermIndex([{ canonical: o, variants: titleForms(o) }]), original).size > 0) ?? t)
  const requisitosPerdidos = (texto: string) => {
    const dice = termsIn(indiceAviso, texto)
    return [...yaProbaba].filter((t) => !dice.has(t))
  }

  /** ¿Qué le falta a esta propuesta? Vacío si pasa los tres controles. */
  const problemas = (s: Suggestion): string[] => {
    const v = checkSuggestion(s, ctx)
    if (!v.ok) return [retryNudge(v, req.language)]
    const out: string[] = []
    // 2 · no se pierde ningún hecho: nombres propios y cifras (una cifra que
    // quedó precargada en su hueco no se perdió).
    const perdidos = isSummary ? requisitosPerdidos(s.text) : droppedNames(original, s.text)
    const precargadas = new Set(Object.values(figureSlots(original, s)).map((c) => c.replace(/^\$/, "")))
    const cifras = droppedFigures(original, s.text.replace(/\[[^\]]+\]/g, " ")).filter((c) => !precargadas.has(c))
    if (perdidos.length || cifras.length) {
      out.push(req.language === "en"
        ? `You dropped facts the line states: ${[...perdidos, ...cifras].join(", ")}. Keep them.`
        : `Soltaste hechos que la línea dice: ${[...perdidos, ...cifras].join(", ")}. Conservalos.`)
    }
    /**
     * EL RESUMEN EN INGLÉS NO HABLA DE LA PERSONA EN TERCERA (2026-10-02). Medido
     * contra la API con Sezzle: «Holds a Systems Engineering degree and has worked
     * on…». `wrongPerson` sólo cubre el español; en inglés lo que se puede probar
     * es una oración que ABRE con un verbo en tercera persona seguido de su
     * complemento («Holds a», «Has worked», «Brings over») — un sustantivo plural
     * («Systems engineer…») no lleva esa continuación.
     */
    const enTercera = terceraEn(s.text)
    if (enTercera.length) {
      out.push(`These sentences speak of the person in the third person: ${enTercera.map((o) => `"${o.split(/\s+/).slice(0, 4).join(" ")}…"`).join(", ")}. Write them as a noun phrase or as the work itself.`)
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
    const ajenas = nombraOtraEmpresa(s.text)
    if (ajenas.length) {
      out.push(req.language === "en" ? `This line belongs to ${role?.company ?? "this role"}; do not name ${ajenas.join(", ")}, that is another role.` : `Esta línea es de ${role?.company ?? "este puesto"}: no nombres ${ajenas.join(", ")}, que es otro puesto.`)
    }
    const nuevasCifras = cifrasNuevas(s.text)
    if (nuevasCifras.length) {
      out.push(req.language === "en" ? `The person did not give these figures for this line: ${nuevasCifras.join(", ")}. Remove them or write a typed slot ([x%], [n users]).` : `La persona no dio estas cifras para esta línea: ${nuevasCifras.join(", ")}. Sacalas o escribí un hueco tipado ([x%], [n usuarios]).`)
    }
    /**
     * EL LOGRO SE ESCRIBE, NO SÓLO SU HUECO (2026-10-02). Medido en producción: la
     * tarjeta X-Y-Z devolvía la misma línea con «en [x%]» pegado al final —una
     * consulta gastada en un corchete—. Lo que la tarjeta promete es decir qué se
     * logró; si no hay ninguna palabra nueva fuera del hueco, no lo dijo.
     */
    if (req.logro && !isSummary && !nueva && edicion(s.text).libres.length === 0) {
      out.push(req.language === "en" ? "Write the outcome this work achieved, not only its slot." : "Escribí el logro que consiguió ese trabajo, no sólo su hueco.")
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
    /**
     * Y LA PALABRA NUEVA QUE VUELVE MÁS ADELANTE (2026-10-02). Medido en producción:
     * «…mediante arquitecturas escalables con Clean Architecture, modularizando la
     * app para que escale». Una raíz que la línea no tenía y aparece dos veces es
     * la misma idea dicha dos veces, aunque no estén pegadas.
     */
    const raicesNuevas = (t: string) => normalize(t.replace(/\[[^\]]+\]/g, " ")).split(" ").filter((x) => x.length >= 5).map((x) => x.slice(0, 5))
    const delOriginal = new Set(raicesNuevas(original))
    const cuenta = new Map<string, number>()
    for (const r of raicesNuevas(s.text)) if (!delOriginal.has(r)) cuenta.set(r, (cuenta.get(r) ?? 0) + 1)
    const nuevasPegadas = [...new Set([...[...pegadas(s.text)].filter((r) => !yaPegadas.has(r)), ...[...cuenta].filter(([, n]) => n > 1).map(([r]) => r)])]
    if (!isSummary && nuevasPegadas.length) {
      out.push(req.language === "en" ? "The same word is repeated in your line. Say that idea once, as one clean phrase." : "Repetiste la misma palabra en la línea. Decí esa idea una vez, como una sola frase limpia.")
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

  // La tercera persona regular se corrige, no se rechaza («Atendió» → «Atendí»).
  const preparar = (s: Suggestion): Suggestion => {
    const enPrimera = req.language !== "en" && !isSummary ? toFirstPerson(s.text) : null
    // «A | B» es la forma del motor para un requisito con alternativas: en una frase del CV
    // nunca va la barra (medido: «JavaScript | TypeScript» en un resumen). Se lee como «A / B».
    s = { ...s, text: s.text.replace(/\s*\|\s*/g, " / ") }
    // El resumen es UN párrafo: llegaba partido en renglones, uno por oración (visto en local).
    // Y sin datos sueltos: «Español nativo.» como oración. El prompt lo prohíbe y salía
    // igual, también en el reintento; sacarla no borra nada —el dato vive en su sección—.
    const texto = isSummary
      ? s.text.replace(/\s*\n+\s*/g, " ").split(/(?<=[.!?])\s+/).filter((o) => !/^\p{Lu}/u.test(o.trim()) || o.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean).length > 2).join(" ").trim()
      : enPrimera ?? s.text
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
          // Lo que el resumen ya probaba del aviso viaja como término a conservar: el control
          // lo exigía y el modelo nunca lo recibía (medido: «Swift» soltado en 1 de 4, y declinado).
          mustWrite: [...new Set([...terms, ...conservarEnResumen])],
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

  // La oración en tercera que sobrevivió al reintento se saca, si el resumen sigue
  // teniendo de qué hablar: el dato que decía vive en su sección (título, idioma).
  if (terceraEn(first.text).length > 0) {
    const quedan = first.text.split(/(?<=[.!?])\s+/).filter((o) => !terceraEn(o).length)
    if (quedan.length >= 2) first = { ...first, text: quedan.join(" ") }
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
  // El trabajo de otro empleador o una cifra que nadie dio, si sobrevivieron al reintento: no se ofrece.
  if (nombraOtraEmpresa(first.text).length > 0 || cifrasNuevas(first.text).length > 0) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: [...nombraOtraEmpresa(first.text), ...cifrasNuevas(first.text)].join(", ") }, calls }
  }
  // La tarjeta pedía el logro y volvió sólo el hueco: no hay nada que ofrecer.
  if (req.logro && !isSummary && !nueva && edicion(first.text).libres.length === 0) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: "sólo el hueco" }, calls }
  }
  // El ATS pidió reescribir para decir hechos nuevos: si no dice ninguno, no aporta.
  if (hechos.length > 0 && hechosFaltantes(first.text).length === hechos.length) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: hechos.map((h) => h.f).join("; ") }, calls }
  }
  const soltados = isSummary ? requisitosPerdidos(first.text) : droppedNames(original, first.text)
  if (soltados.length > 0) {
    return { ok: false, verdict: { ok: false, reason: "declined", detail: soltados.join(", ") }, calls }
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
