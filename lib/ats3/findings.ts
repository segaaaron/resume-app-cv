// lib/ats3/findings.ts
//
// LOS HALLAZGOS DETERMINISTAS Y EL PLAN DE HABILIDADES. Los decide el código a
// partir de la auditoría y del puntaje; ninguno sale de un modelo.

import { MAL_ESCRITO, SIN_RESPALDO, TERMS_PER_BULLET, detailParts, encodeDetail, findingId, nodeHash, normalize, termsIn, type Finding, type FindingType, type JobSpec, type NodeId, type ResumeTree, type TermIndex } from "@/lib/ats3/contracts"
import { namedCliches } from "@/lib/services/ai/shared/cliches"
import { isEmptyPhrasing } from "@/lib/services/ai/shared/empty-phrasing"
import { BULLETS_PER_ROLE_MAX, SKILLS_MAX } from "@/lib/ats3/ledger"
import { findNode } from "@/lib/ats3/guards"
import { coverageOf, experienceYears, gainOf, softCoverageOf, statesQuantity, titleWritten, type AuditFacts, type ComponentKey, type Score } from "@/lib/ats3/score"

// ─────────────────────────────────────────────────────────────────────────────
// LOS HALLAZGOS DETERMINISTAS
//
// Los emite el código, no el modelo, y cada uno trae su ganancia calculada por
// `score.ts`. Un hallazgo sin ganancia medida es una opinión.
// ─────────────────────────────────────────────────────────────────────────────

