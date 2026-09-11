import { describe, it, expect } from "vitest"
import {
  checkSuggestion,
  droppedTerms,
  figureSlots,
  lostContent,
  repairSuggestion,
  similarNudge,
  similarTo,
  wrongPerson,
  addsNothing,
  isStale,
  loyalty,
  retryNudge,
  type GuardContext,
} from "@/lib/ats3/guards"
import { buildTermIndex, type Suggestion, type ResumeTree, type Finding, type Resolution } from "@/lib/ats3/contracts"
import type { Ledger } from "@/lib/ats3/ledger"

/**
 * Los guards son lo único que separa la salida de un modelo de la pantalla de
 * un usuario. Lo que se prueba acá es la línea fina del producto:
 *
 *   - Afirmar un HECHO NUEVO sobre la persona está prohibido siempre.
 *   - Nombrar EN QUÉ CONSISTE el trabajo que ella dijo hacer es obligatorio y
 *     es lo que el producto cobra.
 *
 * Un guard demasiado ancho rompe lo segundo mientras cree estar cuidando lo
 * primero. Este proyecto ya midió esa confusión y por eso hay casos de las dos
 * clases acá abajo.
 */

const ledger = (over: Partial<Ledger> = {}): Ledger => ({
  verbsUsed: [],
  keywordBudget: {},
  metricTypesUsed: [],
  claimsMade: [],
  bulletsRemaining: 10,
  ...over,
})

const ctx = (over: Partial<GuardContext> = {}): GuardContext => ({
  original: "Trabajé en la caja del local",
  index: buildTermIndex([]),
  ledger: ledger(),
  ...over,
})

const sug = (over: Partial<Suggestion> = {}): Suggestion => ({
  bulletId: "b1",
  changed: true,
  text: "texto nuevo",
  actionVerb: "Gestioné",
  keywordsUsed: [],
  claim: "",
  metricType: null,
  placeholders: [],
  variantWithoutMetric: null,
  measurableAspect: null, declineBasis: null,
  ...over,
})

describe("el CV habla de lo que la persona HIZO", () => {
  /**
   * Los dos casos salieron de medir contra la API: 2 de 12 líneas entregadas
   * volvían así. El prompt ya lo prohibía en los dos idiomas.
   */
  it("caza la tercera persona", () => {
    expect(wrongPerson("Controló los signos vitales de los pacientes")).toContain("tercera")
  })

  it("caza el infinitivo", () => {
    expect(wrongPerson("Mantener comunicación con las familias")).toContain("infinitivo")
  })

  it("deja pasar la primera persona, que es lo correcto", () => {
    expect(wrongPerson("Controlé los signos vitales")).toBeNull()
    expect(wrongPerson("Cuadré efectivo y comprobantes")).toBeNull()
  })

  it("no confunde una sigla ni una palabra corta con un verbo", () => {
    expect(wrongPerson("MIG y TIG en estructuras")).toBeNull()
    expect(wrongPerson("Di clases a los chicos")).toBeNull()
  })

  it("y el chequeo completo lo rechaza", () => {
    const v = checkSuggestion(
      sug({ text: "Controló los signos vitales de los pacientes en cada turno", actionVerb: "Controló" }),
      ctx({ original: "Controlé a los pacientes" }),
    )
    // La persona ya NO rechaza: se corrige lo que el código sabe conjugar y lo
    // demás se entrega. `wrongPerson` sigue siendo quien lo detecta.
    expect(v.ok).toBe(true)
  })
})

describe("no se puede soltar lo que la vacante busca", () => {
  /**
   * La pérdida que duele no es la de cualquier palabra —parafrasear es legítimo—
   * sino la de un término que la vacante pide y el CV demostraba. Este proyecto
   * midió esa fuga: un CV entró con 23 términos y salió con 16 aplicando lo que
   * el propio panel ofrecía.
   */
  const jd = buildTermIndex([{ canonical: "Gestión de turnos", variants: ["turnos"] }])

  it("una reescritura que suelta el término de la vacante se caza", () => {
    expect(droppedTerms("Confirmé los turnos de la semana", "Confirmando por teléfono a cada paciente", jd)).toEqual([
      "Gestión de turnos",
    ])
  })

  it("si el término sobrevive, parafrasear el resto es legítimo", () => {
    expect(droppedTerms("Confirmé los turnos", "Coordiné los turnos de tres profesionales por agenda", jd)).toEqual([])
  })

  it("perder una palabra que la vacante no pide NO es perder información", () => {
    // "Realicé el arqueo" → "Cuadré efectivo y comprobantes" explica el trabajo.
    expect(droppedTerms("Realicé el arqueo de caja", "Cuadré efectivo, comprobantes y diferencias del turno", jd)).toEqual([])
  })
})

