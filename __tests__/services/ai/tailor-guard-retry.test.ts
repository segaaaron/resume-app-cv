import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * CUANDO LOS GUARDS SE LO LLEVAN TODO.
 *
 * `askUntilAnswered` mira la respuesta CRUDA del modelo; los guards corren
 * después. Una respuesta con reescrituras que los guards descartaban enteras
 * contaba como «respondió»: no había reintento, y al usuario le quedaba la
 * pantalla vacía habiendo gastado el uso y el cooldown.
 *
 * Reportado por el CEO el 2026-08-21: «espero que tus guards no estén
 * perjudicando la información de alto impacto». No lo estaban filtrando de
 * menos — estaban dejando un hueco al disparar todos juntos.
 */
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
const logAIUsage = vi.fn()
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-x",
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: (...a: unknown[]) => logAIUsage(...a),
}))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: () => ({ valid: true }) }))

import { AITailorModule } from "@/lib/services/ai/modules/AITailorModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const sectionData = {
  summary: "",
  workExperience: [{
    id: "w1", jobTitle: "Cajero", employer: "Banco",
    description: "• Procesé 120 transacciones diarias con control de caja.",
  }],
  skills: [],
}

const input = {
  sectionData,
  language: "es",
  posting: { jobTitle: "Cajero", hardSkills: ["control de caja"], softSkills: [], mustHaves: [] },
  workload: [{ checkId: "c1", targetId: "w1", index: 0, reason: "weak_verb" as const }],
}

function chatSequence(...bodies: unknown[]) {
  let i = 0
  return vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify(bodies[Math.min(i++, bodies.length - 1)]) } }],
    usage: { prompt_tokens: 5, completion_tokens: 5 },
  }))
}

describe("si los guards descartan todo, se pide una vez más", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("la segunda respuesta, que conserva la cifra, llega al usuario", async () => {
    const chat = chatSequence(
      // Borra el 120 que el candidato ya dice: `losesStatedFigure` la mata.
      { summary: null, rewrites: [{ checkId: "c1", text: "• Atendí ventanilla con control de caja y arqueo diario." }] },
      // La buena: conserva el 120 Y «control de caja», que la vacante pide por
      // nombre. Antes decía «arqueo de caja y control de comprobantes» — el
      // guard de términos, que llegó después, la descartaba con razón: perder un
      // término de la oferta le baja el puntaje al candidato.
      { summary: null, rewrites: [{ checkId: "c1", text: "• Procesé 120 transacciones diarias con control de caja y arqueo de comprobantes." }] },
    )
    const mod = new AITailorModule({ chat } as never, logger as never)
    const res = await mod.tailorCV("u1", input as never, "PRO")

    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.rewrites).toHaveLength(1)
    expect(res.rewrites[0].text).toContain("120")
  })

  /** Ningún guard se relaja en el reintento: si vuelve mal, vuelve a caer. */
  it("si la segunda también borra la cifra, no se entrega igual", async () => {
    const chat = chatSequence(
      { summary: null, rewrites: [{ checkId: "c1", text: "• Atendí ventanilla con control de caja y arqueo diario." }] },
    )
    const mod = new AITailorModule({ chat } as never, logger as never)
    const res = await mod.tailorCV("u1", input as never, "PRO")

    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.rewrites).toHaveLength(0)
  })

  /** El panel de admin agrupa por conteo: un reintento no puede figurar como dos. */
  it("el reintento no factura una segunda llamada", async () => {
    const chat = chatSequence(
      { summary: null, rewrites: [{ checkId: "c1", text: "• Atendí ventanilla con control de caja." }] },
    )
    const mod = new AITailorModule({ chat } as never, logger as never)
    await mod.tailorCV("u1", input as never, "PRO")
    expect(logAIUsage).toHaveBeenCalledTimes(1)
  })

  /** Nunca dos reintentos: eso esconde un prompt que dejó de funcionar. */
  it("no insiste una tercera vez", async () => {
    const chat = chatSequence({ summary: null, rewrites: [{ checkId: "c1", text: "• Atendí ventanilla." }] })
    const mod = new AITailorModule({ chat } as never, logger as never)
    await mod.tailorCV("u1", input as never, "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
  })
})
