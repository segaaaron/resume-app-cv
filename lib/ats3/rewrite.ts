// lib/ats3/rewrite.ts
//
// LA REESCRITURA DE TAILOR: una línea, lo que su tarjeta prometió, las
// comprobaciones del código y un reintento que dice qué falló.

import { normalize, termsIn, type AnchoredSuggestion, type Axis, type JobSpec, type NodeId, type ResumeTree, type Suggestion, type TermIndex, termKey } from "@/lib/ats3/contracts"
import { ledgerSignature, releaseOpener, type Ledger } from "@/lib/ats3/ledger"
import { checkSuggestion, droppedNames, findNode, lossNudge, lostContent, repairSuggestion, retryNudge, similarNudge, similarTo, toFirstPerson, type GuardVerdict } from "@/lib/ats3/guards"
import { cvTextOf, experienceYears, statesQuantity, titleForms } from "@/lib/ats3/score"
import { type AtsAi, type AtsStore, cacheKey } from "@/lib/ats3/ports"
import { controlesDe, topBulletsOf } from "@/lib/ats3/rewrite-checks"

// ─────────────────────────────────────────────────────────────────────────────
// LA REESCRITURA, CON SU REINTENTO
// ─────────────────────────────────────────────────────────────────────────────

export interface RewriteRequest {
  tree: ResumeTree
  nodeId: NodeId
  spec: JobSpec
  ledger: Ledger
  index: TermIndex
  language: "es" | "en"
  model: string
  jdKey: string
  /** Lo que la tarjeta prometió cerrar. Ver `RewriteInput.focus`. */
  focus?: string
  /**
   * LOS TÉRMINOS QUE LA TARJETA PROMETIÓ ESCRIBIR, tal como los pide la vacante
   * de ESTE CV: los requisitos que faltan y el cargo. Salen de la tarjeta, no de
   * ninguna lista: valen para cualquier oficio.
   */
  mustWrite?: string[]
  /** El verbo que la tarjeta promete dejar de repetir: otra viñeta ya abre con él. */
  avoidOpener?: string
  /** La tarjeta promete el tamaño del logro: una cifra escrita o su hueco. */
  wantsSize?: boolean
  /** Los ejes que la tarjeta promete cerrar («no dice en qué terminó»). */
  axes?: Axis[]
  /**
   * LO QUE LA PERSONA CONTÓ SOBRE ESTA LÍNEA —en qué terminó, cómo lo hizo—.
   * Un resultado que el CV no dice no lo puede escribir nadie más: es el único
   * camino honesto para cerrar ese eje.
   */
  told?: string
  ai: AtsAi
  store: AtsStore
}

export type RewriteResult =
  | { ok: true; suggestion: AnchoredSuggestion; served: boolean; calls: number }
  /**
   * El modelo leyó la línea y dice que ya está bien. NO es un fallo: es la
   * respuesta que el prompt le pide cuando no hay nada que mejorar, y mostrarla
   * como error —o peor, como una propuesta vacía— convierte una respuesta
   * honesta en una pantalla rota.
   */
  | { ok: false; alreadyGood: true; calls: number }
  | { ok: false; alreadyGood?: false; verdict: GuardVerdict; calls: number }

/**
 * Pide UNA reescritura y la juzga.
 *
 * Un solo reintento, y le dice al modelo QUÉ falló de lo que ya escribió. Dos
 * reintentos esconderían un prompt que dejó de funcionar; cero convierte cada
 * rechazo en una pantalla vacía con el uso ya cobrado.
 */