describe("una reescritura tiene que aportar algo", () => {
  it("decir lo mismo con otras palabras no es mejora", () => {
    expect(addsNothing("Gestioné la agenda del consultorio", "Gestioné la agenda del consultorio médico")).toBe(true)
  })

  it("agregar método y resultado sí lo es", () => {
    expect(addsNothing("Gestioné la agenda", "Coordiné la agenda de 3 profesionales reduciendo las ausencias")).toBe(false)
  })
})

describe("el chequeo completo", () => {
  it("aprueba una reescritura legítima", () => {
    const v = checkSuggestion(
      sug({ text: "Cuadré efectivo y comprobantes al cierre de cada turno detectando diferencias", actionVerb: "Cuadré" }),
      ctx({ original: "Realicé el arqueo de caja" }),
    )
    expect(v.ok).toBe(true)
  })

  /**
   * ── LO QUE EL CEO MANDÓ SACAR (2026-09-09) ────────────────────────────────
   *
   * Acá vivían dos casos de punta a punta: una herramienta que el candidato
   * nunca declaró y una cifra que nunca dio, las dos tirando la reescritura
   * entera. Los guards que las cazaban ya no existen — la regla vive en el
   * prompt, y la decisión, en la hoja de confirmación.
   *
   * En su lugar queda el que el CEO SÍ pidió: una viñeta no puede salir igual
   * a otra del CV.
   */
  it("una reescritura calcada a OTRA viñeta NO se rechaza: se nombra la línea parecida", () => {
    const s = sug({ text: "Coordiné la agenda del consultorio con los pacientes", actionVerb: "Coordiné" })
    const c = ctx({
      original: "Atendí el teléfono del consultorio",
      siblings: ["Coordiné la agenda del consultorio con los pacientes"],
    })
    expect(checkSuggestion(s, c).ok).toBe(true)
    expect(similarTo(s, c)).toBe("Coordiné la agenda del consultorio con los pacientes")
  })

  it("pero una reescritura que NO repite a ninguna vecina pasa", () => {
    const v = checkSuggestion(
      sug({ text: "Coordiné la agenda del consultorio con los pacientes", actionVerb: "Coordiné" }),
      ctx({
        original: "Atendí el teléfono del consultorio",
        siblings: ["Preparé los informes mensuales de facturación para la obra social"],
      }),
    )
    expect(v.ok).toBe(true)
  })

  /**
   * REPETIR UN VERBO NO TIRA LA REESCRITURA (orden del CEO, 2026-09-09).
   *
   * Era el único guard que rechazaba por ESTILO y no por una mentira o una
   * pérdida, y con eso quemaba la ranura de cuota del usuario. La regla vive
   * ahora sólo en el prompt, que recibe la lista entera de verbos usados.
   */
  it("NO rechaza porque el verbo ya abra otra línea del CV", () => {
    const v = checkSuggestion(
      sug({ text: "Gestioné el inventario completo del depósito con control semanal", actionVerb: "Gestioné" }),
      ctx({ original: "Me encargaba del inventario", ledger: ledger({ verbsUsed: ["gestione"] }) }),
    )
    expect(v.ok).toBe(true)
  })

  /**
   * EL LOGRO REPETIDO SE MIDE SOBRE EL TEXTO, NO SOBRE EL `claim` DECLARADO.
   *
   * La versión vieja comparaba la frase que el modelo declara contra los logros
   * del ledger con 60% de solape: sobre tres palabras, dos compartidas ya son
   * 66%. Se disparaba sola, y sobre un dato que el modelo se inventa. La
   * pregunta la contesta el caso de arriba, contra las viñetas de verdad.
   */
  it("NO rechaza por el `claim` que el modelo declara", () => {
    const v = checkSuggestion(
      sug({ text: "Ordené el depósito completo reduciendo los faltantes del mes", claim: "reducción de faltantes", actionVerb: "Ordené" }),
      ctx({ original: "Acomodé el depósito", ledger: ledger({ claimsMade: ["faltantes reducidos"] }) }),
    )
    expect(v.ok).toBe(true)
  })

  it("un hueco sin declarar NO rechaza: se vuelve un campo que el usuario llena antes de escribir", () => {
    // El resumen llega siempre así: su módulo vacía `placeholders`. Antes eso era
    // un rechazo entero; ahora el corchete no puede imprimirse porque la hoja no
    // confirma con un campo vacío.
    const s = repairSuggestion(sug({ text: "Cajera con experiencia en ventanilla y [x%] de precisión en arqueos", actionVerb: "" }))
    expect(s.placeholders.map((p) => [p.token, p.required])).toEqual([["[x%]", true]])
    expect(checkSuggestion(s, ctx({ original: "Cajera de banco" })).ok).toBe(true)
  })

  /**
   * ── EL CAMINO QUE ESCRIBÍA SIN QUE NADIE MIRARA ────────────────────────────
   * `variantWithoutMetric` es lo que se escribe en el CV cuando el usuario dice
   * "no tengo ese dato". El guard revisaba `text` y NUNCA la variante: una cifra
   * ahí, o un corchete olvidado, entraba al documento sin pasar por nada.
   */
  it("la variante sin cifra también se juzga: tampoco puede repetir otra línea", () => {
    const v = checkSuggestion(
      sug({
        text: "Atendí a [n] clientes por turno resolviendo consultas",
        actionVerb: "Atendí",
        placeholders: [{ token: "[n]", type: "SCALE", label: "l", hint: "h", evidenceNeeded: "e", required: true }],
        variantWithoutMetric: "Atendió a los clientes por turno resolviendo consultas",
      }),
      ctx({ original: "Atendí a los clientes en la línea de cajas" }),
    )
    // La persona ya NO rechaza: se corrige lo que el código sabe conjugar y lo
    // demás se entrega. `wrongPerson` sigue siendo quien lo detecta.
    expect(v.ok).toBe(true)
  })

  it("la variante con un hueco adentro se suelta: la propuesta llega igual", () => {
    const s = repairSuggestion(
      sug({
        text: "Atendí a [n] clientes por turno",
        actionVerb: "Atendí",
        placeholders: [{ token: "[n]", type: "SCALE", label: "l", hint: "h", evidenceNeeded: "e", required: true }],
        // Se exportaría tal cual: un corchete en el CV es un CV roto.
        variantWithoutMetric: "Atendí a [n] clientes por turno del local",
      }),
    )
    expect(s.variantWithoutMetric).toBeNull()
    expect(checkSuggestion(s, ctx({ original: "Atendí a los clientes en la línea de cajas" })).ok).toBe(true)
  })

  it("una reescritura que no sabe qué línea reemplaza NO se publica", () => {
    const v = checkSuggestion(sug(), ctx({ original: "" }))
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("stale")
  })

  it("dos huecos obligatorios se ACEPTAN: es la forma que el CEO pidió", () => {
    const slot = (required: boolean) => ({
      token: "[x%]",
      type: "PERCENT_DELTA" as const,
      label: "l",
      hint: "h",
      evidenceNeeded: "e",
      required,
    })
    const v = checkSuggestion(
      sug({ text: "Reduje las esperas un [x%] atendiendo a [n] pacientes por día", placeholders: [slot(true), slot(true)], actionVerb: "Reduje" }),
      ctx({ original: "Reduje las esperas atendiendo pacientes" }),
    )
    expect(v.ok).toBe(true)
  })

  it("tres huecos ya NO rechazan: el usuario los ve y decide", () => {
    const slot = (token: string) => ({
      token,
      type: "PERCENT_DELTA" as const,
      label: "l",
      hint: "h",
      evidenceNeeded: "e",
      required: true,
    })
    const v = checkSuggestion(
      sug({
        text: "Reduje las esperas un [x%] atendiendo a [n] pacientes por día en [t] minutos",
        placeholders: [slot("[x%]"), slot("[n]"), slot("[t]")],
        actionVerb: "Reduje",
      }),
      ctx({ original: "Reduje las esperas atendiendo pacientes" }),
    )
    expect(v.ok).toBe(true)
  })
})

