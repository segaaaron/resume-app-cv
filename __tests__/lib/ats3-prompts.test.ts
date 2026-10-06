import { describe, it, expect } from "vitest"
import {
  AIAts3Module,
  Ats3Error,
  OUTPUT_CONTRACT,
  jobPrompt,
  auditPrompt,
  bulletPrompt,
  summaryPrompt,
  truthRule,
  figureRule,
} from "@/lib/services/ai/modules/AIAts3Module"
import type { IAIClient, ChatParams, ChatCompletion } from "@/lib/interfaces/IAIClient"
import { PROMPT_VERSION, type JobSpec, type ResumeTree } from "@/lib/ats3/contracts"
import { createHash } from "node:crypto"

/**
 * Los seis prompts.
 *
 * Un prompt no se prueba por su salida —eso se mide contra la API real— sino
 * por lo que un descuido convierte en un defecto invisible: una rama que sólo
 * existe en un idioma, una regla que se olvidó, o una petición que la API
 * rechaza con un 400 que se lee como una mala respuesta del modelo.
 */

const PROMPTS = [
  ["P1 vacante", jobPrompt],
  ["P2 auditoría", auditPrompt],
  ["P4 viñeta", bulletPrompt],
  ["P5 resumen", summaryPrompt],
] as const

describe("los cinco prompts existen en los dos idiomas", () => {
  for (const [name, build] of PROMPTS) {
    it(`${name}: las dos ramas están escritas y son distintas`, () => {
      const es = build("es")
      const en = build("en")
      expect(es.length).toBeGreaterThan(200)
      expect(en.length).toBeGreaterThan(200)
      // Una rama que no existe no tiene comportamiento que observar: el defecto
      // es la OMISIÓN, y sólo se ve leyendo las dos.
      expect(es).not.toBe(en)
    })

    it(`${name}: ninguna rama quedó a medio traducir`, () => {
      // Una marca inequívoca de cada idioma. Si aparecen las dos en la misma
      // rama, alguien copió media plantilla.
      expect(/\bthe\b/i.test(build("es")) && /\bde la\b/i.test(build("es"))).toBe(false)
    })
  }
})

describe("ninguno de los cinco pide puntos", () => {
  for (const [name, build] of PROMPTS) {
    it(`${name}: prohíbe explícitamente devolver puntaje`, () => {
      // El modelo que escribe la mejora no puede decidir cuánto vale: no conoce
      // el resto del CV ni la rúbrica, así que infla sistemáticamente.
      expect(build("es").toLowerCase()).toContain("puntaje")
      expect(build("en").toLowerCase()).toMatch(/points|score/)
    })
  }
})

describe("las reglas que no pueden faltar", () => {
  it("la vacante se lee como dato de un tercero, no como instrucción", () => {
    expect(jobPrompt("es").toLowerCase()).toContain("tercero")
    expect(jobPrompt("en").toLowerCase()).toContain("untrusted")
  })

  it("la línea entre enriquecer e inventar viaja en el resumen; la viñeta es edición mínima", () => {
    // La viñeta NO la lleva: «tuyo es el resultado y el método» le daba permiso para agregar lo que no se pidió.
    expect(bulletPrompt("es")).toMatch(/EDICIÓN MÍNIMA/)
    expect(bulletPrompt("en")).toMatch(/MINIMAL EDIT/)
    for (const build of [summaryPrompt]) {
      expect(build("es")).toContain(truthRule("es").split("\n")[0])
      expect(build("en")).toContain(truthRule("en").split("\n")[0])
    }
  })

  it("la regla de la cifra está en el prompt de viñeta, en los dos idiomas", () => {
    expect(bulletPrompt("es")).toContain(figureRule("es").split("\n")[0])
    expect(bulletPrompt("en")).toContain(figureRule("en").split("\n")[0])
  })

  it("sólo las cifras son del candidato; todo lo demás lo escribe la IA (CEO, 2026-09-28)", () => {
    expect(truthRule("es")).toMatch(/Del candidato, y sólo suyo: las CIFRAS/)
    expect(truthRule("en")).toMatch(/only theirs: the FIGURES/)
    // La estructura tampoco se toca: empleadores, cargos y fechas.
    expect(truthRule("es")).toMatch(/empleadores, cargos y fechas/)
    expect(truthRule("en")).toMatch(/employers, job titles and dates/)
  })

  it("el resumen NO admite huecos, en los dos idiomas", () => {
    expect(summaryPrompt("es").toLowerCase()).toContain("huecos")
    expect(summaryPrompt("en").toLowerCase()).toContain("slots")
  })

})

