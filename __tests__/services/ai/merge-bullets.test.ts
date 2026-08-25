import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ai-client", () => ({ AI_MODEL_PROSE: "test-model", logAIUsage: vi.fn() }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/services/ai/shared/clean-output", () => ({
  cleanGeneratedText: vi.fn(async (texts: string[]) => texts),
}))

import { AIMergeBulletsModule } from "@/lib/services/ai/modules/AIMergeBulletsModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const A = "Built the checkout screen in SwiftUI"
const B = "Improved checkout screen loading behaviour with Combine"
const sectionData = {
  workExperience: [{ id: "job1", jobTitle: "iOS Developer", description: `• ${A}\n• ${B}` }],
}

/** El modelo responde con el contrato JSON: {"status":"ok","text":"..."}. */
function moduleReturning(text: string) {
  return moduleAnswering(JSON.stringify({ status: "ok", text }))
}

/** Respuesta cruda, para probar el contrato en sí (refusal, JSON roto). */
function moduleAnswering(content: string) {
  const aiClient = {
    chat: vi.fn().mockResolvedValue({ choices: [{ message: { content } }] }),
    embed: vi.fn(),
  }
  return { mod: new AIMergeBulletsModule(aiClient, logger as never), aiClient }
}

beforeEach(() => vi.clearAllMocks())

describe("mergeBullets", () => {
  it("returns the merged line", async () => {
    const merged = "Built and tuned the checkout screen in SwiftUI, improving loading behaviour with Combine"
    const { mod } = moduleReturning(merged)
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res).toEqual({ status: "ok", text: merged })
  })

  it("accepts an honest refusal instead of forcing two unrelated lines together", async () => {
    const { mod } = moduleAnswering(JSON.stringify({ status: "not_mergeable" }))
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  // The promise a merge makes: nothing the candidate wrote is lost.
  it("rejects a merge shorter than the longer source line — that dropped content", async () => {
    const { mod } = moduleReturning("Built the checkout screen")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  it("rejects a merge that invented a figure nobody wrote", async () => {
    const { mod } = moduleReturning(
      "Built and tuned the checkout screen in SwiftUI with Combine, cutting load time by 45% for 30000 users",
    )
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  it("strips a bullet marker the model adds back", async () => {
    const merged = "Built and tuned the checkout screen in SwiftUI, improving loading behaviour with Combine"
    const { mod } = moduleReturning(`• ${merged}`)
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res).toEqual({ status: "ok", text: merged })
  })

  // Stale indexes: the description can be edited between the analysis and the click.
  it("refuses when an index is out of range", async () => {
    const { mod, aiClient } = moduleReturning("anything")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 9], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  it("refuses to merge a line with itself", async () => {
    const { mod, aiClient } = moduleReturning("anything")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [1, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  it("rejects a role that is not in the CV", async () => {
    const { mod } = moduleReturning("anything")
    await expect(
      mod.mergeBullets("u1", { targetId: "ghost", indexes: [0, 1], sectionData }, "PRO"),
    ).rejects.toThrow()
  })

  // El endpoint llamaba al modelo sin registrar su gasto: en el panel de costos por
  // usuario aparecía en cero mientras la factura de OpenAI decía otra cosa.
  it("registra lo que gastó, con los tokens reales de la respuesta", async () => {
    const { logAIUsage } = await import("@/lib/ai-client")
    const merged = "Built and tuned the checkout screen in SwiftUI, improving loading behaviour with Combine"
    const aiClient = {
      chat: vi.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ status: "ok", text: merged }) } }],
        usage: { prompt_tokens: 300, completion_tokens: 60 },
      }),
      embed: vi.fn(),
    }
    const mod = new AIMergeBulletsModule(aiClient, logger as never)

    await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")

    expect(logAIUsage).toHaveBeenCalledWith("u1", "merge-bullets", expect.objectContaining({
      promptTokens: 300,
      completionTokens: 60,
      plan: "PRO",
    }))
  })


  // El contrato de salida es JSON. Una respuesta ilegible no puede colarse como bullet.
  it("una respuesta que no es JSON no se escribe en el CV", async () => {
    const { mod } = moduleAnswering("Built and tuned the checkout screen in SwiftUI with Combine")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  // Escribe prosa DENTRO del CV: si las reglas solo existen en inglés, un CV en
  // español recibe una frase construida con gramática que no es la suya.
  it("manda las reglas en el idioma del CV, en las dos ramas", async () => {
    // Se comparan los marcadores de las REGLAS, no verbos sueltos: los bullets de
    // prueba están en inglés y aparecerían en las dos ramas, dando un falso verde.
    for (const [language, debe, noDebe] of [
      ["es", "REGLAS:", "RULES:"],
      ["en", "RULES:", "REGLAS:"],
    ] as const) {
      const { mod, aiClient } = moduleReturning("x")
      await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData, language }, "PRO")
      const params = aiClient.chat.mock.calls[0][0]
      const rules = params.messages[1].content as string
      const system = params.messages[0].content as string
      expect(rules, language).toContain(debe)
      expect(rules, language).not.toContain(noDebe)
      // El system también cambia de idioma, no solo el prompt de usuario.
      expect(system, language).toContain(language === "es" ? "élite" : "elite")
    }
  })

  /**
   * El motor de escritura manda de verdad acá.
   *
   * Descubierto midiendo: al mover estos chequeos de cinco `if` al motor,
   * desarmé `keeps_content` a propósito para ver si algún test lo notaba, y
   * los trece pasaron igual. La regla que impide que una fusión se coma una
   * palabra del candidato no tenía quién la mirara.
   */
  it("descarta la fusión que se come una palabra de las líneas originales", async () => {
    // Pierde "SwiftUI" y nada más. Tiene que ser MÁS LARGA que la más larga de
    // las dos originales: si no, la atrapa el chequeo de largo y el test pasaría
    // sin que la regla de contenido haya corrido nunca — que es exactamente cómo
    // se escribe un test que da verde con el producto roto.
    const { mod } = moduleReturning("Built and improved the checkout screen loading behaviour with Combine")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  it("lleva mensaje system y exige la forma en la generación", async () => {
    const { mod, aiClient } = moduleReturning("x")
    await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    const params = aiClient.chat.mock.calls[0][0]
    expect(params.messages[0].role).toBe("system")
    // Antes esto afirmaba `json_object`, que sólo garantiza que el texto parsea.
    // La forma ahora se exige mientras el modelo escribe: el test sigue mirando
    // el mismo contrato, en su versión fuerte.
    expect(params.response_format.type).toBe("json_schema")
    expect(params.response_format.json_schema.strict).toBe(true)
    expect(params.response_format.json_schema.name).toBe("merge_bullets")
    expect(params.response_format.json_schema.schema.required).toEqual(["status", "text"])
  })

  // OpenAI cobra al precio de caché el PREFIJO común de la petición. Con los bullets
  // arriba, ese prefijo era de cero y el descuento no se aplicaba nunca.
  it("las reglas van ANTES de los datos, para que el prefijo sea cacheable", async () => {
    const { mod, aiClient } = moduleReturning("x")
    await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    const prompt = aiClient.chat.mock.calls[0][0].messages[1].content as string
    expect(prompt.indexOf("REGLAS:")).toBeGreaterThan(-1)
    expect(prompt.indexOf("REGLAS:")).toBeLessThan(prompt.indexOf("BULLET A:"))
  })
})