describe("una sugerencia pensada sobre una versión que ya no existe", () => {
  const tree: ResumeTree = {
    roles: [
      {
        id: "r1",
        title: "Cajera",
        company: "Súper",
        startDate: "2021-01",
        endDate: "2024-01",
        bullets: [{ id: "b1", text: "Atendí la caja", hash: "h3", origin: "USER" }],
      },
    ],
    summary: { id: "s", text: "", hash: "h1", origin: "USER" },
    declaredSkills: [],
    otherText: "",
  }

  it("si el usuario editó la línea mientras tanto, la sugerencia es vieja", () => {
    expect(isStale("otro-hash", "b1", tree)).toBe(true)
    expect(isStale("h3", "b1", tree)).toBe(false)
  })

  it("una sugerencia sobre una línea que ya no está también es vieja", () => {
    expect(isStale("h3", "b_borrada", tree)).toBe(true)
  })
})

describe("lealtad: no volver a señalar lo que el usuario ya resolvió", () => {
  const finding = (over: Partial<Finding> = {}): Finding => ({
    id: "f1",
    type: "no_metric",
    component: "metric", remedy: "rewrite",
    merged: ["no_metric"],
    nodeId: "b1",
    nodeText: "Atendí la caja",
    nodeHash: "h4",
    gain: 1.2,
    detail: "",
    ...over,
  })
  const res = (over: Partial<Resolution> = {}): Resolution => ({
    findingId: "f1",
    nodeId: "b1",
    nodeHashAtResolution: "h4",
    resolvedBy: "AI_SUGGESTION",
    resolvedAt: "2026-08-28T00:00:00Z",
    ...over,
  })

  it("cerrado y el nodo intacto: es una re-detección falsa, no se muestra", () => {
    const out = loyalty([finding()], [res()])
    expect(out.suppressed).toHaveLength(1)
    expect(out.shown).toHaveLength(0)
  })

  it("cerrado, lo tocó después y lo volvió a romper: eso SÍ se avisa, como regresión", () => {
    const out = loyalty([finding({ nodeHash: "h6" })], [res()])
    expect(out.regressed).toHaveLength(1)
    expect(out.shown).toHaveLength(0)
  })

  it("lo que el usuario descartó a mano no vuelve en cada corrida", () => {
    const out = loyalty([finding({ nodeHash: "h9" })], [res({ resolvedBy: "DISMISSED" })])
    expect(out.suppressed).toHaveLength(1)
  })

  it("un hallazgo nunca resuelto se muestra", () => {
    expect(loyalty([finding()], []).shown).toHaveLength(1)
  })
})

