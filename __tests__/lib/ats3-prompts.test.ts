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
  ["P3 triage", triagePrompt],
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
        bullets: [],
        summary: { identity: true, proof: true, fit: true, extra: false },
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
    P3: { version: PROMPT_VERSION.P3, huella: huella(triagePrompt("es") + triagePrompt("en")) },
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
  it("la reescritura usa la redacción del aviso, no un sinónimo — en los dos idiomas", () => {
    // El filtro tradicional compara CADENAS: «project management» y «led
    // projects» no son lo mismo para él. Medido por la práctica documentada de
    // los parsers, no por opinión nuestra.
    expect(bulletPrompt("es")).toMatch(/redacción EXACTA del aviso/)
    expect(bulletPrompt("en")).toMatch(/EXACT wording/)
    // Y la sigla con su forma completa la primera vez.
    expect(bulletPrompt("es")).toMatch(/sigla/)
    expect(bulletPrompt("en")).toMatch(/acronym/)
  })

  it("una línea intercambiable con la de cualquiera no aporta, y no se arregla inventando", () => {
    for (const p of [bulletPrompt("es"), bulletPrompt("en")]) {
      expect(p).toMatch(/ESPECIFICIDAD|SPECIFICITY/)
      // La salvedad es lo que impide que esta regla se lea como licencia.
      expect(p).toMatch(/poco del original|too little of the original/)
    }
  })

  it("el hueco dice que un aproximado alcanza, y que lo pone el candidato", () => {
    expect(figureRule("es")).toMatch(/aproximado o un rango alcanza/)
    expect(figureRule("en")).toMatch(/approximate figure or a range is enough/)
    expect(figureRule("es")).toMatch(/vos no escribís uno/)
    expect(figureRule("en")).toMatch(/you never write one/)
  })

  it("la vacante NO parte una sigla en dos requisitos", () => {
    // «CI/CD» y «integración continua» en el mismo aviso son UNA exigencia. En
    // dos, el denominador del puntaje crece con una fila fantasma y el candidato
    // aparece cubriendo la mitad de algo que cubre entero.
    expect(jobPrompt("es")).toMatch(/UN solo requisito, no dos/)
    expect(jobPrompt("en")).toMatch(/ONE requirement, not two/)
    expect(jobPrompt("es")).toMatch(/NUNCA deduzcas la expansión/)
    expect(jobPrompt("en")).toMatch(/NEVER derive the expansion/)
  })

  it("FOUND es lo que el filtro puede ver, no lo que el modelo entiende", () => {
    // Marcar cubierto por comprensión propia es el peor error que puede cometer
    // la auditoría: le dice a alguien que pasa un filtro que lo va a descartar.
    expect(auditPrompt("es")).toMatch(/lo que el filtro puede ver|lo que el filtro puede ver/i)
    expect(auditPrompt("en")).toMatch(/what the filter can see/i)
  })

  it("una línea genérica no puede quedarse quieta: es REWRITE, no KEEP", () => {
    expect(triagePrompt("es")).toMatch(/cualquier otro postulante/)
    expect(triagePrompt("en")).toMatch(/any other applicant/)
  })

  it("el resumen prueba con un resultado, no con cualidades declaradas", () => {
    expect(summaryPrompt("es")).toMatch(/declara cualidades en vez de mostrar un resultado/)
    expect(summaryPrompt("en")).toMatch(/declares qualities instead of showing a result/)
  })
})

/**
 * Los tres esquemas que viven en el módulo de prompts, contra el mismo peor
 * caso: TODOS los campos en null. La auditoría es el que más importa — corre en
 * cada análisis, así que si muere, muere la corrida entera.
 */
describe("tampoco mueren los esquemas del módulo", () => {
  const responde = (payload: unknown): IAIClient => ({
    async chat() {
      return { choices: [{ message: { content: JSON.stringify(payload) }, finish_reason: "stop" }] } as unknown as ChatCompletion
    },
    async embed() { return [] },
  })
  const mod = (c: IAIClient) => new AIAts3Module({ client: c, model: "m", language: "es" })

  it("la auditoría (P2) sobrevive a una respuesta con todo en null", async () => {
    const c = responde({ bullets: null, summary: null, coverage: null})
    const r = await mod(c).audit({ roles: [], summary: { id: "summary", text: "", hash: "h", origin: "USER" }, declaredSkills: [], otherText: "" } as ResumeTree, {} as JobSpec)
    expect(r.bullets).toEqual([])
    // Lo que el auditor no pudo afirmar NO cuenta como cumplido.
    expect(r.summary.identity).toBe(false)
  })

  it("el triage (P3) descarta el veredicto ilegible y entrega los demás", async () => {
    const c = responde({ decisions: [{ bulletId: null, verdict: "NO_EXISTE" }, { bulletId: "b1", verdict: "KEEP", reason: null, relevance: null }] })
    const r = await mod(c).triage({ roles: [], summary: { id: "summary", text: "", hash: "h", origin: "USER" }, declaredSkills: [], otherText: "" } as ResumeTree, {} as JobSpec, { bullets: [], summary: { identity: false, proof: false, fit: false, extra: false }, coverage: [], softCoverage: []}, {})
    expect(r.map((d) => d.bulletId)).toEqual(["b1"])
  })

  it("la vacante se pide ORDENADA por peso, y dice qué número le importa al puesto", () => {
    for (const p of [jobPrompt("es"), jobPrompt("en")]) {
      expect(p).toMatch(/PESO REAL|REAL WEIGHT/)
      expect(p).toMatch(/metricThatMatters/)
    }
  })

  it("las blandas se juzgan con su logro, en los dos idiomas", () => {
    expect(auditPrompt("es")).toMatch(/DEMONSTRATED \(hay un logro que la evidencia/)
    expect(auditPrompt("en")).toMatch(/DEMONSTRATED \(an achievement evidences it/)
    // Sin id de línea nunca es demostrada: la misma vara que rige a las duras.
    expect(auditPrompt("es")).toMatch(/Sin id de línea, nunca es DEMONSTRATED/)
    expect(auditPrompt("en")).toMatch(/With no line id, it is never DEMONSTRATED/)
  })
})