export function findingsOf(
  tree: ResumeTree,
  audit: AuditFacts,
  score: Score,
  index: TermIndex,
  /**
   * LA VACANTE. Hace falta para el cargo: es lo único que ella dice y el CV no.
   *
   * Opcional para no romper a quien ya la llama sin ella; sin vacante el
   * hallazgo del cargo no se emite, que es lo correcto —no hay contra qué
   * compararlo—.
   */
  spec?: JobSpec,
  /**
   * Las líneas que Tailor escribió y la persona aceptó. Su cifra ya se pidió:
   * si quedó sin número —el modelo no dio el hueco, o la persona apretó «no
   * tengo ese dato»— volver a pedirla sobre esa misma línea es el bucle que
   * este motor existe para no tener (medido el 2026-09-28 con el CV del CEO).
   */
  cifraYaPedida?: ReadonlySet<NodeId>,
): Finding[] {
  const out: Finding[] = []
  /**
   * `component` no es un dato extra: es DE DÓNDE sale `gain`, dicho en la misma
   * llamada donde se lo pide. Así la pantalla puede agrupar por la medición en
   * vez de inventarse un mapa paralelo que se separa de ella.
   */
  const push = (
    type: FindingType,
    component: ComponentKey,
    nodeId: NodeId,
    text: string,
    gain: number,
    detail: string,
    /** Cómo se cierra. El que llega primero también decide esto. */
    remedy: Finding["remedy"] = "rewrite",
    /**
     * DE QUÉ HABLA ESTE HALLAZGO, cuando no habla de la línea.
     *
     * "Una línea, una tarjeta" vale para lo que se dice DE LA LÍNEA: verbo,
     * resultado, cifra, apertura. Dos hallazgos así sobre la misma viñeta son
     * el panel contradiciéndose, y por eso se fusionan.
     *
     * Pero "este término no está en Habilidades" no habla de la línea: habla
     * del TÉRMINO, y su remedio es agregarlo. Fusionarlo con la tarjeta de la
     * línea se comía el remedio —el botón volvía a ser "reescribir"— y con dos
     * términos sobre la misma viñeta habría agregado a Habilidades la
     * concatenación de los dos, que no es una habilidad de nadie.
     *
     * ── LA VARA, Y VALE PARA TODO LO QUE EL MOTOR ENTREGA (CEO, 2026-09-09) ───
     *
     * Lleva sujeto SÓLO el hallazgo cuyo remedio NO toca el texto de la línea.
     * Hoy NO lo lleva ninguno: el único que escribía fuera de la línea era
     * `skill_not_listed`, y su pregunta la contesta ahora `skillPlan`. El campo
     * se queda porque la regla sigue valiendo el día que aparezca otro.
     *
     * Todo lo que se cierra REESCRIBIENDO la línea comparte tarjeta, porque es
     * la misma reescritura: el eje que falta, la cifra, el término enterrado y
     * la blanda sin demostrar. Con tarjetas separadas la misma viñeta recibía
     * dos órdenes a la vez y el usuario veía el panel contradecirse sobre una
     * línea que él acababa de construir — reportado con captura.
     */
    subject?: string,
  ) => {
    // UNA LÍNEA, UNA TARJETA. La garantía vive acá y no en la memoria de quien
    // escriba el emisor siguiente: cuando se cumplía a mano, se olvidaba.
    //
    // Y EL QUE LLEGA SEGUNDO NO SE TIRA. Descartarlo silencia a un emisor
    // entero: los requisitos que faltan aterrizan casi siempre sobre líneas que
    // YA tienen tarjeta, así que tirarlos borraría el hallazgo más valioso del
    // panel. Su consejo se FUSIONA en la tarjeta que ya existe, y la ganancia se
    // suma porque cerrar las dos cosas mueve las dos componentes.
    /**
     * UNA LÍNEA, UNA TARJETA — y su sección la da el hallazgo que MÁS pesa.
     *
     * Partir por sección se probó y da tres tarjetas sobre la misma viñeta: el
     * eje que le falta, el requisito de la vacante y la blanda. Las tres se
     * cierran con LA MISMA reescritura, así que serían tres botones para un solo
     * acto — el panel contradiciéndose, que es lo que esto existe para no tener.
     *
     * El cruce que el CEO reportó se cierra por el otro lado: con `soft` como
     * componente propio, una línea cuyo ÚNICO hallazgo es la blanda abre su
     * tarjeta en la sección de blandas. Cuando comparte línea con algo que sí
     * puntúa, manda lo que mueve el número — y eso es correcto: el usuario
     * necesita ver primero lo que le cambia el puntaje.
     */
    // Un hallazgo con sujeto es DEL TÉRMINO: su identidad no puede depender de
    // la línea que se sugirió para escribirlo, que cambia al editar el CV.
    const claveDe = (id: NodeId, sujeto?: string) => (sujeto ? `term:${normalize(sujeto)}` : id)
    const clave = claveDe(nodeId, subject)
    const existing = out.find((f) => claveDe(f.nodeId, f.subject) === clave)
    if (existing) {
      /**
       * MANDA EL QUE MÁS PESA, NO EL QUE LLEGÓ PRIMERO.
       *
       * ── EL DEFECTO QUE ESTO CIERRA ──────────────────────────────────────────
       * El primero fijaba el título y el componente, y el orden del archivo es
       * un accidente: los ejes de la viñeta se emiten antes que los requisitos,
       * así que un requisito de la vacante —el hallazgo más valioso del panel—
       * caía dentro de «no dice qué cambió» y perdía las dos cosas que lo hacen
       * accionable: su título y su sección. Por esquivar eso se le había dado
       * sujeto propio, y con sujeto abre OTRA tarjeta sobre la misma línea: dos
       * tarjetas para una sola reescritura, que es lo que el CEO reportó.
       *
       * La tarjeta es de la LÍNEA, así que su nombre y su sección tienen que ser
       * los de lo que más mueve el número. Determinista: mismos insumos, mismo
       * ganador, misma pantalla.
       *
       * El `id` NO cambia: lo fija el primero y con él empareja `loyalty`. Si el
       * id se moviera, cerrar el hallazgo hoy y volver mañana no encontraría la
       * anotación, y el motor volvería a señalar lo ya resuelto.
       */
      // Cada pieza viaja con el tipo que la dijo (`encodeDetail`): sin eso la
      // tarjeta contaba el eje «método» como un requisito de la vacante.
      const previas = detailParts(existing)
      const nueva = { type, detail }
      if (gain > existing.gain) {
        existing.type = type
        existing.component = component
        existing.remedy = remedy
        existing.detail = encodeDetail([nueva, ...previas])
      } else {
        existing.detail = encodeDetail([...previas, nueva])
      }
      existing.gain += gain
      if (!existing.merged.includes(type)) existing.merged.push(type)
      return
    }
    // El que llega primero da el título Y el componente: es el que la tarjeta
    // nombra, así que es el que tiene que decidir bajo qué número se lee.
    out.push({ id: findingId(clave, type), type, component, remedy, subject, merged: [type], nodeId, nodeText: text, nodeHash: nodeHash(text), gain, detail })
  }


  const byId = new Map(audit.bullets.map((b) => [b.id, b]))
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const facts = byId.get(b.id)
      /**
       * UNA VIÑETA QUE LA AUDITORÍA NO DEVOLVIÓ NO RECIBE HALLAZGO, Y ES CALLADO.
       *
       * P2 juzga el documento entero en una llamada; si omite una línea, acá no
       * hay con qué decidir y se sigue de largo. El puntaje no se descuadra
       * —`score` filtra por los ids que el CV tiene de verdad, así que esa línea
       * sale del numerador Y del denominador— pero el usuario lee que está bien
       * cuando en realidad nadie la miró.
       *
       * Se deja así a propósito: rellenar los ejes que faltan sería fabricar un
       * juicio sobre una línea que el modelo no leyó, que es peor que callarse.
       * Pedirle la diferencia cuesta una llamada más por análisis y decirlo en
       * pantalla es una decisión de producto — las dos exceden lo que este
       * archivo puede decidir solo. Queda escrito para que el próximo no lo
       * descubra tarde ni lo tape con un valor por defecto.
       */
      if (!facts) continue
      if (!facts.hasResult || !facts.hasMethod || !facts.hasActionVerb) {
        push("no_result", "xyz", b.id, b.text, gainOf(score, "xyz"), missingParts(facts))
      }
      /**
       * LA CIFRA VA EN LA MISMA TARJETA QUE LOS EJES (2026-09-28, medido con el
       * CV del CEO contra BairesDev). Un `continue` acá callaba la cifra mientras
       * faltara un eje: Tailor cerraba el resultado y el análisis siguiente pedía
       * el tamaño SOBRE LA LÍNEA RECIÉN ARREGLADA — dos vueltas para una línea,
       * leídas como el ATS desdiciéndose. Todo lo que le falta se pide junto.
       */
      if (!statesQuantity(b.text) && !cifraYaPedida?.has(b.id)) {
        // Un token, como los ejes de la viñeta: el motor no escribe prosa. Salía
        // «el logro admite un tamaño…» en castellano sobre una pantalla en inglés.
        push("no_metric", "metric", b.id, b.text, gainOf(score, "metric"), "tamaño")
      }
    }
  }


  // Lo que la vacante exige y el CV no demuestra. Es la palanca más grande del
  // puntaje, y en el motor viejo vivía fuera del ejecutor, como filas de tabla.
  //
  // La cobertura se deriva del CV que se está mirando —la misma que puntúa—,
  // no de la foto que trajo la auditoría: una tarjeta no puede pedir un término
  // que el puntaje ya cuenta.
  const cobertura = spec ? coverageOf(spec, audit, tree, index) : audit.coverage
  /**
   * CUÁNTOS TÉRMINOS DE LA VACANTE LLEVA YA CADA VIÑETA (CEO, 2026-09-28).
   *
   * Todo requisito sin sujeto se fusiona en la tarjeta de su línea, y la
   * reescritura tiene que escribirlos todos. Medido en producción: una viñeta
   * de Rappi recibió siete —«…for AI/ML, automation pipelines, Kanban, agentic
   * AI workflows, CallKit, PushKit, and messaging»—. Una línea sostiene uno o
   * dos términos con sentido; el resto va a otra línea o a su nota.
   */
  const terminosPorLinea = new Map<NodeId, number>()
  const anotar = (id: NodeId) => terminosPorLinea.set(id, (terminosPorLinea.get(id) ?? 0) + 1)
  const llenas = () => new Set([...terminosPorLinea].filter(([, n]) => n >= TERMS_PER_BULLET).map(([id]) => id))
  for (const c of cobertura) {
    if (c.status === "FOUND") continue
    const key = c.requirement === "MUST" ? "must" : "nice"
    /**
     * EL REMEDIO SALE DE LA EVIDENCIA, NO DE UNA COSTUMBRE (2026-09-24).
     *
     * `IMPLIED` — el trabajo está en una línea que el modelo CITÓ y el CV sólo
     * no lo nombra. Se escribe el término ahí, que es donde la evidencia vive:
     * la reescritura nombra lo que la línea ya demuestra.
     *
     * `NOT_FOUND` — no hay rastro: nota sin botón, ver abajo.
     */
    // Implícito sin línea: el CV lo tiene con otro nombre en una sección que no
    // es una viñeta. `skillPlan` escribe el nombre del aviso; no hay línea que
    // reescribir ni nada que informar como faltante.
    if (c.status === "IMPLIED" && !c.evidenceNodeId) continue
    if (c.status === "IMPLIED" && c.evidenceNodeId) {
      /**
       * UNA LÍNEA LLENA NO RECIBE UN TÉRMINO MÁS. El requisito ya está demostrado
       * ahí —P2 lo citó— y `skillPlan` lo suma a Habilidades, donde el filtro lo
       * lee: no hace falta una tarjeta que amontone un tercer término.
       */
      if (llenas().has(c.evidenceNodeId)) continue
      anotar(c.evidenceNodeId)
      push("missing_requirement", key, c.evidenceNodeId, textOf(tree, c.evidenceNodeId), gainOf(score, key), c.skill, "rewrite")
      continue
    }
    /**
     * UNA CREDENCIAL NO SE REDACTA EN UNA VIÑETA.
     *
     * Una licencia, un título o un idioma se TIENE, no se ejerce: preguntar
     * «¿qué hiciste con Licencia de conducir B?» y ofrecer una línea de
     * experiencia es un sinsentido (medido en local el 2026-09-24). Si la
     * persona la tiene, va en su sección del CV — sin botón de IA.
     */
    const credencial = [...(spec?.mustHave ?? []), ...(spec?.niceToHave ?? [])].some(
      (r) => normalize(r.skill) === normalize(c.skill) && r.kind === "credential",
    )
    /**
     * SIN RASTRO EN EL CV, NO SE ESCRIBE (CEO, 2026-09-28 — «no quiero errores
     * de información»). Quién decide si una línea sostiene un requisito es P2,
     * que lee el trabajo descrito: IMPLIED con la línea citada, y su regla 3
     * prohíbe el parecido de nombre. Acá lo decidía el código por raíces
     * compartidas, y medido contra la API con el CV del CEO eso escribió
     * «Implemented Core Data and Core ML…» (por «Core»), «Managed the App Store
     * release process…» (por «storage») y CallKit/PushKit en la viñeta de TCA:
     * experiencia que el CV no tiene, con el ATS diciendo que sí. La tarjeta lo
     * informa, con lo que pesa, y Tailor no inventa.
     */
    // Mal escrito en el CV: no es falta de experiencia, es un error que el
    // filtro no perdona. Se dice cuál, sin corregirlo solo.
    const marca = credencial ? c.skill : c.match === "MISSPELLED" && c.cvWording ? `${MAL_ESCRITO}:${c.cvWording}` : `${SIN_RESPALDO}:${c.skill}`
    push("missing_requirement", key, tree.summary.id, textOf(tree, tree.summary.id), gainOf(score, key), marca, "none", c.skill)
  }

  /**
   * ── ACÁ VIVÍA `skill_not_listed`, EL TÉRMINO SUELTO (CEO, 2026-09-09) ──────
   *
   * Emitía una tarjeta por cada término que el CV demuestra y la lista no
   * nombra, con su botón para agregarlo. Servía, y aun así era media respuesta:
   * miraba un término por vez, así que podía llevar tu sección de Habilidades a
   * cien entradas — y una lista de cien no la lee nadie, ni el filtro la premia,
   * porque cuenta cada término UNA vez.
   *
   * La pregunta completa es «cuáles lleva tu CV para ESTA vacante», y la
   * contesta `skillPlan` con el techo de veinte y los pesos medidos sobre el
   * aviso. Dos dueños para la misma pregunta es lo que este panel estuvo
   * pagando toda la sesión: queda uno.
   */

  /**
   * LA BLANDA QUE LA VACANTE PIDE Y EL CV NO DEMUESTRA — declarada o ausente.
   *
   * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09, con captura) ──────────────
   * Sólo salía tarjeta para `DECLARED_ONLY` —«aparece como adjetivo, sin ningún
   * logro detrás»—. La ausente, que es la que MÁS puntos cuesta, no tenía
   * ninguna: el usuario veía «Habilidades blandas 0%» y ni una sugerencia
   * debajo. Un porcentaje en cero sin nada que apretar es un reproche.
   *
   * Ahora las dos tienen la misma salida, que es la misma para las dos:
   * demostrarla en una línea, y el motor elige cuál encaja mejor. `FOUND` no
   * entra —ya está demostrada— y por eso el bucle no las repite.
   *
   * Y SÍ suma puntos: las blandas pesan 0,10 de la relevancia desde que se
   * recuperó el peso que v3 había perdido. La ganancia sale del puntaje.
   */
  for (const s of spec ? softCoverageOf(spec, audit, tree) : audit.softCoverage) {
    if (s.status === "DEMONSTRATED") continue
    const donde = bestHomeFor(tree, s.signal, index)
    /**
     * SIN SUJETO: se FUSIONA con la tarjeta que esa línea ya tenía.
     *
     * El sujeto existe para el requisito que va a Habilidades —dos términos
     * sobre una viñeta no pueden compartir un botón que agregue la
     * concatenación de los dos—, y se le había puesto también a la blanda. Con
     * eso la misma línea recibía DOS órdenes en la misma sección: «reescribila,
     * le falta un eje» y «tejé esta blanda acá». Reportado por el CEO: el panel
     * contradiciéndose sobre una viñeta que él acababa de construir.
     *
     * Tejer la blanda y arreglar el eje que falta son LA MISMA reescritura. Una
     * sola tarjeta, un solo botón, una sola consulta.
     */
    // Componente PROPIO: la tarjeta de una blanda va a la sección de blandas, no
    // a la del reclutador. `soft` no lo mide el puntaje —las blandas no puntúan—
    // así que la sección no pinta porcentaje, que es lo que corresponde.
    // La ganancia sale del puntaje, como todas: desde que las blandas pesan
    // 0,10, un 0 escrito a mano decía «no mueve el número» sobre algo que sí lo
    // mueve. Un número a mano al lado de uno calculado se desincroniza siempre.
    push("soft_not_shown", "soft", donde, textOf(tree, donde), gainOf(score, "soft"), s.signal)
  }

  /**
   * EL CARGO QUE LA VACANTE BUSCA, ESCRITO TAL CUAL.
   *
   * `title` pesa 0,14 de la relevancia y ningún hallazgo lo declaraba: el
   * puntaje descontaba por el cargo y el panel no lo mencionaba en ningún lado.
   *
   * La detección es DETERMINISTA y no usa `titleAlignment`: ese número es una
   * opinión del modelo entre 0 y 1, y cortarlo por un umbral sería inventar una
   * vara. Se pregunta lo que el filtro pregunta —¿la cadena está escrita?— sobre
   * los cargos de los puestos y el resumen, que es donde un lector la busca.
   *
   * Se ancla en el RESUMEN porque es lo único de esos dos que este motor sabe
   * escribir, y porque es la primera línea que lee cualquiera. El motor no toca
   * el cargo de un puesto: eso es un dato del usuario y se edita en Contenido.
   */
  const cargo = (spec?.roleTitleRaw ?? "").trim()
  if (cargo && spec) {
    // La MISMA función que puntúa el cargo: con dos, la tarjeta promete puntos
    // que el número no da. Medido antes de unificarlas.
    if (!titleWritten(tree, spec)) {
      /**
       * CON SUJETO: tarjeta propia, y no la del resumen donde se ancla.
       *
       * Medido: sin él se fusionaba con «resumen incompleto» y el cargo quedaba
       * escondido dentro de su detalle —«identity, proof, fit · Jefa de caja»—.
       * El hallazgo no habla del resumen: habla del CARGO, y el resumen es sólo
       * el único lugar de los dos que este motor sabe escribir.
       */
      push("title_mismatch", "title", tree.summary.id, tree.summary.text, gainOf(score, "title"), cargo, "rewrite", cargo)
    }
  }

  /**
   * LOS AÑOS QUE LA VACANTE PIDE (CEO, 2026-09-28).
   *
   * Se cuentan con el código sobre las fechas del CV (`experienceYears`), no se
   * le preguntan al modelo. No tiene botón de IA: la experiencia no se redacta.
   * Lo que sí se puede es que falte un puesto o una fecha, y la tarjeta lo dice.
   * Promete lo que queda del componente, no su peso entero.
   */
  const pideAnios = spec?.yearsRequired ?? null
  if (pideAnios) {
    const tiene = experienceYears(tree)
    const comp = score.components.find((c) => c.key === "years")
    if (tiene < pideAnios && comp) {
      push("years_short", "years", tree.summary.id, tree.summary.text, comp.effectiveWeight - comp.points,
        `anios:${Math.floor(tiene)}/${pideAnios}`, "none", "years")
    }
  }

  /**
   * LA FRASE QUE PODRÍA ESTAR EN EL CV DE CUALQUIERA.
   *
   * La lista vive en un solo lugar —`cliches.ts`, la misma que el prompt de
   * reescritura prohíbe— así que lo que acá se señala es exactamente lo que
   * Tailor tiene prohibido escribir. No mueve el número por sí sola; se cierra
   * reescribiendo la línea, y por eso comparte su tarjeta.
   */
  for (const nodo of [tree.summary, ...tree.roles.flatMap((r) => r.bullets)]) {
    // Una frase de la lista se cita; una cualidad declarada sin trabajo detrás
    // no tiene frase que citar, y se dice lo que es.
    const frase = namedCliches(nodo.text)[0]
    const detalle = frase ? `frase:${frase}` : isEmptyPhrasing(nodo.text) ? "vacia" : null
    if (detalle) push("cliche", nodo.id === tree.summary.id ? "summary" : "xyz", nodo.id, nodo.text, 0, detalle)
  }

  /**
   * UN PUESTO CON MÁS VIÑETAS DE LAS QUE SE LEEN.
   *
   * El tope es el que el proyecto ya fijó (`BULLETS_PER_ROLE_MAX`). No hay botón
   * de IA: elegir qué se va es una decisión de la persona, y la tarjeta le dice
   * con qué criterio — quedarse con las que prueban lo que esta vacante pide.
   */
  for (const role of tree.roles) {
    if (role.bullets.length <= BULLETS_PER_ROLE_MAX) continue
    push("role_too_long", "xyz", role.bullets[0].id, role.bullets[0].text, 0,
      `largo:${[role.title, role.company].filter(Boolean).join(" — ")}/${role.bullets.length}/${BULLETS_PER_ROLE_MAX}`, "none", `role:${role.id}`)
  }

  /**
   * DOS VIÑETAS QUE ABREN CON EL MISMO VERBO.
   *
   * `verbs` pesa 0,10 del impacto y tampoco tenía quién lo reportara. Y desde
   * que `verb_collision` se retiró —bloqueaba una reescritura buena por un
   * motivo de estilo— no quedaba NADA que tocara el tema mientras el puntaje
   * seguía cobrándolo.
   *
   * Se señala la más débil de las que comparten apertura: es la que menos
   * pierde al reescribirse, y la reescritura ya sabe no repetir un verbo del CV
   * porque el ledger se lo dice al modelo.
   */
  const porApertura = new Map<string, typeof tree.roles[number]["bullets"]>()
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const abre = normalize(b.text).split(" ")[0]
      if (!abre) continue
      porApertura.set(abre, [...(porApertura.get(abre) ?? []), b])
    }
  }
  for (const [abre, repetidas] of porApertura) {
    if (repetidas.length < 2) continue
    const masDebil = [...repetidas].sort((a, b) => peso(a.text, index) - peso(b.text, index))[0]
    /**
     * EL DATO VIAJA MARCADO CON LO QUE ES: `verbo:developed`.
     *
     * Al fusionarse con otra tarjeta, el detalle se concatena y se pierde de qué
     * tipo vino cada pieza: la pantalla mostraba «developed» solo, en una caja
     * gris, sin decir qué era. Reportado con captura. Con la marca, la pantalla
     * sabe traducirlo a una frase venga solo o fusionado — y sin la marca cae al
     * dato, que es lo que había.
     */
    push("verb_repeated", "verbs", masDebil.id, masDebil.text, gainOf(score, "verbs"), `verbo:${abre}`)
  }

  const summaryGaps = [
    ["identity", audit.summary.identity],
    ["proof", audit.summary.proof],
    ["fit", audit.summary.fit],
  ] as const
  if (summaryGaps.some(([, ok]) => !ok)) {
    push(
      "summary_gap",
      "summary",
      tree.summary.id,
      tree.summary.text,
      gainOf(score, "summary"),
      summaryGaps.filter(([, ok]) => !ok).map(([k]) => k).join(", "),
    )
  }

  return out
}