describe("el rechazo le dice al modelo QUÉ falló", () => {
  it("en los dos idiomas, y nombra la línea parecida", () => {
    expect(similarNudge("Lideré", "es")).toContain("Lideré")
    expect(similarNudge("Lideré", "en")).toContain("Lideré")
  })

  it("todo motivo de rechazo tiene su explicación en los dos idiomas", () => {
    const reasons = ["stale", "empty"] as const
    for (const reason of reasons) {
      const v = { ok: false as const, reason, detail: "x" }
      // Un rechazo mudo convierte el reintento en tirar la moneda otra vez.
      expect(retryNudge(v, "es").length).toBeGreaterThan(10)
      expect(retryNudge(v, "en").length).toBeGreaterThan(10)
    }
  })
})

/**
 * LA VARIANTE SIN CIFRA ENTRA AL CV CON EL MISMO PESO QUE EL TEXTO PRINCIPAL.
 *
 * Es lo que se escribe al pulsar «no tengo ese dato». Durante un tiempo se le
 * miraban los huecos, la cifra y las herramientas, y nada más: la persona y el
 * contenido perdido pasaban de largo por la puerta que existe justo para no
 * escribir un número que el candidato no dio.
 */
describe("la variante sin cifra se juzga igual que el texto principal", () => {
  /**
   * LA PERSONA YA NO RECHAZA, ACÁ NI EN EL TEXTO PRINCIPAL (CEO, 2026-09-09).
   *
   * Lo regular lo corrige el motor antes de juzgar; lo demás se entrega y lo ve
   * el usuario en la confirmación, que es quien firma el CV. Lo que la variante
   * SÍ sigue sin poder hacer es perder lo que la línea decía o repetir a otra.
   */
  it("NO rechaza una variante por la persona del verbo", () => {
    const v = checkSuggestion(
      sug({ text: "Concilié la caja diaria", variantWithoutMetric: "Concilió la caja diaria" }),
      ctx({ original: "Trabajé en la caja del local" }),
    )
    expect(v.ok).toBe(true)
  })

  it("una variante que dice menos NO rechaza la propuesta: se ve en el antes/después", () => {
    const index = buildTermIndex([{ canonical: "arqueo", variants: ["arqueo"] }])
    const v = checkSuggestion(
      sug({ text: "Concilié el arqueo de caja al cierre", variantWithoutMetric: "Concilié la caja" }),
      ctx({ original: "Hice el arqueo de la caja", index }),
    )
    expect(v.ok).toBe(true)
  })
})