// ── el borde con la API ──────────────────────────────────────────────────────

class ScriptedClient implements IAIClient {
  lastParams: ChatParams | null = null
  constructor(private reply: Partial<ChatCompletion["choices"][number]> | string) {}
  async chat(params: ChatParams): Promise<ChatCompletion> {
    this.lastParams = params
    const choice =
      typeof this.reply === "string"
        ? { index: 0, finish_reason: "stop", message: { role: "assistant", content: this.reply, refusal: null }, logprobs: null }
        : { index: 0, finish_reason: "stop", message: { role: "assistant", content: "", refusal: null }, logprobs: null, ...this.reply }
    return {
      id: "x",
      created: 0,
      model: "m",
      object: "chat.completion",
      choices: [choice as ChatCompletion["choices"][number]],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    }
  }
  async embed(): Promise<number[][]> {
    return []
  }
}

const mod = (client: IAIClient) => new AIAts3Module({ client, model: "m", language: "es" })

const SPEC_JSON = JSON.stringify({
  roleTitleRaw: "Cajera",
  roleTitleCanonical: "Cajera",
  metricThatMatters: "",
  seniority: null,
  yearsRequired: null,
  domain: null,
  workMode: null,
  language: "es",
  mustHave: [{ skill: "Arqueo de caja", raw: "arqueo", years: null, category: null }],
  niceToHave: [],
  responsibilities: [],
  softSignals: [],
})

describe("la petición que sale", () => {
  it("lleva la palabra JSON, o la API responde 400 y parece una mala respuesta", async () => {
    const client = new ScriptedClient(SPEC_JSON)
    await mod(client).parseJob("Buscamos cajera", "es")
    const system = String(client.lastParams!.messages[0].content)
    // El proyecto ya perdió una ronda entera de medición por este 400.
    expect(system.toLowerCase()).toContain("json")
    expect(system).toContain(OUTPUT_CONTRACT)
  })

  it("las reglas van arriba y los datos abajo: el prefijo se cachea entre llamadas", async () => {
    const client = new ScriptedClient(SPEC_JSON)
    await mod(client).parseJob("Buscamos cajera", "es")
    expect(client.lastParams!.messages[0].role).toBe("system")
    expect(String(client.lastParams!.messages[1].content)).toContain("Buscamos cajera")
  })

  it("NO manda temperatura: nuestro modelo la rechaza", async () => {
    const client = new ScriptedClient(SPEC_JSON)
    await mod(client).parseJob("Buscamos cajera", "es")
    expect(client.lastParams!.temperature).toBeUndefined()
  })
})