export async function runRewrite(req: RewriteRequest): Promise<RewriteResult> {
  /**
   * UNA LÍNEA NUEVA NO TIENE NODO, y ése es todo el caso especial.
   *
   * `nodeId` ancla el pedido en una línea que existe —para saber a qué puesto
   * pertenece— pero lo que se va a escribir no reemplaza a nadie. El hecho lo
   * puso el usuario al confirmar el tema, y ese tema hace de original: es contra
   * lo que los guards juzgan que la redacción no se lleve ni agregue nada.
   */
  const node = findNode(req.tree, req.nodeId)
  if (!node) return { ok: false, verdict: { ok: false, reason: "stale", detail: req.nodeId }, calls: 0 }

  const isSummary = req.nodeId === req.tree.summary.id
  const sig = ledgerSignature(req.ledger)
  const hashBase = node.hash
  const key = cacheKey.fix(
    req.nodeId, hashBase, req.jdKey, sig, req.model,
    `${req.focus ?? ""}||${(req.mustWrite ?? []).join("\u0001")}|${req.avoidOpener ?? ""}|${req.wantsSize ? "S" : ""}|${(req.axes ?? []).join(",")}|${req.told ?? ""}`,
  )

  // La línea que se reemplaza suelta su propia apertura: si no, choca consigo
  // misma y el modelo elige un verbo peor para esquivar un conflicto inexistente.
  const ledger = releaseOpener(req.ledger, node.text)
  /** QUÉ NO SE PUEDE PERDER: la línea que se reemplaza. */
  const original = node.text
  const ctx = {
    original,
    index: req.index,
    ledger,
    language: req.language,
    /**
     * LAS OTRAS LÍNEAS DEL CV, para que una reescritura no vuelva calcada a una
     * viñeta que ya existe (orden del CEO, 2026-09-09). Se excluye la que se
     * está reemplazando: chocaría contra sí misma, igual que el verbo.
     *
     * Acá vivía `grounding` —el CV entero como respaldo de lo que el resumen
     * podía nombrar—, que existía sólo para `invented_term` e `invented_figure`.
     * Sin esos dos guards no tiene a quién contestarle.
     */
    siblings: req.tree.roles
      .flatMap((r) => r.bullets)
      .filter((b) => b.id !== req.nodeId)
      .map((b) => b.text),
  }

  /**
   * LO GUARDADO VUELVE A PASAR POR LOS GUARDS.
   *
   * Se servía tal cual, y ahí estaba el agujero: los guards juzgan la respuesta
   * el día que llega, así que una propuesta escrita ANTES de que existiera un
   * chequeo lo esquiva para siempre — el caché la sirve idéntica en cada visita
   * y ningún reintento la vuelve a mirar. Cazado el 2026-08-30 al agregar el
   * chequeo de la cifra que el original ya traía: sin esto, la línea reportada
   * con captura seguía ofreciendo borrar su propio "5%" después de arreglarlo.
   *
   * Un guard nuevo tiene que valer para lo ya guardado, o no vale.
   *
   * Si lo guardado ya no pasa, se sigue de largo como si no hubiera nada: se
   * gasta una llamada —sólo la primera vez, porque lo bueno se vuelve a
   * guardar— en vez de entregar algo que hoy sabemos que está mal.
   */
  // Los controles del texto propuesto y el pedido de corrección: ver `rewrite-checks`.
  const { faltan, prometido, comenta, enumera, fueraDelPuesto, sueltas, sinVariante, ejesFaltan, problemas, correccion } = controlesDe(req, original, isSummary)

  const guardada = (await req.store.read("ats3-fix", key)) as Suggestion | null
  // Sólo una reescritura tiene una línea a la que superar: al agregar, parecerse
  // al tema confirmado no es «no aporta».
  // Escribir lo que la tarjeta prometió —el término que la línea no nombraba—
  // ES la mejora, aunque el resto quede igual: la regla del 90% es contra el
  // cambio cosmético. Medido el 2026-09-28: «Conducted unit testing and UI
  // testing…» cerraba la tarjeta y se descartaba por parecida al original.
  const cierraPromesa = (s: Suggestion) => (req.mustWrite ?? []).length > 0 && faltan(s).length === 0
  const parecidaA = (s: Suggestion) => similarTo(s, ctx, !cierraPromesa(s))
  const cached = guardada ? repairSuggestion(guardada) : null
  // Lo guardado pasa también por el ciclo de corrección: con problemas, no se sirve.
  if (cached && checkSuggestion(cached, ctx).ok && problemas(cached) === 0) {
    return { ok: true, suggestion: anchor(cached, hashBase, original, parecidaA(cached)), served: true, calls: 0 }
  }
  const ask = (nudge?: string) =>
    isSummary
      ? req.ai.rewriteSummary({
          current: node!.text,
          focus: req.focus,
          mustWrite: prometido,
          yearsOfExperience: Math.floor(experienceYears(req.tree)) || null,
          cvLines: req.tree.roles.flatMap((r) => r.bullets.map((b) => b.text)),
          otherSections: req.tree.otherText,
          spec: req.spec,
          topBullets: topBulletsOf(req.tree, req.spec),
          provenTerms: provenTermsOf(req.tree, req.spec, req.index),
          ledger,
          declaredSkills: req.tree.declaredSkills,
          nudge,
        })
      : req.ai.rewriteBullet({
          original,
          bulletId: req.nodeId,
          roleContext: roleContextOf(req.tree, req.nodeId),
          spec: req.spec,
          ledger,
          declaredSkills: req.tree.declaredSkills,
          focus: req.focus,
          mustWrite: prometido,
          avoidOpener: req.avoidOpener,
          wantsSize: req.wantsSize,
          axes: req.axes,
          told: req.told?.trim() || undefined,
          /**
           * LAS OTRAS LÍNEAS DEL PUESTO, para que no repita ninguna.
           *
           * El guard rechaza una reescritura calcada a otra viñeta, y hasta hoy
           * el modelo nunca las había visto: se lo castigaba por repetir algo
           * que nadie le mostró. Prevenir en la fuente cuesta cero tokens.
           */
          siblings: req.tree.roles
            .flatMap((r) => r.bullets)
            .filter((b) => b.id !== req.nodeId)
            .map((b) => b.text),
          nudge,
        })

  /**
   * EL TECHO DE ESTE CAMINO SON CUATRO LLAMADAS, Y LA CUOTA SE COBRA UNA.
   *
   * La propuesta (1), el reintento por declinar contradiciendo lo que el propio
   * modelo declaró (2), el reintento por lo perdido o el parecido (3) y el
   * reintento por prometer una cifra y no ofrecer el hueco (4). Los cuatro son
   * secuenciales e independientes: nada impide que una misma corrida los sume.
   *
   * Acá decía TRES, afirmando que dos de esos reintentos «comparten ranura».
   * Medido contra la API el 2026-09-11: una línea real gastó CUATRO. El número
   * era una suposición escrita como hecho.
   *
   * Eran SEIS hasta el 2026-09-09. Bajaron solas al sacar lo que el CEO mandó
   * sacar: el reintento por verbo repetido, la verificación de P6 y su segunda
   * verificación. Menos llamadas por la misma ranura, no más.
   */
  let calls = 0
  let first = await ask()
  calls++

  /**
   * "Ya está bien" se contesta antes de cualquier guard: no hay texto que juzgar,
   * y pedirle una segunda opinión al validador sería pagar una llamada por
   * preguntar si la nada tiene una cifra inventada.
   *
   * PERO SE COMPRUEBA LA COHERENCIA, igual que con la cifra. Declinar es válido
   * sólo si la línea original ya tiene los tres ejes; el modelo los DECLARA en
   * `declineBasis`, así que decir "está bien" mientras se declara que le falta
   * el método es una contradicción que el código puede ver. Se pide una vez más
   * nombrando lo que falta; si vuelve a declinar, se le cree y no se cobra.
   *
   * Medido contra la API: declinó sobre "Participé en las reuniones con los
   * padres" —apertura que el propio prompt prohíbe— y sobre "Di la medicación",
   * tres palabras sin resultado ni método.
   */
  /**
   * «YA ESTÁ BIEN» NO CONTESTA UNA TARJETA ABIERTA (2026-09-28).
   *
   * Medido en Chrome: sobre «Atendí en mostrador y vendí medicamentos.», con la
   * tarjeta prometiendo escribir «Retail» y señalando que faltaban resultado y
   * método, el modelo declinó declarando los tres ejes en true, y la pantalla
   * pintó «la línea ya está bien» encima de la tarjeta que seguía abierta. Lo
   * que la tarjeta promete lo sabe el motor —lo midió la auditoría—, así que la
   * negativa se juzga contra eso y no sólo contra lo que el modelo declara.
   * Si vuelve a negarse con la promesa abierta, se dice eso, no «está bien».
   */
  const promesa = [
    ...(req.mustWrite ?? []).map((t) => titleForms(t).join(" / ")),
    req.wantsSize ? (req.language === "en" ? "the size of the achievement" : "el tamaño del logro") : "",
    req.focus ?? "",
  ].filter(Boolean)
  // Un eje que sólo la persona puede dar, sin su dato: se le pide, no se niega.
  // Los ejes los escribe la IA (CEO, 2026-09-28): si no llegan, es una negativa.
  const ejesDeLaPersona = (req.axes ?? []).filter((e) => e !== "verbo")
  const negada: RewriteResult =
    promesa.length || ejesDeLaPersona.length
        ? { ok: false, verdict: { ok: false, reason: "declined", detail: [...promesa, ...ejesDeLaPersona].join(" · ") }, calls: 0 }
        : { ok: false, alreadyGood: true, calls: 0 }
  if (!first.changed) {
    const ejes = first.declineBasis
    // Sin declaración tampoco se le cree: el prompt la pide justamente cuando
    // declina, y omitirla es la forma más barata de saltarse la vara.
    const falta = [
      ...(ejes
        ? [!ejes.hasActionVerb && "verbo", !ejes.hasResult && "resultado", !ejes.hasMethod && "método"].filter(Boolean)
        : ["la declaración de los tres ejes"]),
      ...promesa,
    ]
    if (falta.length === 0) return { ok: false, alreadyGood: true, calls }
    first = await ask(
      req.language === "en"
        ? `You declined, yet this line still needs: ${falta.join(" · ")}. It has something to fix — rewrite it. You write what is missing: the result that work achieves and the method, tool or technique it is done with in this trade. Keep every fact the original states, drop nothing, and add no figure the candidate did not give.`
        : `Declinaste, pero a esta línea todavía le falta: ${falta.join(" · ")}. TIENE algo que arreglar — reescribila. Lo que falta lo escribís vos: el resultado que logra ese trabajo y el método, la herramienta o la técnica con que se hace en este oficio. Conservá todo hecho del original, no sueltes nada y no agregues ninguna cifra que el candidato no dio.`,
    )
    calls++
    if (!first.changed) return { ...negada, calls }
  }

  /**
   * LA TERCERA PERSONA REGULAR SE CORRIGE, NO SE RECHAZA.
   *
   * «Atendió a los clientes» costaba la reescritura entera y la ranura de cuota
   * por una letra que el código sabe conjugar. Se arregla acá, antes de juzgar;
   * lo que el código NO puede probar —un irregular, un sustantivo— sigue cayendo
   * en el guard, que es la respuesta honesta.
   */
  const preparar = (s: Suggestion): Suggestion => {
    const enPrimera = req.language !== "en" ? toFirstPerson(s.text) : null
    return repairSuggestion(enPrimera ? { ...s, text: enPrimera } : s)
  }
  first = preparar(first)

  let verdict = checkSuggestion(first, ctx)
  // Menos es mejor: parecerse a otra línea pesa más que cualquier palabra perdida.
  // Lo prometido pesa más que una palabra perdida y menos que repetir otra línea.
  // Lo que al final NIEGA la tarjeta —un nombre del CV soltado, un término
  // prometido que no está— pesa como fatal: entre dos respuestas, una que se
  // puede entregar le gana siempre a una que se va a negar (medido el
  // 2026-09-28: el reintento arreglaba la cifra, soltaba «Agile» y ganaba).
  const niega = (s: Suggestion) => (!isSummary && droppedNames(original, s.text).length > 0) || faltan(s).length > 0 || enumera(s).length > 0
  const costo = (s: Suggestion) => (niega(s) ? 500 : 0) + (parecidaA(s) ? 1000 : 0) + problemas(s) * 10 + lostContent(s, ctx).length
  const parecida = verdict.ok ? parecidaA(first) : null
  const perdido = verdict.ok ? lostContent(first, ctx) : []

  /**
   * UN REINTENTO, Y NADA DE LO QUE ESCRIBIÓ EL MODELO BLOQUEA (CEO, 2026-09-11).
   *
   * Vacía o sin línea donde escribir: se pide una vez más y, si vuelve igual, no
   * hay nada honesto que entregar. Parecida a otra línea, o que dejó de decir
   * algo —un término, una cifra, una palabra de la línea que se borra—: también
   * se pide una vez más diciendo QUÉ, pero la respuesta llega SIEMPRE. Gana la
   * que menos cuesta; lo perdido se ve tachado en el antes/después y el parecido
   * se avisa con la línea nombrada. Antes eso era «It was not written» con la
   * consulta gastada.
   */
  const aCorregir = verdict.ok ? correccion(first) : ""
  if (!verdict.ok || parecida || perdido.length > 0 || aCorregir) {
    const nudge = !verdict.ok
      ? retryNudge(verdict, req.language)
      : [
          parecida ? similarNudge(parecida, req.language) : "",
          perdido.length > 0 ? lossNudge(perdido, req.language) : "",
          aCorregir ? `${aCorregir} ${req.language === "en" ? "Keep strictly to what the CV says." : "Ceñite a lo que el CV dice."}` : "",
        ]
          .filter(Boolean)
          .join("\n")
    const segundo = await ask(nudge)
    calls++
    if (!segundo.changed) {
      if (!verdict.ok) return { ...negada, calls }
    } else {
      const reparado = preparar(segundo)
      const v2 = checkSuggestion(reparado, ctx)
      if (!verdict.ok) {
        first = reparado
        verdict = v2
      } else if (v2.ok && costo(reparado) < costo(first)) {
        first = reparado
      }
    }
  }
  if (!verdict.ok) return { ok: false, verdict, calls }

  /**
   * LA MISMA LÍNEA DEVUELTA NO ES UNA PROPUESTA: ES «YA ESTÁ BIEN».
   *
   * ── MEDIDO CONTRA LA API (2026-09-11) ──────────────────────────────────────
   * De 15 líneas reales, 3 volvieron —también tras el reintento— con el texto
   * del usuario intacto, y el panel las mostraba como propuesta con un cartel
   * amarillo encima: «se parece a una línea que ya tenés». El usuario apretaba,
   * esperaba, gastaba una consulta y recibía su propia línea. Una de ellas
   * costó cuatro llamadas.
   *
   * No es un bloqueo: es la respuesta que el producto ya tiene para este caso, y
   * el panel la pinta en verde. La vara es la del CEO —90% idéntico no es
   * mejora—, la misma que ya usa `similarTo`.
   */
  if (parecidaA(first) === original) {
    return { ...negada, calls }
  }

  /**
   * ── ACÁ CORRÍA P6, EL VALIDADOR (CEO, 2026-09-09) ──────────────────────────
   *
   * Era una llamada más al modelo, DESPUÉS de que los guards dieran OK, con una
   * sola tarea: «detectar si la reescritura afirma algo que el original no
   * sostiene» — herramienta no declarada, entidad nueva, cifra no dada. Es
   * exactamente la pregunta de `invented_term` e `invented_figure`, que el CEO
   * mandó sacar. Dejarlo habría vuelto la orden un no-op: la misma reescritura
   * seguiría muriendo, sólo que decidido por un segundo modelo en vez de por el
   * código, y cobrando una llamada extra por hacerlo.
   *
   * Ya había tenido que acotarse una vez porque borraba producto: haciéndole
   * caso a todo, la entrega caía de 14/15 a 9/15 — etiquetaba como invención el
   * vocabulario del oficio («estilismo», «salón», «datos clínicos»), que es lo
   * que la doctrina obliga a nombrar.
   *
   * Efecto medido por construcción: el techo de esta función baja de CINCO
   * llamadas a TRES.
   */

  /**
   * ── LA CIFRA QUE EL MODELO DECLARÓ Y NO OFRECIÓ ────────────────────────────
   *
   * `measurableAspect` es lo que el modelo dijo que se puede medir de este
   * trabajo. Si dijo que hay algo y NO propuso el hueco, se le pide una vez —
   * medido, la cifra es la palanca de impacto más grande del producto y venía
   * saliendo 0 o 1 vez cada quince líneas.
   *
   * Si la segunda tampoco lo trae, se ENTREGA IGUAL. Una línea buena sin cifra
   * vale mucho más que una pantalla vacía con el uso ya cobrado, y este producto
   * ya pagó una vez por confundir "faltó lo ideal" con "no hay nada que dar".
   */
  const prometeTamano = Boolean(first.measurableAspect?.trim())
  const yaTieneCifra = /\d/.test(original)
  /**
   * Y SI LA TARJETA LO PROMETIÓ, TAMBIÉN (2026-09-28, medido con Coforge): una
   * tarjeta «falta el tamaño + este término» se entregaba con el término y sin
   * hueco, y el análisis siguiente volvía a pedir el tamaño sobre la línea
   * recién arreglada. El ATS ya decidió que el trabajo tiene tamaño: el
   * modelo no puede contestar que no.
   */
  const debeTamano = Boolean(req.wantsSize) && !statesQuantity(first.text)
  if ((prometeTamano || debeTamano) && first.placeholders.length === 0 && !yaTieneCifra) {
    const segunda = await ask(
      debeTamano
        ? req.language === "en"
          ? `The card promised the size of this achievement and your line has no slot. Keep the line exactly as you wrote it and add ONE typed slot for what this work is counted in (how much, how often, in how long, over what scope), with the unit inside or right after it, plus variantWithoutMetric.`
          : `La tarjeta prometió el tamaño de este logro y tu línea no trae hueco. Dejá la línea tal como la escribiste y agregá UN hueco tipado para aquello en lo que se cuenta este trabajo (cuánto, cada cuánto, en cuánto tiempo, sobre qué alcance), con la unidad adentro o justo después, y su variantWithoutMetric.`
        : req.language === "en"
          ? `You wrote that this work can be measured in "${first.measurableAspect}" and then offered no slot for it. Add the typed slot with its believable range for this trade — or set measurableAspect to null if there is truly nothing to measure.`
          : `Escribiste que este trabajo se mide en "${first.measurableAspect}" y después no ofreciste el hueco. Agregá el hueco tipado con su rango creíble para este oficio — o poné measurableAspect en null si de verdad no hay nada que medir.`,
    )
    calls++
    const conHueco = preparar(segunda)
    if (
      conHueco.changed &&
      conHueco.placeholders.length > 0 &&
      checkSuggestion(conHueco, ctx).ok &&
      costo(conHueco) <= costo(first)
    ) {
      first = conHueco
    }
  }

  /**
   * LO QUE EL REINTENTO NO CORRIGIÓ Y SE PUEDE QUITAR SIN TOCAR LO DEMÁS.
   *
   * Una oración que habla del CV («The CV also shows…», medido dos veces
   * seguidas el 2026-09-28), que es un dato suelto o una lista de términos no
   * tiene redacción que rescatar: se retira, y el resto del resumen queda como el modelo lo
   * escribió. Sólo si quedan al menos dos oraciones — si no, no hay resumen.
   */
  /**
   * UN CARGO CON BARRA SE ESCRIBE EN UNA SOLA FORMA. Medido el 2026-09-28: el
   * resumen abrió «Senior iOS Engineer / Developer», la cadena del aviso con su
   * barra. Se deja la forma que más se parece a los cargos que la persona tuvo
   * — un «iOS Developer» lleva a «Senior iOS Developer» —, sin otra llamada.
   */
  const cargos = normalize(req.tree.roles.map((r) => r.title).join(" ")).split(" ")
  for (const t of req.mustWrite ?? []) {
    const formas = titleForms(t)
    if (formas.length < 2) continue
    const conBarra = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s*\/\s*/g, "\\s*/\\s*"), "i")
    if (!conBarra.test(first.text)) continue
    const afinidad = (f: string) => normalize(f).split(" ").filter((w) => cargos.includes(w)).length
    const mejor = [...formas].sort((a, b) => afinidad(b) - afinidad(a))[0]
    first = { ...first, text: first.text.replace(conBarra, mejor) }
  }
  if (isSummary) {
    const oraciones = first.text.split(/(?<=[.!?])\s+/).map((o) => o.trim()).filter(Boolean)
    // La oración parecida a su viñeta NO se retira: suele ser la prueba con su
    // cifra, y perderla deja un resumen sin resultado (medido el 2026-09-28).
    const sinDefecto = oraciones.filter((o) => {
      const sola = { ...first, text: o }
      return comenta(sola).length === 0 && sueltas(sola).length === 0 && enumera(sola).length === 0
    })
    // Lo que no trabaja para el puesto se quita sólo si quedan dos: es la razón
    // más débil, y un resumen de una oración rinde menos que uno con una floja.
    const delPuesto = sinDefecto.filter((o, i) => i === 0 || fueraDelPuesto({ ...first, text: `. ${o}` }).length === 0)
    const sanas = delPuesto.length >= 2 ? delPuesto : sinDefecto
    if (sanas.length >= 1 && sanas.length < oraciones.length) first = { ...first, text: sanas.join(" ") }
  }
  // Si ni el reintento trajo la versión sin cifra, la salida es la línea tal
  // como está: «no tengo ese dato» nunca puede quedar sin opción.
  if (sinVariante(first)) first = { ...first, variantWithoutMetric: original }
  // Una tecnología o nombre propio que la persona afirma y el reintento siguió
  // soltando: reemplazarla altera un hecho suyo (medido: «RESTful» → «GraphQL»).
  const nombresPerdidos = isSummary ? [] : droppedNames(original, first.text)
  if (nombresPerdidos.length > 0) return { ok: false, verdict: { ok: false, reason: "declined", detail: nombresPerdidos.join(", ") }, calls }
  // Un término prometido que tampoco llegó en el reintento: ver `faltan`.
  if (faltan(first).length > 0) return { ...negada, calls }
  /**
   * UN EJE PROMETIDO QUE SÓLO LA PERSONA PUEDE DAR. Si el resultado o el método
   * no están ni en el original ni en lo que ella contó, no se entrega relleno:
   * se le pide el dato en la misma tarjeta. Si ya lo contó y aun así no llegó,
   * es una negativa como cualquier otra.
   */
  if (ejesFaltan(first).some((e) => e !== "verbo")) return { ...negada, calls }

  await req.store.write("ats3-fix", key, first)
  return { ok: true, suggestion: anchor(first, hashBase, original, parecidaA(first)), served: false, calls }
}

function anchor(
  s: Suggestion,
  hash: string,
  originalText: string,
  similar?: string | null,
): AnchoredSuggestion {
  return { ...s, basedOnHash: hash, originalText, ...(similar ? { similarTo: similar } : {}) }
}

function roleContextOf(tree: ResumeTree, nodeId: NodeId): string {
  const role = tree.roles.find((r) => r.bullets.some((b) => b.id === nodeId))
  return role ? `${role.title} — ${role.company}` : ""
}

/**
 * LO QUE LA VACANTE PIDE Y EL CV YA DEMUESTRA, en el orden en que la vacante lo
 * pide: primero los obligatorios, en el orden de peso que P1 devuelve, después
 * los deseables. Es lo único que el resumen puede nombrar de la vacante.
 */
function provenTermsOf(tree: ResumeTree, spec: JobSpec, index: TermIndex): string[] {
  const escritos = termsIn(index, cvTextOf(tree))
  const pedidos = [...(spec.mustHave ?? []), ...(spec.niceToHave ?? [])].map((r) => index.byKey.get(termKey(r.skill)) ?? r.skill)
  return [...new Set(pedidos.filter((t) => escritos.has(t)))]
}