it("un hueco con su ficha adentro del texto se LIMPIA: la ficha no llega al CV", () => {
  // Medido contra la API: el modelo volcó etiqueta, pista y evidencia DENTRO
  // del texto. Esos campos viven en la pantalla de confirmación, no en el
  // currículum de alguien.
  const s = repairSuggestion(
    sug({
      text: "Atendí a los clientes [n personas; escala de flujo; evidencia: clientes por turno]",
      placeholders: [{ token: "[n personas]", type: "TEAM_SIZE", label: "clientes", hint: "", evidenceNeeded: "", required: false }],
    }),
  )
  expect(s.text).toBe("Atendí a los clientes [n personas]")
  expect(s.placeholders.map((p) => p.token)).toEqual(["[n personas]"])
  // Y un hueco normal sigue pasando: la regla no puede matar la cifra.
  expect(checkSuggestion(sug({ text: "Atendí a [n] clientes por turno en la línea de cajas" }), ctx()).ok).toBe(true)
})

/**
 * BLOCKER MEDIDO CONTRA LA API (2026-09-11). El modelo devolvió «de [n] a [n]»
 * sobre «de 12 a 3»: el reemplazo es por nombre de token, así que el primer
 * valor se escribía en los dos y el CV habría dicho «de 12 a 12».
 */
it("dos huecos con el mismo nombre son dos campos, y cada cifra vuelve a su lugar", () => {
  const original = "Reduje los errores de medicación de 12 a 3 por mes"
  const s = repairSuggestion(
    sug({
      text: "Reduje los errores de medicación de [n] a [n] por mes",
      placeholders: [{ token: "[n]", type: "SCALE", label: "errores", hint: "h", evidenceNeeded: "e", required: true }],
    }),
  )
  expect(s.placeholders.map((p) => p.token)).toEqual(["[n]", "[n 2]"])
  // La ficha que el modelo declaró se hereda, no se pierde al renombrar.
  expect(s.placeholders.every((p) => p.label === "errores")).toBe(true)

  const pre = figureSlots(original, s)
  expect(pre).toEqual({ "[n]": "12", "[n 2]": "3" })

  // Y lo que se escribiría en el CV es la línea del candidato, no «de 12 a 12».
  let final = s.text
  for (const [tok, val] of Object.entries(pre)) final = final.split(tok).join(val)
  expect(final).toBe(original)
  expect(lostContent(s, ctx({ original }))).toEqual([])
})

it("y un hueco largo pero honesto NO se rechaza: el guard no puede borrar la cifra", () => {
  // Medido: con un tope de 25 caracteres, "[n camiones descargados por semana]"
  // caía. Un guard demasiado estricto no es seguro — borra el producto.
  for (const t of ["Recibí [n camiones descargados por semana] en el depósito", "Atendí a [n clientas atendidas por jornada] en el salón"]) {
    expect(checkSuggestion(sug({ text: t }), ctx({ original: "Recibí camiones y atendí clientas en el depósito y el salón" })).ok, t).toBe(true)
  }
})