describe("los cuatro modos de fallo se distinguen", () => {
  const tree: ResumeTree = {
    roles: [],
    summary: { id: "summary", text: "", hash: "h", origin: "USER" },
    declaredSkills: [],
    otherText: "",
  }
  const spec = JSON.parse(SPEC_JSON) as JobSpec

  it("una respuesta rota se pide UNA vez más y, si la segunda sirve, el análisis sigue (QA, 2026-10-02)", async () => {
    let n = 0
    const buena = new ScriptedClient(SPEC_JSON)
    const client: IAIClient = {
      chat: async (p) => (++n === 1 ? new ScriptedClient("esto no es json").chat(p) : buena.chat(p)),
      embed: async () => [],
    }
    const spec2 = await mod(client).parseJob("Buscamos cajera con arqueo de caja", "es")
    expect(spec2.roleTitleRaw).toBe("Cajera")
    expect(n).toBe(2)
  })

  it("truncado: la respuesta se cortó por largo", async () => {
    const client = new ScriptedClient({ finish_reason: "length", message: { role: "assistant", content: "{", refusal: null } })
    await expect(mod(client).audit(tree, spec)).rejects.toMatchObject({ kind: "truncated" })
  })

  it("vacío: el modelo no devolvió contenido", async () => {
    const client = new ScriptedClient("")
    await expect(mod(client).audit(tree, spec)).rejects.toMatchObject({ kind: "empty" })
  })

  it("JSON inválido", async () => {
    const client = new ScriptedClient("esto no es json")
    await expect(mod(client).audit(tree, spec)).rejects.toMatchObject({ kind: "invalid_json" })
  })

  it("esquema: JSON válido que no cumple el contrato", async () => {
    const client = new ScriptedClient(JSON.stringify({ hard: "no es una lista" }))
    await expect(mod(client).audit(tree, spec)).rejects.toMatchObject({ kind: "schema" })
  })

  it("los cuatro son el mismo síntoma para el usuario, y por eso se nombran distinto", async () => {
    const kinds = new Set<string>()
    for (const reply of ["", "no json", JSON.stringify({ hard: 1 })]) {
      try {
        await mod(new ScriptedClient(reply)).audit(tree, spec)
      } catch (e) {
        if (e instanceof Ats3Error) kinds.add(e.kind)
      }
    }
    expect(kinds.size).toBe(3)
  })
})

/*
 * ── ACÁ SE MEDÍA QUÉ DE P6 BLOQUEABA (retirado el 2026-09-09) ───────────────
 * P6 era un modelo opinando sobre otro, y preguntaba exactamente lo mismo que
 * `invented_term` e `invented_figure`: el CEO mandó sacar los tres. Con los
 * guards fuera, dejar la llamada habría costado un turno del modelo por
 * reescritura para hacer cumplir una regla que ya no existe.
 */

describe("lo que NO viaja al modelo", () => {
  it("ni nombre, ni edad, ni foto, ni nacionalidad", async () => {
    const client = new ScriptedClient(
      JSON.stringify({
        coverage: [],
        softCoverage: [],
      }),
    )
    const tree: ResumeTree = {
      roles: [
        {
          id: "r1",
          title: "Cajera",
          company: "Súper",
          startDate: "2021-01",
          endDate: "2024-01",
          bullets: [{ id: "b1", text: "Atendí la caja", hash: "h", origin: "USER" }],
        },
      ],
      summary: { id: "summary", text: "Resumen", hash: "h", origin: "USER" },
      declaredSkills: ["Excel"],
      otherText: "",
    }
    await mod(client).audit(tree, JSON.parse(SPEC_JSON) as JobSpec)
    const body = String(client.lastParams!.messages[1].content)
    // Un motor que compara CV contra vacante puede reproducir el sesgo del
    // propio aviso. Lo que no viaja no puede pesar.
    for (const field of ["email", "phone", "photo", "birth", "nationality", "gender"]) {
      expect(body.toLowerCase()).not.toContain(field)
    }
  })
})

/**
 * UN PROMPT QUE CAMBIA SIN SUBIR SU VERSIÓN NO LLEGA NUNCA AL USUARIO.
 *
 * Cada respuesta se guarda bajo una clave que incluye `PROMPT_VERSION`. Si el
 * texto del prompt cambia y la versión no, el caché sigue sirviendo lo que
 * contestó la pregunta VIEJA: se toca el prompt, se despliega, y la pantalla no
 * cambia. Este proyecto ya pagó ese día completo.
 *
 * Esto no adivina qué versión corresponde: ata el texto de hoy a la versión de
 * hoy. Cambiar el prompt pone el caso en rojo, y la única forma de volver a
 * verde es subir la versión —que es exactamente lo que hay que hacer.
 */