function missingParts(f: { hasActionVerb: boolean; hasResult: boolean; hasMethod: boolean }): string {
  const missing: string[] = []
  if (!f.hasActionVerb) missing.push("verbo")
  if (!f.hasResult) missing.push("resultado")
  if (!f.hasMethod) missing.push("método")
  return missing.join(", ")
}

/**
 * Dónde conviene demostrar un requisito que falta.
 *
 * ── EL DEFECTO QUE ESTO CIERRA ──────────────────────────────────────────────
 * La primera versión IGNORABA la habilidad (`void skill`) mientras su comentario
 * prometía "el puesto que más se le parece". Todos los requisitos faltantes
 * caían en la MISMA línea y, por la regla de una-línea-una-tarjeta, se fusionaban
 * en una sola: el usuario leía "te falta todo" sobre una viñeta cualquiera, sin
 * ninguna relación con lo que le falta.
 *
 * Ahora gana la línea que MÁS habla de eso —comparando por raíz, que es lo que
 * hace que "inventario" encuentre "inventarios" y "pagos" encuentre "pagos"—, y
 * el empate lo desempata la línea más floja: la que menos pierde al reescribirse.
 */

/**
 * La viñeta donde escribir el término. `llenas`: las que ya llevan su tope de
 * términos de la vacante (ver `terminosPorLinea`) — no son candidatas.
 */
