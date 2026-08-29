import { describe, it, expect } from "vitest"
import {
  checkSuggestion,
  inventedTerms,
  inventedFigure,
  droppedTerms,
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
  declared: [],
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

describe("una capacidad inventada se rechaza", () => {
  it("nombra una herramienta que no está en el original ni en lo declarado", () => {
    const c = ctx({
      original: "Llevé el control del stock del depósito",
      index: buildTermIndex([{ canonical: "SAP", variants: [] }, { canonical: "Excel", variants: [] }]),
      declared: ["Excel"],
    })
    expect(inventedTerms("Llevé el control del stock del depósito en SAP", c)).toEqual(["SAP"])
  })

  it("pero SÍ puede nombrar lo que el candidato declaró en sus habilidades", () => {
    const c = ctx({
      original: "Llevé el control del stock del depósito",
      index: buildTermIndex([{ canonical: "Excel", variants: [] }]),
      declared: ["Excel"],
    })
    expect(inventedTerms("Llevé el control del stock del depósito con planillas de Excel", c)).toEqual([])
  })
})

describe("tejer el término de la vacante NO es afirmar de más", () => {
  /**
   * Medido contra la API real: "Atendí a los clientes en la línea de cajas" →
   * "Realicé atención al público en línea de cajas…". El guard marcaba
   * "atención al público" como capacidad afirmada de la nada y rechazaba 3 de 3
   * reescrituras. Tejer el término que la vacante busca es para lo que sirve el
   * producto.
   */
  it("acepta el término del aviso cuando la línea ya habla de eso", () => {
    const c = ctx({
      original: "Atendí a los clientes en la línea de cajas",
      index: buildTermIndex([{ canonical: "Atención al público", variants: ["atención al cliente"] }]),
    })
    expect(inventedTerms("Realicé atención al público en línea de cajas gestionando cobros", c)).toEqual([])
  })

  it("pero NO lo acepta cuando la línea no lo respalda", () => {
    const c = ctx({
      original: "Llevé el control del stock del depósito",
      index: buildTermIndex([{ canonical: "SAP", variants: [] }, { canonical: "Gestión de SAP", variants: [] }]),
    })
    expect(inventedTerms("Llevé la gestión de SAP del depósito", c)).toContain("Gestión de SAP")
  })

  /**
   * ── EL LÍMITE DEL GUARD, MEDIDO Y ESCRITO PARA QUE NADIE LO REINTENTE ──────
   *
   * "Gestión de Salesforce" apoyada sólo en la palabra "gestión" PASA este
   * guard, y es deliberado. La vara estricta —exigir la palabra más específica—
   * se midió contra la API en cinco oficios y rechazó 3 de 15 líneas que eran
   * trabajo legítimo ("control de calidad de cordón" sobre "Revisé que las
   * piezas salieran bien"; "manejo de grupo" sobre "Di clases a los chicos").
   * Cerrar ese 20% de falsos positivos cuesta el valor central del producto.
   *
   * El caso NO queda sin dueño: lo juzga P6, y en esa misma medición lo hizo
   * bien —cazó "sistema clínico" como entidad que el original no sostiene—.
   * El código decide lo que puede PROBAR; lo semántico tiene verificador.
   */
  it("un término apoyado en una sola palabra pasa el código y queda para P6", () => {
    const c = ctx({
      original: "Hice la gestión de turnos del consultorio",
      index: buildTermIndex([{ canonical: "Gestión de Salesforce", variants: [] }]),
    })
    expect(inventedTerms("Hice la gestión de Salesforce del consultorio", c)).toEqual([])
  })

  it("pero un término sin NADA en común sigue rechazado por el código", () => {
    const c = ctx({
      original: "Llevé el control del stock del depósito",
      index: buildTermIndex([{ canonical: "Anestesia general", variants: [] }]),
    })
    expect(inventedTerms("Apliqué anestesia general en el depósito", c)).toContain("Anestesia general")
  })
})

describe("EL CASO QUE UN GUARD ANCHO ROMPERÍA — y es lo que el producto cobra", () => {
  /**
   * "Realicé el arqueo" → "Cuadré efectivo, comprobantes y diferencias del
   * turno". Seis palabras nuevas, ninguna es un hecho sobre la persona: es lo
   * que un arqueo ES. La vara "palabras que no estaban antes" rechazaría esto,
   * y con eso se cae el valor entero del producto.
   */
  it("enriquecer con el vocabulario del oficio NO es inventar", () => {
    const c = ctx({ original: "Realicé el arqueo de caja", index: buildTermIndex([{ canonical: "Arqueo de caja", variants: ["arqueo"] }]) })
    expect(inventedTerms("Cuadré efectivo, comprobantes y diferencias del turno en el arqueo de caja", c)).toEqual([])
  })

  it("lo mismo en un oficio manual", () => {
    const c = ctx({ original: "Hice mantenimiento de las máquinas", index: buildTermIndex([]) })
    expect(inventedTerms("Ejecuté el mantenimiento preventivo de las máquinas revisando lubricación y desgaste", c)).toEqual([])
  })
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
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("wrong_person")
  })
})