describe("cada prompt viaja con su versión", () => {
  const huella = (texto: string) => createHash("sha256").update(texto).digest("hex").slice(0, 12)
  const HOY: Record<string, { version: string; huella: string }> = {
    P1: { version: PROMPT_VERSION.P1, huella: huella(jobPrompt("es") + jobPrompt("en")) },
    P2: { version: PROMPT_VERSION.P2, huella: huella(auditPrompt("es") + auditPrompt("en")) },
    P4: { version: PROMPT_VERSION.P4, huella: huella(bulletPrompt("es") + bulletPrompt("en")) },
    P5: { version: PROMPT_VERSION.P5, huella: huella(summaryPrompt("es") + summaryPrompt("en")) },
  }
  /**
   * La foto: qué versión corresponde a qué texto, al 2026-08-29. Se actualiza a
   * mano y a propósito — es la anotación que obliga a decidir.
   */
  const ESPERADO: Record<string, { version: string; huella: string }> = {
    P1: { version: "p1-7", huella: "f0325343abae" },
    P2: { version: "p2-3", huella: "f9ac12d64c64" },
    P3: { version: "p3-2", huella: "803c27a27688" },
    P4: { version: "p4-7", huella: "ca8d87a558c6" },
    P5: { version: "p5-2", huella: "16c8d141794d" },
    P6: { version: "p6-1", huella: "bc421672bcc5" },
  }

  for (const id of Object.keys(HOY)) {
    it(`${id}: si el texto cambió, la versión tiene que subir`, () => {
      const actual = HOY[id]
      const anotado = ESPERADO[id]
      if (actual.huella !== anotado.huella) {
        expect(
          actual.version,
          `El texto de ${id} cambió. Subí PROMPT_VERSION.${id} y anotá la huella nueva (${actual.huella}) acá.`,
        ).not.toBe(anotado.version)
      } else {
        expect(actual.version).toBe(anotado.version)
      }
    })
  }
})

describe("lo que la reescritura tiene que decirle al modelo, en los dos idiomas", () => {
  it("las skills a escribir van tal cual las escribe el aviso", () => {
    expect(bulletPrompt("es")).toMatch(/tal cual la escribe el aviso/)
    expect(bulletPrompt("en")).toMatch(/exactly as the posting writes it/)
  })

  it("Tailor ejecuta al ATS sin cambiar hechos ni subir el rol", () => {
    expect(bulletPrompt("es")).toMatch(/Cada HECHO de la línea original se queda/)
    expect(bulletPrompt("en")).toMatch(/Every FACT of the original line stays/)
    expect(bulletPrompt("es")).toMatch(/nivel de participación es un hecho/)
    expect(bulletPrompt("en")).toMatch(/level of involvement is a fact/)
    expect(bulletPrompt("es")).toMatch(/casi lo mismo que la original ni que ninguna de OTRAS LÍNEAS/)
    expect(bulletPrompt("en")).toMatch(/nearly the same as the original nor as any of the OTHER LINES/)
  })

  it("el hueco dice que un aproximado alcanza, y que lo pone el candidato", () => {
    expect(figureRule("es")).toMatch(/aproximado o un rango alcanza/)
    expect(figureRule("en")).toMatch(/approximate figure or a range is enough/)
    expect(figureRule("es")).toMatch(/vos no escribís uno/)
    expect(figureRule("en")).toMatch(/you never write one/)
  })

  it("la vacante NO parte una sigla en dos requisitos", () => {
    expect(jobPrompt("es")).toMatch(/UN solo requisito, no dos/)
    expect(jobPrompt("en")).toMatch(/ONE requirement, not two/)
    expect(jobPrompt("es")).toMatch(/NUNCA deduzcas la expansión/)
    expect(jobPrompt("en")).toMatch(/NEVER derive the expansion/)
  })

  it("el resumen prueba con un resultado, no con cualidades declaradas", () => {
    expect(summaryPrompt("es")).toMatch(/declara cualidades en vez de mostrar un resultado/)
    expect(summaryPrompt("en")).toMatch(/declares qualities instead of showing a result/)
  })
})

