import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-x",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "Backend engineer.",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: () => ({ valid: true }) }))

import { AITailorModule } from "@/lib/services/ai/modules/AITailorModule"
import type { TailorCVInput } from "@/lib/services/ai/shared/ai-types"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
const chatReturning = (obj: unknown) =>
  vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }], usage: { prompt_tokens: 5, completion_tokens: 5 } }))
const embed = vi.fn(async (texts: string[]) => texts.map(() => [1, 0, 0]))

const realCv = {
  summary: "Backend engineer with four years on payment services.",
  workExperience: [{ id: "w1", jobTitle: "Backend Dev", employer: "Acme", description: "• Built services." }],
  skills: [],
}

const posting = { jobTitle: "Backend Engineer", hardSkills: ["services"], softSkills: [], mustHaves: [] }

const input = (over: Partial<TailorCVInput> = {}): TailorCVInput => ({
  sectionData: realCv,
  language: "en",
  posting,
  workload: [{ checkId: "c1", targetId: "w1", index: 0, reason: "no_metric" }],
  ...over,
})

describe("tailor-cv — el resumen nulo de verdad", () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * Un modelo JSON manda con frecuencia la CADENA "null" en vez de un null. Sin
   * normalizar, el panel pinta "null" como resumen adaptado y —peor— la cadena
   * pasa el guard de aplicar y se escribe dentro del CV del usuario.
   */
  it.each(["null", "None", "n/a", "  ", "undefined"])("normaliza el literal '%s' a null", async (bad) => {
    const chat = chatReturning({ summary: bad, rewrites: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", input({ rewriteSummary: true }), "PRO")
    expect(res.summary).toBeNull()
  })

  it("un CV que el modelo dejó intacto devuelve 'nada que mejorar', no un 422", async () => {
    const chat = chatReturning({ summary: null, rewrites: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", input(), "PRO")
    expect(res.summary).toBeNull()
    expect(res.rewrites).toEqual([])
  })
})

describe("sin trabajo asignado no hay llamada", () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * EL CAMBIO DE FONDO. Antes tailor decidía solo qué tocar y siempre encontraba
   * algo, así que un CV impecable igual gastaba un uso y dos minutos de
   * enfriamiento. Ahora el informe dice qué falta: si no falta nada, no se llama.
   */
  it("con workload vacío y sin resumen pedido, no toca la API", async () => {
    const chat = chatReturning({ summary: null, rewrites: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", input({ workload: [] }), "PRO")
    expect(chat).not.toHaveBeenCalled()
    expect(res).toEqual({ summary: null, rewrites: [] })
  })

  /**
   * Un ítem que no se puede ubicar en el CV no se le pide: una reescritura sobre
   * un índice inexistente es inaplicable, o peor, aplicable sobre otra línea.
   */
  it("descarta un ítem cuyo puesto o índice no existe en el CV", async () => {
    const chat = chatReturning({ summary: null, rewrites: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    await mod.tailorCV("u1", input({
      workload: [{ checkId: "ghost", targetId: "w9", index: 7, reason: "no_metric" }],
    }), "PRO")
    expect(chat).not.toHaveBeenCalled()
  })
})

describe("tailor no abre trabajo por su cuenta", () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * El modelo devuelve el `checkId` que se le dio. Uno que no está en la lista es
   * trabajo que nadie pidió — y aceptarlo le devolvería la potestad de
   * diagnosticar, que es justo lo que este cambio le quitó.
   */
  it("descarta una reescritura con un checkId que no se le dio", async () => {
    const chat = chatReturning({
      summary: null,
      rewrites: [
        // En inglés y conservando «services», que es lo que la vacante pide por
        // nombre: el fixture mezclaba un CV inglés con una reescritura española,
        // así que el guard de términos —que llegó después— la descartaba con
        // razón y este test fallaba por algo que no venía a probar.
        { checkId: "c1", text: "• Designed and ran the checkout payment services end to end" },
        { checkId: "inventado", text: "• Nadie pidió esto" },
      ],
    })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    const res = await mod.tailorCV("u1", input(), "PRO")
    expect(res.rewrites.map((r) => r.checkId)).toEqual(["c1"])
  })
})

describe("la oferta cruda ya no entra al prompt", () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * Entraban hasta 6.000 caracteres de vacante y tailor la volvía a interpretar
   * por su cuenta. Ahora recibe los términos ya extraídos y las líneas exactas.
   */
  it("el prompt lleva los términos y las líneas, no el texto de la oferta", async () => {
    const chat = chatReturning({ summary: null, rewrites: [] })
    const mod = new AITailorModule({ chat, embed } as never, logger as never)
    await mod.tailorCV("u1", input({
      posting: { jobTitle: "Backend Engineer", hardSkills: ["Kubernetes"], softSkills: [], mustHaves: [] },
    }), "PRO")
    const call = chat.mock.calls[0] as unknown as [{ messages: { content: string }[] }]
    const sent = call[0].messages.map((m) => m.content).join("\n")
    expect(sent).toContain("Kubernetes")
    expect(sent).toContain("checkId: c1")
    // El motivo lo escribe el módulo desde un código cerrado, no el cliente.
    expect(sent).toMatch(/names no size for the work|no dice ningún tamaño/)
  })
})