describe("la cifra la escribe el candidato", () => {
  it("un número que el original no tenía se rechaza", () => {
    expect(inventedFigure("Reduje las esperas un 40%", "Reduje las esperas", sug())).toBe("40")
  })

  it("un hueco tipado NO es una violación: es exactamente lo que se pide", () => {
    expect(inventedFigure("Reduje las esperas un [x%]", "Reduje las esperas", sug())).toBeNull()
  })

  it("la cifra que el candidato ya había escrito sobrevive sin acusarlo", () => {
    expect(inventedFigure("Atendí 40 mesas por turno con dos mozos", "Atendí 40 mesas", sug())).toBeNull()
  })

  it("el mismo número escrito distinto es el mismo número", () => {
    expect(inventedFigure("Facturé 1,400 dólares", "Facturé 1.400 dólares", sug())).toBeNull()
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
   * Estos dos casos existen porque su ausencia se MIDIÓ: con los guards de
   * invención desconectados a propósito, los 27 tests seguían en verde. Probar
   * la función suelta no prueba que el chequeo completo la LLAME.
   */
  it("rechaza de punta a punta una herramienta que el candidato nunca declaró", () => {
    const v = checkSuggestion(
      sug({ text: "Controlé el stock del depósito con SAP y reportes semanales", actionVerb: "Controlé" }),
      ctx({
        original: "Llevé el control del stock del depósito",
        index: buildTermIndex([{ canonical: "SAP", variants: [] }]),
        declared: ["Excel"],
      }),
    )
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("invented_term")
  })

  it("rechaza de punta a punta una cifra que el candidato nunca dio", () => {
    const v = checkSuggestion(
      sug({ text: "Reduje las esperas un 40% reorganizando la atención del turno", actionVerb: "Reduje" }),
      ctx({ original: "Reduje las esperas reorganizando la atención" }),
    )
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("invented_figure")
  })

  it("rechaza si el verbo ya abre otra línea del CV", () => {
    const v = checkSuggestion(
      sug({ text: "Gestioné el inventario completo del depósito con control semanal", actionVerb: "Gestioné" }),
      ctx({ original: "Me encargaba del inventario", ledger: ledger({ verbsUsed: ["gestione"] }) }),
    )
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("verb_collision")
  })

  it("rechaza si el logro ya tiene dueño en otra viñeta", () => {
    const v = checkSuggestion(
      sug({ text: "Ordené el depósito completo reduciendo los faltantes del mes", claim: "reducción de faltantes", actionVerb: "Ordené" }),
      ctx({ original: "Acomodé el depósito", ledger: ledger({ claimsMade: ["faltantes reducidos"] }) }),
    )
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("duplicate_claim")
  })

  it("el resumen NO puede llevar un hueco: es la primera línea que se lee", () => {
    const v = checkSuggestion(
      sug({ text: "Cajera con experiencia en ventanilla y [x%] de precisión en arqueos", actionVerb: "" }),
      ctx({ original: "Cajera con experiencia en ventanilla y arqueos", isSummary: true }),
    )
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("placeholder_in_summary")
  })

  /**
   * ── EL CAMINO QUE ESCRIBÍA SIN QUE NADIE MIRARA ────────────────────────────
   * `variantWithoutMetric` es lo que se escribe en el CV cuando el usuario dice
   * "no tengo ese dato". El guard revisaba `text` y NUNCA la variante: una cifra
   * ahí, o un corchete olvidado, entraba al documento sin pasar por nada.
   */
  it("la variante sin cifra también se juzga: no puede traer un número inventado", () => {
    const v = checkSuggestion(
      sug({
        text: "Atendí a [n] clientes por turno resolviendo consultas",
        actionVerb: "Atendí",
        placeholders: [{ token: "[n]", type: "SCALE", label: "l", hint: "h", evidenceNeeded: "e", required: true }],
        variantWithoutMetric: "Atendí a 300 clientes por turno resolviendo consultas",
      }),
      ctx({ original: "Atendí a los clientes en la línea de cajas" }),
    )
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("invented_figure")
  })

  it("la variante NO puede quedarse con un hueco sin llenar", () => {
    const v = checkSuggestion(
      sug({
        text: "Atendí a [n] clientes por turno",
        actionVerb: "Atendí",
        placeholders: [{ token: "[n]", type: "SCALE", label: "l", hint: "h", evidenceNeeded: "e", required: true }],
        // Se exporta tal cual: un corchete en el CV es un CV roto.
        variantWithoutMetric: "Atendí a [n] clientes por turno del local",
      }),
      ctx({ original: "Atendí a los clientes en la línea de cajas" }),
    )
    expect(v.ok).toBe(false)
  })

  it("una reescritura que no sabe qué línea reemplaza NO se publica", () => {
    const v = checkSuggestion(sug(), ctx({ original: "" }))
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("stale")
  })

  it("más de un hueco obligatorio se rechaza", () => {
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
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toBe("too_many_placeholders")
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
  it("en los dos idiomas, y nunca vacío", () => {
    const v = { ok: false as const, reason: "verb_collision" as const, detail: "Lideré" }
    expect(retryNudge(v, "es")).toContain("Lideré")
    expect(retryNudge(v, "en")).toContain("Lideré")
    expect(retryNudge(v, "es").length).toBeGreaterThan(10)
    expect(retryNudge(v, "en").length).toBeGreaterThan(10)
  })

  it("todo motivo de rechazo tiene su explicación en los dos idiomas", () => {
    const reasons = [
      "invented_term", "invented_figure", "verb_collision", "keyword_over_budget",
      "duplicate_claim", "drops_content", "adds_nothing", "too_many_placeholders",
      "placeholder_in_summary", "stale", "empty",
    ] as const
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
  it("rechaza una variante escrita en tercera persona", () => {
    const v = checkSuggestion(
      sug({ text: "Concilié la caja diaria", variantWithoutMetric: "Concilió la caja diaria" }),
      ctx({ original: "Trabajé en la caja del local" }),
    )
    expect(v.ok).toBe(false)
    expect(v.ok ? "" : v.reason).toBe("wrong_person")
  })

  it("rechaza una variante que se come lo que la línea decía", () => {
    const index = buildTermIndex([{ canonical: "arqueo", variants: ["arqueo"] }])
    const v = checkSuggestion(
      sug({ text: "Concilié el arqueo de caja al cierre", variantWithoutMetric: "Concilié la caja" }),
      ctx({ original: "Hice el arqueo de la caja", index }),
    )
    expect(v.ok).toBe(false)
    expect(v.ok ? "" : v.reason).toBe("drops_content")
  })
})

it("un hueco con su ficha adentro del texto se rechaza: eso se escribiría en el CV", () => {
  // Medido contra la API: el modelo volcó etiqueta, pista y evidencia DENTRO
  // del texto. Esos campos viven en la pantalla de confirmación, no en el
  // currículum de alguien.
  const v = checkSuggestion(
    sug({
      text: "Atendí a los clientes [n personas; escala de flujo; evidencia: clientes por turno]",
      placeholders: [{ token: "[n personas]", type: "TEAM_SIZE", label: "clientes", hint: "", evidenceNeeded: "", required: false }],
    }),
    ctx(),
  )
  expect(v.ok).toBe(false)
  expect(v.ok ? "" : v.reason).toBe("too_many_placeholders")
  // Y un hueco normal sigue pasando: la regla no puede matar la cifra.
  expect(checkSuggestion(sug({ text: "Atendí a [n] clientes por turno en la línea de cajas" }), ctx()).ok).toBe(true)
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

it("ni la ficha PEGADA AL LADO del hueco: es lo mismo impreso en el CV", () => {
  // Medido en la corrida siguiente al arreglo anterior: el modelo sacó los
  // campos del corchete y los pegó afuera, esquivando el chequeo que miraba
  // adentro. Lo que se busca son NUESTROS nombres de campo y de tipo.
  const conFicha = checkSuggestion(
    sug({ text: "Operated the forklift to move pallets [n] (SCALE; label: pallet volume; hint: a rough count is enough)" }),
    ctx({ original: "Moved pallets with the forklift" }),
  )
  expect(conFicha.ok).toBe(false)
  expect(conFicha.ok ? "" : conFicha.reason).toBe("too_many_placeholders")
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