/**
 * Los esquemas del módulo, contra el peor caso: TODOS los campos en null. El
 * diagnóstico es el que más importa — corre en cada análisis.
 */
describe("tampoco mueren los esquemas del módulo", () => {
  const responde = (payload: unknown): IAIClient => ({
    async chat() {
      return { choices: [{ message: { content: JSON.stringify(payload) }, finish_reason: "stop" }] } as unknown as ChatCompletion
    },
    async embed() { return [] },
  })
  const mod = (c: IAIClient) => new AIAts3Module({ client: c, model: "m", language: "es" })
  const linea = (id: string, text: string) => ({ id, text, hash: id, origin: "USER" as const })
  const tree = {
    roles: [{ id: "r", title: "Cajera", company: "X", startDate: "2023-01", endDate: "", bullets: [linea("a", "Hice el inventario mensual"), linea("b", "Cuadré la caja al cierre")] }],
    summary: linea("summary", ""),
    declaredSkills: [],
    otherText: "",
  } as unknown as ResumeTree

  it("el diagnóstico (P2) sobrevive a una respuesta con todo en null", async () => {
    const r = await mod(responde({ hard: null, soft: null, conditions: null })).audit(tree, {} as JobSpec)
    expect(r.hard).toEqual([])
    expect(r.soft).toEqual([])
  })

  it("la vacante se pide ORDENADA por peso, y dice qué número le importa al puesto", () => {
    for (const p of [jobPrompt("es"), jobPrompt("en")]) {
      expect(p).toMatch(/PESO REAL|REAL WEIGHT/)
      expect(p).toMatch(/metricThatMatters/)
    }
  })

  it("una soft se demuestra con un logro de una viñeta, nunca con el resumen", () => {
    expect(auditPrompt("es")).toMatch(/nunca el resumen/)
    expect(auditPrompt("en")).toMatch(/never the summary/)
  })
})

/**
 * EL DIAGNÓSTICO CONTESTA POR REFERENCIA: lo que no es de la lista de la
 * vacante no tiene dónde caer, y una línea que no existe no es evidencia.
 */
describe("el diagnóstico habla de la lista de la vacante, y de nada más", () => {
  const tree: ResumeTree = {
    roles: [{ id: "r", title: "Cajera", company: "X", startDate: "2023-01", endDate: "", bullets: [{ id: "b1", text: "Cuadré la caja", hash: "h", origin: "USER" }] }],
    summary: { id: "summary", text: "Cajera", hash: "h", origin: "USER" },
    declaredSkills: [],
    otherText: "",
  }
  const spec = {
    ...JSON.parse(SPEC_JSON),
    niceToHave: [{ skill: "Excel", raw: "Excel", years: null, category: null }],
    softSignals: ["trabajo en equipo", "comunicación"],
  } as JobSpec
  const respuesta = JSON.stringify({
    bullets: [],
    summary: { identity: true, proof: false, fit: false, extra: false },
    hard: [
      { ref: "M1", status: "demonstrated", evidenceNodeId: "b1", writeIn: null, question: null, cvWording: "arqueo de caja" },
      { ref: "M1", status: "missing" }, // repetida
      { ref: "M9", status: "demonstrated" }, // no existe
      { ref: "n1", status: "missing", writeIn: "no-existe", question: "¿Usaste Excel?" },
    ],
    soft: [
      { ref: "S1", status: "demonstrated", evidenceNodeId: "summary" },
      { ref: "S7", status: "demonstrated", evidenceNodeId: "b1" }, // inventada
    ],
  })

  it("una cita larga se recorta, no se pierde (QA, 2026-10-02)", async () => {
    const largo = JSON.stringify({
      hard: [{ ref: "M1", status: "demonstrated", evidenceNodeId: "b1", writeIn: null, question: null, cvWording: "y".repeat(300) }],
      soft: [],
    })
    const a = await mod(new ScriptedClient(largo)).audit(tree, spec)
    expect(a.hard[0]?.cvWording?.length).toBe(160)
  })

  it("le manda al modelo las blandas y los requisitos, cada uno con su referencia", async () => {
    const client = new ScriptedClient(respuesta)
    await mod(client).audit(tree, spec)
    const pedido = String(client.lastParams!.messages[1].content)
    expect(pedido).toContain('"ref":"S1"')
    expect(pedido).toContain('"signal":"trabajo en equipo"')
    expect(pedido).toContain('"ref":"M1"')
  })

  it("traduce la referencia al nombre de la vacante y descarta lo que no está en la lista", async () => {
    const a = await mod(new ScriptedClient(respuesta)).audit(tree, spec)
    expect(a.hard).toEqual([
      { skill: "Arqueo de caja", requirement: "MUST", status: "demonstrated", evidenceNodeId: "b1", writeIn: null, question: null, cvWording: "arqueo de caja" },
      { skill: "Excel", requirement: "NICE", status: "missing", evidenceNodeId: null, writeIn: null, question: "¿Usaste Excel?", cvWording: null },
    ])
    // Una soft «demostrada» en el resumen no tiene logro detrás: la cita se cae.
    expect(a.soft).toEqual([{ signal: "trabajo en equipo", status: "demonstrated", evidenceNodeId: null, writeIn: null }])
  })
})

