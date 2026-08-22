import { describe, it, expect, vi, beforeEach } from "vitest"
import { losesStatedFigure } from "@/lib/services/ai/shared/ai-helpers"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * A rewrite must never delete the number the candidate earned.
 *
 * MEASURED, 2026-08-19, on six well-written résumés. Once the prompts were told
 * to name the content of the work, the model started rewriting lines that were
 * already good — and dropping their figures on the way out:
 *
 *   was: "Cut medication errors from 12 to 3 per month across two wards"
 *   now: "Reduced medication errors by reconciling prescriptions, MAR entries
 *         and administered doses across two wards"
 *
 * Four of five bullets on that CV lost their numbers, and EVERY existing guard
 * passed it: nothing was invented, so `detectHallucination` was quiet; the text
 * grew, so `dropsContentWithoutGain` saw a gain; the wording changed, so
 * `isTrivialEdit` and `isCosmeticReword` did not apply.
 *
 * The prompts now forbid it. This makes it unrepresentable, which is the half
 * that holds when a prompt drifts.
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

describe("losesStatedFigure", () => {
  it("catches the measured case: a richer line with the numbers rubbed out", () => {
    expect(losesStatedFigure(
      "Cut medication errors from 12 to 3 per month across two wards",
      "Reduced medication errors by reconciling prescriptions, MAR entries and administered doses across two wards.",
    )).toBe(true)
  })

  it("passes a rewrite that keeps every figure and adds content", () => {
    expect(losesStatedFigure(
      "Cut medication errors from 12 to 3 per month across two wards",
      "Cut medication errors from 12 to 3 per month across two wards by reconciling the MAR at every handover.",
    )).toBe(false)
  })

  it("says nothing about a line that never had a figure", () => {
    expect(losesStatedFigure("Soldé piezas.", "Soldé estructura metálica siguiendo planos y control del cordón.")).toBe(false)
  })

  /**
   * Compared on digits, not on the token: a Spanish CV writes 1.400 where an
   * English one writes 1,400, and judging a résumé by the other locale's
   * separator would drop correct rewrites for every Spanish user.
   */
  it("treats the same figure under either locale's separators as kept", () => {
    expect(losesStatedFigure("Cuadré 1.400 arqueos diarios", "Cuadré 1,400 arqueos diarios verificando comprobantes")).toBe(false)
  })

  it("catches a decimal that changed value", () => {
    expect(losesStatedFigure("Cut sync time from 3.2s to 1.1s", "Cut sync time from 3.5s to 1.1s")).toBe(true)
  })

  /**
   * SE APLICABA DE MÁS. La versión anterior sacaba TODO lo que matcheara \d+ y
   * exigía verlo de vuelta, así que cualquier número mataba la reescritura
   * aunque no midiera nada del trabajo. Un año y un horario no son logros: son
   * fecha y disponibilidad, y reformularlos no borra ninguna cifra del candidato.
   */
  it("does not arm on a year — a date is not a measure of the work", () => {
    expect(losesStatedFigure(
      "Atención al cliente en sucursal desde 2019",
      "Atención al cliente en ventanilla: apertura de cuentas, reclamos y derivación a ejecutivo.",
    )).toBe(false)
  })

  it("does not arm on a schedule like 24/7", () => {
    expect(losesStatedFigure(
      "Soporte 24/7 a la planta",
      "Soporte permanente a planta: diagnóstico en línea, escalamiento y reposición de repuestos críticos.",
    )).toBe(false)
  })

  /**
   * LA MITAD QUE FALTABA. "de 12 a 3" y "un 75%" dicen lo mismo, y la versión
   * anterior tiraba la segunda por no repetir los dígitos de la primera — se
   * perdía una línea mejor por decir la misma cifra de otra forma.
   *
   * Que el 75 sea correcto NO lo decide este guard: la cifra no está en el CV,
   * así que `hallucinationKind` la marca como `figure` y llega con el chip
   * "confirmá la cifra". El candidato la confirma o la corrige antes de aplicar.
   */
  it("allows the same achievement restated as another figure", () => {
    expect(losesStatedFigure(
      "Cut medication errors from 12 to 3 per month",
      "Cut medication errors 75% by reconciling prescriptions at every handover.",
    )).toBe(false)
  })

  it("still blocks when the achievement comes back with no figure at all", () => {
    expect(losesStatedFigure(
      "Atendí 120 clientes por día en ventanilla",
      "Atendí clientes en ventanilla resolviendo depósitos, retiros y pagos de servicios.",
    )).toBe(true)
  })
})

describe("tailor-cv drops a rewrite that deletes the candidate's figure", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  const SECTIONS = {
    summary: "Registered nurse with 9 years in emergency care.",
    workExperience: [{
      id: "n1", jobTitle: "Charge Nurse", employer: "Hospital Viedma",
      description: "• Cut medication errors from 12 to 3 per month across two wards\n• Coordinated triage for up to 30 patients per shift",
    }],
    skills: [{ name: "Triage" }],
  }

  const POSTING = { jobTitle: "Charge Nurse", hardSkills: ["triage"], softSkills: [], mustHaves: [] }
  const WORK = [
    { checkId: "b0", targetId: "n1", index: 0, reason: "no_metric" as const },
    { checkId: "b1", targetId: "n1", index: 1, reason: "no_metric" as const },
  ]

  function serviceReturning(rewrites: { checkId: string; text: string }[]) {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({ summary: null, rewrites })))
    return { service: new AIService({ chat, embed: vi.fn() } as IAIClient, logger), chat }
  }

  it("drops the figure-losing rewrite and keeps the one that preserved it", async () => {
    const { service } = serviceReturning([
      // Loses 12 and 3 — exactly the measured failure.
      { checkId: "b0", text: "• Reduced medication errors by reconciling prescriptions and administered doses across two wards." },
      // Keeps 30 and adds the trade's content.
      { checkId: "b1", text: "• Coordinated triage for up to 30 patients per shift, routing by acuity under the department's escalation protocol." },
    ])
    const r = await service.tailorCV("u1", { sectionData: SECTIONS, language: "en", posting: POSTING, workload: WORK }, "PRO")

    const kept = r.rewrites.map((b) => b.text)
    expect(kept).toHaveLength(1)
    expect(kept[0]).toContain("30 patients per shift")
  })

  it("drops a tailored summary that deletes a figure the summary stated", async () => {
    const withFigures = { ...SECTIONS, summary: "Registered nurse with 9 years in emergency care. Triaged up to 30 patients per shift and trained 6 new hires." }
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: "Registered nurse with emergency experience coordinating triage, handover and medication safety across busy wards.",
      rewrites: [],
    })))
    const r = await new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .tailorCV("u1", { sectionData: withFigures, language: "en", posting: POSTING, workload: WORK, rewriteSummary: true }, "PRO")

    expect(r.summary).toBeNull()
  })
})

/**
 * EL ID PREFIJADO YA NO PUEDE PASAR.
 *
 * El modelo respondía con el id del puesto que se le mostró —a veces "w1", a
 * veces "ID:w1"— y la segunda forma no encontraba ningún puesto, así que todos
 * los guards por viñeta (`if (orig !== undefined)`) se salteaban solos mientras la
 * reescritura viajaba. `resolveJobId` existía para eso.
 *
 * Con el contrato nuevo el modelo no elige a qué línea apunta: devuelve el
 * `checkId` que le dimos, y un id que no está en la lista se descarta. La clase
 * entera de defecto dejó de ser construible, así que su test se fue con ella.
 */