function bestHomeFor(tree: ResumeTree, skill: string, index: TermIndex): NodeId {
  /**
   * UNA PALABRA GENÉRICA NO ES RELACIÓN (2026-09-28, medido contra la API con el
   * CV del CEO): «Integrated RESTful APIs…» tomaba «AI/ML Integration» por la
   * raíz de «integration», y la IA escribió «…with AI/ML Integration across
   * backend services». Cuentan todas las palabras del término —las cortas por
   * igualdad, «ai», «ml», «ui»—, y una línea lo sostiene sólo si comparte al
   * menos la mitad.
   */
  // Las siglas cuentan («AI», «ML»); los artículos («de», «of») no.
  const palabras = skill
    .split(/[^\p{L}\p{N}+#]+/u)
    .filter((w) => w.length >= 4 || /^[A-Z0-9]{2,3}$/.test(w))
    .map(normalize)
    .filter(Boolean)
  const coincide = (p: string, t: string) => (p.length >= 4 ? sameRoot(p, t) : p === t)

  /**
   * ── LA AFINIDAD DECIDE QUIÉN ES CANDIDATA; LA DEBILIDAD, QUIÉN GANA ────────
   *
   * «Si el hard y el soft recomiendan, dar prioridad a las viñetas más débiles o
   * que no aportan mucho» (CEO, 2026-09-09).
   *
   * Antes las dos señales se sumaban, y la afinidad es un ENTERO mientras la
   * debilidad valía como mucho 0,01: una línea fuerte con una palabra más de
   * afinidad le ganaba SIEMPRE a la débil. La debilidad era un desempate, no una
   * prioridad — que es lo contrario de lo que se pidió.
   *
   * Se separan las dos preguntas. La afinidad sigue primero y no se negocia: una
   * línea que no puede sostener el término no es candidata por más floja que
   * esté, porque ahí el término se cae en el guard. Entre las que SÍ pueden,
   * gana la que menos aporta.
   */
  const candidatas: { id: NodeId; afinidad: number; peso: number }[] = []
  for (const role of tree.roles) {
    for (const b of role.bullets) {
      const texto = normalize(b.text).split(" ")
      // Lo que decide: cuántas palabras del requisito ya viven en esta línea.
      // Sigue primero porque una línea que no puede sostener el término no es
      // candidata por más floja que esté: ahí el término se cae en el guard.
      const afinidad = palabras.filter((p) => texto.some((t) => coincide(p, t))).length
      /**
       * ENTRE DOS QUE PUEDEN SOSTENERLO, GANA LA MÁS DÉBIL (CEO, 2026-09-09).
       *
       * «Si el hard y el soft recomiendan, dar prioridad a las viñetas más
       * débiles o que no aportan mucho.» Antes el desempate premiaba a la que ya
       * traía términos del aviso: el requisito caía sobre la línea que MEJOR
       * estaba, y la floja se quedaba floja. La más débil se mide sin opinión:
       * sin términos del aviso y corta.
       */
      candidatas.push({ id: b.id, afinidad, peso: peso(b.text, index) })
    }
  }
  const sostienen = candidatas.filter((c) => c.afinidad > 0 && c.afinidad * 2 >= palabras.length)
  if (candidatas.length === 0) return tree.summary.id
  // Entre las que pueden sostenerlo, la más débil. Si ninguna puede, la que más
  // se le acerca: es la única con alguna chance de pasar el guard.
  const elegidas = sostienen.length > 0 ? sostienen : candidatas
  return [...elegidas].sort((a, b) =>
    sostienen.length > 0 ? a.peso - b.peso : b.afinidad - a.afinidad || a.peso - b.peso,
  )[0].id
}

/**
 * LAS HABILIDADES QUE ESTE CV LLEVA PARA ESTA VACANTE.
 *
 * ── QUÉ PREGUNTA CONTESTA, Y POR QUÉ ES UNA SOLA ───────────────────────────
 * «Según la postulación, que las skills se reemplacen por las necesarias; la
 * plantilla recibe hasta veinte» (CEO, 2026-09-09). Antes esto lo contestaban
 * dos cosas a medias: un hallazgo por término suelto —«esto lo demostrás y no
 * está en la lista»— que podía llevar la lista a cien, y dos plantillas que
 * cortaban en doce por su cuenta. Ni una ni otra miraban la vacante entera.
 *
 * ── LA REGLA, Y ES DETERMINISTA: no llama al modelo ni gasta cuota ──────────
 *   1. Lo que el aviso PIDE va primero, ordenado por el peso medido sobre su
 *      texto. Un requisito nunca se cae del corte.
 *   2. Se suma lo que el CV DEMUESTRA en una viñeta y la lista no nombra: es lo
 *      que el filtro lee literalmente y hoy no ve.
 *   3. El resto de tus habilidades llena lo que queda, EN TU ORDEN. No se
 *      reordena lo que vos escribiste sin motivo.
 *
 * Nada se escribe acá: devuelve el plan y la pantalla lo enseña. Quién lo
 * acepta es el usuario.
 */
export function skillPlan(
  declared: readonly string[],
  spec: JobSpec,
  audit: AuditFacts,
  weights: Record<string, number> = {},
): { final: string[]; add: string[]; entering: string[]; leaving: string[] } {
  const pedidos = new Map<string, number>()
  for (const r of spec.mustHave) pedidos.set(normalize(r.skill), (weights[r.skill] ?? 1) + 1)
  for (const r of spec.niceToHave) if (!pedidos.has(normalize(r.skill))) pedidos.set(normalize(r.skill), weights[r.skill] ?? 1)

  /** El nombre tal como está escrito: se conserva el del usuario si ya lo tiene. */
  const comoLoEscribio = new Map(declared.map((d) => [normalize(d), d]))
  const nombre = (s: string) => comoLoEscribio.get(normalize(s)) ?? s

  const pedidas = [...new Set([...spec.mustHave, ...spec.niceToHave].map((r) => r.skill))]
    .filter((s) => pedidos.has(normalize(s)))
    .sort((a, b) => (pedidos.get(normalize(b)) ?? 0) - (pedidos.get(normalize(a)) ?? 0))

  const final: string[] = []
  const meter = (s: string) => {
    const n = normalize(s)
    if (!n || final.some((x) => normalize(x) === n)) return
    final.push(nombre(s))
  }

  /**
   * 1 · Lo que el aviso pide Y tu CV sostiene —porque ya está en tu lista o
   *     porque una viñeta lo demuestra—, ordenado por el peso del aviso.
   *
   * NO se agrega un término que el CV no sostiene, por más que la vacante lo
   * pida. Escribir "Swift" en las habilidades de alguien que nunca lo nombró es
   * afirmar un hecho sobre esa persona, y eso no lo decide el motor: para eso
   * está la tarjeta que le pide demostrarlo en una línea.
   */
  /**
   * DEMOSTRADA ES DENTRO DE UNA LÍNEA, con su cita.
   *
   * Desde que la cobertura lee el CV entero, «encontrado» también es «está en
   * Idiomas» o «en el título de una certificación». Medido en local el
   * 2026-09-24: el plan agregaba «English» a Habilidades —ya estaba en Idiomas—
   * y «Combine» por una certificación. Lo que ya está escrito en otra sección
   * no necesita repetirse en la lista; lo que una LÍNEA demuestra sin
   * nombrarlo en la lista, sí.
   */
  const demostradas = new Set(
    // Y lo que el CV tiene con otro nombre del oficio («Git» por «version
    // control»): el nombre del aviso entra a la lista al lado del suyo.
    audit.coverage.filter((c) => c.status !== "NOT_FOUND" && (c.evidenceNodeId || c.match === "EQUIVALENT")).map((c) => normalize(c.skill)),
  )
  // Una credencial no se agrega a Habilidades: vive en su sección (Idiomas,
  // Educación, Certificaciones). Si la persona ya la listó ahí, se respeta.
  const credenciales = new Set(
    [...spec.mustHave, ...spec.niceToHave].filter((r) => r.kind === "credential").map((r) => normalize(r.skill)),
  )
  for (const s of pedidas) {
    if (comoLoEscribio.has(normalize(s))) meter(s)
    else if (demostradas.has(normalize(s)) && !credenciales.has(normalize(s))) meter(s)
  }
  // 2 · lo tuyo, en tu orden
  for (const s of declared) meter(s)

  /**
   * NADA SE BORRA: EL PLAN ORDENA (2026-09-24).
   *
   * Devolvía `drop` —lo que no entraba en las veinte— y la pantalla lo
   * escribía como la lista nueva: 34 habilidades BORRADAS del CV de un usuario
   * en producción, con una tarjeta que decía «salen de la plantilla». Y era
   * innecesario: las plantillas ya cortan en `SKILLS_MAX` respetando el orden
   * (`useAtsData`), así que lo único que el plan tiene que decidir es QUÉ va
   * primero. Lo que queda después de la veinte sigue en tus datos y vuelve a
   * verse en cuanto otra vacante lo pida.
   */
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

/**
 * CUÁNTO APORTA UNA LÍNEA A ESTA VACANTE. Más alto, más fuerte.
 *
 * Una sola definición de «débil» para las dos preguntas que la usan: dónde
 * aterrizar un requisito y cuál sacar cuando sobran. Con dos definiciones, el
 * motor podía aterrizar un término en la línea que a la vez proponía borrar.
 */
function peso(texto: string, index: TermIndex): number {
  return termsIn(index, texto).size * 10 + normalize(texto).split(" ").length
}

/** Dos palabras con la misma raíz de cuatro letras hablan de lo mismo. */
export function sameRoot(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false
  return a.slice(0, 4) === b.slice(0, 4)
}

function textOf(tree: ResumeTree, id: NodeId): string {
  return findNode(tree, id)?.text ?? ""
}