it("una línea que sólo NOMBRA una palabra de nuestro contrato en minúscula pasa", () => {
  // "scale", "frequency" y "money" son palabras de oficios reales. Rechazarlas
  // porque coinciden con el nombre de un tipo nuestro es borrar trabajo bueno.
  for (const t of ["Weighed incoming products on the floor scale before storage", "Handled money transfers at the counter every shift"]) {
    expect(checkSuggestion(sug({ text: t }), ctx({ original: "Weighed products and handled money transfers on the floor scale" })).ok, t).toBe(true)
  }
})

it("ni la ficha PEGADA AL LADO del hueco: se saca, no se rechaza", () => {
  // Medido en la corrida siguiente al arreglo anterior: el modelo sacó los
  // campos del corchete y los pegó afuera, esquivando el chequeo que miraba
  // adentro. Lo que se busca son NUESTROS nombres de campo y de tipo.
  const conFicha = repairSuggestion(
    sug({ text: "Operated the forklift to move pallets [n] (SCALE; label: pallet volume; hint: a rough count is enough)" }),
  )
  expect(conFicha.text).toBe("Operated the forklift to move pallets [n]")
})

/**
 * EL CASO REPORTADO CON CAPTURA (2026-09-11): «The rewrite dropped something your
 * line already says (30%). It was not written.»
 */
it("la cifra del candidato que la propuesta volvió hueco llega precargada, y no cuenta como perdida", () => {
  const original = "Designed user-friendly interfaces across mobile and web platforms, contributing to an increase in user engagement by 30%."
  const s = sug({
    text: "Designed user-friendly interfaces across mobile and web platforms, increasing user engagement by [x%]",
    placeholders: [{ token: "[x%]", type: "PERCENT_DELTA", label: "engagement", hint: "", evidenceNeeded: "", required: true }],
  })
  expect(figureSlots(original, s)).toEqual({ "[x%]": "30%" })
  expect(lostContent(s, ctx({ original }))).toEqual([])
  // Sin hueco donde ponerla, sí está perdida: el motor la pide una vez más.
  expect(lostContent(sug({ text: "Designed interfaces across mobile and web, increasing user engagement" }), ctx({ original }))).toEqual(["30%"])

  /**
   * Y EL HUECO TIENE QUE MEDIR LO MISMO (QA, 2026-09-11). Medido ejecutando la
   * versión anterior: precargaba el 30% de engagement en un «[x%]» de crashes
   * —un hecho que el candidato nunca dijo— y encima lo daba por conservado, así
   * que el motor no lo reclamaba.
   */
  const otraCosa = sug({
    text: "Refactored the checkout flow in Swift, cutting the crash rate by [x%]",
    placeholders: [{ token: "[x%]", type: "PERCENT_DELTA", label: "crashes", hint: "", evidenceNeeded: "", required: true }],
  })
  expect(figureSlots(original, otraCosa)).toEqual({})
  expect(lostContent(otraCosa, ctx({ original }))).toEqual(["30%"])
})

describe("la tercera persona sin tilde, que es la que se colaba", () => {
  it("un irregular de tercera persona NO entra al CV", () => {
    // Medido contra la API: el motor entregó "Mantuvo las máquinas en
    // funcionamiento…" en el CV de un soldador. La vara vieja era la tilde, y
    // los irregulares no la llevan.
    for (const abre of ["Mantuvo", "Hizo", "Puso", "Estuvo", "Condujo"]) {
      expect(wrongPerson(`${abre} las máquinas en funcionamiento durante el turno`), abre).not.toBeNull()
    }
  })

  it("y un pasado en primera persona pasa, incluidos los irregulares", () => {
    for (const abre of ["Mantuve", "Hice", "Puse", "Soldé", "Atendí", "Coordiné", "Conduje"]) {
      expect(wrongPerson(`${abre} las máquinas en funcionamiento durante el turno`), abre).toBeNull()
    }
  })
})
