import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import { TRIVIAL_EDIT_SIMILARITY } from "@/lib/services/ai/shared/text-similarity"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * UN BOTÓN NO ESCRIBE LO QUE YA ESTÁ ESCRITO.
 *
 * ── LA REGLA, TEXTUAL (CEO, 2026-08-21) ────────────────────────────────────
 *
 *   «Si lo que sugerís como mejora es idéntico en un 90 a 100% no es mejora. Si
 *    es de 89 para abajo es considerado como mejora. Así de claro.»
 *
 * Reportado con captura: la tarjeta proponía cambiar «Diseñar e implementar
 * campañas orientadas a conversión (…) 10% a 20% (…)» por «Diseñé e implementé
 * campañas orientadas a conversión (…) 10% a 20% (…)». Dos palabras de
 * veinticinco, y para encontrarlas había que comparar dos párrafos casi iguales.
 *
 * ── POR QUÉ ESTE TEST VIVE ACÁ Y NO EN EL PANEL ────────────────────────────
 *
 * El primer arreglo se puso en el árbitro del panel y era un parche: dejaba la
 * regla en UN consumidor mientras el hallazgo salía intacto hacia cualquier
 * otro. `groundForThisResume` es el único punto donde el texto ACTUAL del CV y
 * la propuesta están los dos en la mano, y corre en los TRES caminos de lectura
 * —análisis nuevo y los dos aciertos de caché—.
 *
 * Esto EJECUTA el servicio de punta a punta. Leer el fuente buscando
 * `isTrivialEdit` habría dado verde con la regla desconectada.
 */
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini", AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4, AI_TEMPERATURE_CREATIVE: 0.7, AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3, AI_TEMPERATURE_GENERATIVE: 0.6, AI_TEMPERATURE_EXACT: 0,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  buildResumeContext: vi.fn((sectionData: Record<string, unknown>) => JSON.stringify(sectionData)),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({
  enforceAIQuota: vi.fn().mockResolvedValue(undefined),
  refundDailyQuota: vi.fn().mockResolvedValue(undefined),
}))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-4o-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

/** La línea del CV real del CEO, tal como la reportó. */
const LINEA = "Diseñar e implementar campañas orientadas a conversión (ventas, registros y leads), logrando tasas de conversión de aproximadamente 10% a 20% y fortaleciendo los resultados comerciales."

const SECTIONS = {
  summary: "Ejecutivo comercial.",
  workExperience: [{ id: "job-1", jobTitle: "Ejecutivo Comercial", employer: "Acme", description: `• ${LINEA}` }],
  skills: [{ name: "CRM" }],
}
const JD = "Ejecutivo comercial: marketing digital, embudos de conversión, CRM, prospección B2B y B2C."

function clientReturning(analysisJson: string): IAIClient {
  const extraction = JSON.stringify({
    hardSkills: ["CRM"], softSkills: [], jobTitle: "Ejecutivo Comercial",
    mustHaves: [], summary: "fit", label: "ok",
  })
  const chat = vi.fn().mockImplementation((params: { messages: Array<{ content: string }> }) => {
    const prompt = params.messages.map((m) => m.content).join("\n")
    const isAnalysis = /senior technical recruiter|reclutador t[eé]cnico/i.test(prompt)
    return Promise.resolve(completion(isAnalysis ? analysisJson : extraction))
  })
  return { chat, embed: vi.fn().mockResolvedValue([]) } as IAIClient
}

const analysisWith = (fix: string) => JSON.stringify({
  verdict: "Correcto", passRisk: "medium",
  criticalFixes: [{
    issue: `«${LINEA}» está escrita en infinitivo.`,
    why: "Un CV enumera logros, no tareas de un puesto.",
    fix,
    severity: "medium",
    action: { kind: "rewrite_bullet", targetId: "job-1", index: 0 },
  }],
  strengths: ["CRM"],
})

const scoreWith = async (fix: string, logger: ILogger) =>
  new AIService(clientReturning(analysisWith(fix)), logger)
    .atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "es" }, "PRO")

describe("un cambio que no cambia nada no llega con botón", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  it("el caso reportado: sólo la conjugación cambia", async () => {
    const casi = "Diseñé e implementé campañas orientadas a conversión (ventas, registros y leads), logrando tasas de conversión de aproximadamente 10% a 20% y fortaleciendo los resultados comerciales."
    const r = await scoreWith(casi, logger)
    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("manual")
  })

  it("el texto idéntico tampoco", async () => {
    const r = await scoreWith(LINEA, logger)
    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("manual")
  })

  /**
   * EL ERROR SIMÉTRICO, QUE ES EL QUE HAY QUE VIGILAR. Un filtro que se lleva
   * puesto lo bueno deja al usuario con el aviso y sin la corrección — el bucle
   * «me lo marca y no me lo arregla» que este proyecto ya pagó una vez con el
   * guard de reword cosmético.
   */
  it("una reescritura de verdad conserva su botón", async () => {
    // Conserva el 10% y el 20%: si los borrara, la degradaría el guard de la
    // cifra —el de la línea de arriba— y este test estaría comprobando ESO en
    // vez de la regla del 90%. Pasó en el primer intento.
    const real = "Sostuve tasas de conversión del 10% al 20% en campañas de ventas, registros y leads para B2B y B2C, midiendo el costo por registro y ajustando la pauta cada semana según el embudo."
    const r = await scoreWith(real, logger)
    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("rewrite_bullet")
  })

  /** El umbral no se escribe en el módulo: sale de la constante compartida. */
  it("el umbral es el del proyecto, que es el número del CEO", () => {
    expect(TRIVIAL_EDIT_SIMILARITY).toBe(0.9)
  })
})