/** LO QUE EL ATS DECIDIÓ SOBRE LA LÍNEA LLEGA A TAILOR TAL CUAL. */
describe("el pedido a Tailor lleva la decisión del ATS", () => {
  const vacia = JSON.stringify({ changed: true, text: "Emití facturas electrónicas ante el SIN", bulletId: "b", actionVerb: "Emití", keywordsUsed: [], claim: "", metricType: null, placeholders: [], variantWithoutMetric: null, measurableAspect: null })
  const spec = JSON.parse(SPEC_JSON) as JobSpec

  it("viñeta: motivo, instrucción, skills, cifra, respuesta y los hechos del puesto", async () => {
    const client = new ScriptedClient(vacia)
    await mod(client).rewriteBullet({
      original: "SIN: emití facturas", bulletId: "b", roleContext: "Cajera — X", language: "es",
      reason: "Sirve, pero no dice el sistema.", terms: ["SIN"], needsFigure: true,
      told: "bajó la fila en caja", roleLines: ["Cuadré la caja"], siblings: ["Cuadré la caja"],
    })
    const pedido = String(client.lastParams!.messages[1].content)
    // La instrucción libre del ATS no viaja: Tailor sólo inserta lo verificable.
    expect(pedido).not.toContain("LO QUE PIDE EL ATS")
    expect(pedido).toContain('SKILLS A ESCRIBIR / SKILLS TO WRITE:\n["SIN"]')
    expect(pedido).toContain("ESTA LÍNEA LLEVA SU TAMAÑO")
    expect(pedido).toContain('LO QUE LA PERSONA CONTÓ / WHAT THE PERSON TOLD:\n"""bajó la fila en caja"""')
    expect(pedido).toContain('ESTE PUESTO YA DICE / THIS ROLE ALREADY SAYS:\n["Cuadré la caja"]')
  })

  it("resumen: los años medidos y los términos comprometidos", async () => {
    const client = new ScriptedClient(vacia)
    await mod(client).rewriteSummary({
      current: "Cajera", cvLines: [], otherSections: "", spec, topBullets: [], declaredSkills: [],
      mustWrite: ["Cajera de Supermercado"], yearsOfExperience: 4, provenTerms: ["Arqueo de caja"],
    })
    const pedido = String(client.lastParams!.messages[1].content)
    expect(pedido).toContain("AÑOS DE EXPERIENCIA / YEARS OF EXPERIENCE:\n4")
    expect(pedido).toContain('["Cajera de Supermercado"]')
    expect(pedido).toContain('POSTING TERMS THIS PERSON HAS ALREADY PROVEN:\n["Arqueo de caja"]')
  })
})
