import { describe, it, expect } from "vitest"
import {
  AIAts3Module,
  Ats3Error,
  OUTPUT_CONTRACT,
  jobPrompt,
  auditPrompt,
  triagePrompt,
  bulletPrompt,
  summaryPrompt,
  verifyPrompt,
  truthRule,
  figureRule,
} from "@/lib/services/ai/modules/AIAts3Module"
import type { IAIClient, ChatParams, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { JobSpec, ResumeTree } from "@/lib/ats3/contracts"

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
  ["P3 triage", triagePrompt],
  ["P4 viñeta", bulletPrompt],
  ["P5 resumen", summaryPrompt],
  ["P6 validador", verifyPrompt],
] as const

describe("los seis prompts existen en los dos idiomas", () => {
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

describe("ninguno de los seis pide puntos", () => {
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

  it("la línea entre enriquecer e inventar viaja en los dos prompts que escriben", () => {
    for (const build of [bulletPrompt, summaryPrompt]) {
      expect(build("es")).toContain(truthRule("es").split("\n")[0])
      expect(build("en")).toContain(truthRule("en").split("\n")[0])
    }
  })

  it("la regla de la cifra está en el prompt de viñeta, en los dos idiomas", () => {
    expect(bulletPrompt("es")).toContain(figureRule("es").split("\n")[0])
    expect(bulletPrompt("en")).toContain(figureRule("en").split("\n")[0])
  })

  it("el ALCANCE está prohibido: es la causa medida de la última invención", () => {
    // "…en depósito y sala de ventas" dice DÓNDE trabajaba esta persona. El
    // modelo lo escribía sin faltar a ninguna regla porque la lista de
    // prohibidos no lo nombraba.
    expect(truthRule("es").toLowerCase()).toContain("dónde")
    expect(truthRule("en").toLowerCase()).toContain("where")
  })

  it("el resumen NO admite huecos, en los dos idiomas", () => {
    expect(summaryPrompt("es").toLowerCase()).toContain("huecos")
    expect(summaryPrompt("en").toLowerCase()).toContain("slots")
  })

  it("el validador tiene prohibido marcar el enriquecimiento legítimo", () => {
    // Un validador que castiga explicar el oficio rompe justo lo que el
    // producto cobra.
    expect(verifyPrompt("es")).toContain("QUÉ NO ES UNA VIOLACIÓN")
    expect(verifyPrompt("en")).toContain("WHAT IS NOT A VIOLATION")
  })

  it("el triage nunca deja un puesto sin viñetas", () => {
    expect(triagePrompt("es")).toContain("única viñeta")
    expect(triagePrompt("en")).toContain("only bullet")
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
    const client = new ScriptedClient(JSON.stringify({ bullets: "no es un arreglo" }))
    await expect(mod(client).audit(tree, spec)).rejects.toMatchObject({ kind: "schema" })
  })

  it("los cuatro son el mismo síntoma para el usuario, y por eso se nombran distinto", async () => {
    const kinds = new Set<string>()
    for (const reply of ["", "no json", JSON.stringify({ bullets: 1 })]) {
      try {
        await mod(new ScriptedClient(reply)).audit(tree, spec)
      } catch (e) {
        if (e instanceof Ats3Error) kinds.add(e.kind)
      }
    }
    expect(kinds.size).toBe(3)
  })
})

describe("qué de lo que dice el verificador BLOQUEA de verdad", () => {
  /**
   * P6 no es el juez final: es un modelo opinando sobre otro. Las tres reglas
   * salieron de medir cinco oficios contra la API — hacerle caso a todo bajaba
   * la entrega de 14/15 a 9/15, y lo que tiraba era el valor del producto.
   */
  const verificador = (violations: { type: string; evidence: string }[]) =>
    new ScriptedClient(JSON.stringify({ verdict: violations.length ? "FAIL" : "PASS", violations }))

  it("un HUECO no es una cifra inventada: el hueco existe porque el candidato no la dio", async () => {
    const c = verificador([{ type: "FIGURE_NOT_GIVEN", evidence: "[n registros/turno]" }])
    expect((await mod(c).verify("Cargué los datos", "Cargué [n registros/turno]", [])).pass).toBe(true)
  })

  it("el vocabulario del oficio NO es una entidad inventada", async () => {
    // "estilismo" y "salón" describen el trabajo; la doctrina OBLIGA a nombrarlo.
    const c = verificador([{ type: "UNDECLARED_ENTITY", evidence: "organizar la agenda del salón" }])
    expect((await mod(c).verify("Atendí el teléfono", "Coordiné turnos y agenda del salón", [])).pass).toBe(true)
  })

  it("pero un NOMBRE PROPIO que nadie declaró sí bloquea", async () => {
    const c = verificador([{ type: "UNDECLARED_ENTITY", evidence: 'nombra "Temenos", que no está en el original' }])
    expect((await mod(c).verify("Atendí la caja", "Operé Temenos en la caja", [])).pass).toBe(false)
  })

  it("y inflar el rol bloquea siempre", async () => {
    const c = verificador([{ type: "INFLATED_ROLE", evidence: 'original dice "participé", reescritura dice "coordiné"' }])
    expect((await mod(c).verify("Participé en las reuniones", "Coordiné las reuniones", [])).pass).toBe(false)
  })
})

describe("lo que NO viaja al modelo", () => {
  it("ni nombre, ni edad, ni foto, ni nacionalidad", async () => {
    const client = new ScriptedClient(
      JSON.stringify({
        bullets: [],
        summary: { identity: true, proof: true, fit: true, extra: false },
        coverage: [],
        titleAlignment: 0.5,
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
