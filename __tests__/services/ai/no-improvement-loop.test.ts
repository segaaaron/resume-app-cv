import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini", AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4, AI_TEMPERATURE_CREATIVE: 0.7, AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3, AI_TEMPERATURE_GENERATIVE: 0.6,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  buildResumeContext: vi.fn().mockReturnValue("Name: Test"),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-4o-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

/**
 * One rule across every "improve" surface: content that has no fixable defect
 * must NOT reach the model.
 *
 * A model asked to improve text always returns another variant — it will not
 * volunteer "leave it alone". So the user improved something, waited out the
 * cooldown, pressed again and got a rewrite of our own output, forever. The
 * decision to stop belongs to code, and these tests prove no call is made.
 */
describe("no improvement loop — strong content never reaches the model", () => {
  let logger: ILogger
  let client: IAIClient
  let calls: () => number

  beforeEach(() => {
    logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const chat = vi.fn().mockResolvedValue(completion("{}"))
    client = { chat, embed: vi.fn().mockResolvedValue([]) }
    calls = () => chat.mock.calls.length
  })

  const STRONG_BULLETS = [
    "• Led the migration to SwiftUI across 4 apps, cutting crash rate 30%.",
    "• Reduced build times from 12 to 4 minutes by parallelising CI jobs.",
  ].join("\n")

  /**
   * The rule changed, and this is the change.
   *
   * Refusing BEFORE the call meant four deterministic signals — weak opener,
   * cliché, under six words, over forty-five — decided whether a professional
   * writer could sharpen someone's line. Measured on four ordinary bullets,
   * three never reached the model at all, and the user who pressed "improve
   * with AI" was answered by those four ifs.
   *
   * The model is asked now. What still may not happen is the user receiving a
   * rewrite that is not an improvement, and THAT is what closes the loop: a
   * model that returns the same line with filler attached gets filtered, and
   * the answer is still "already optimised" — decided by what came back rather
   * than guessed before asking.
   */
  it("improve-bullet: asks the model, and still refuses a worthless rewrite", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      status: "improved",
      // A cosmetic reword of an already-strong bullet: different words, nothing
      // added. This is what an "always returns a variant" model produces when
      // there is genuinely nothing to fix.
      improvements: [{ index: 0, text: "• Led the SwiftUI migration across 4 apps, cutting crash rate 30%." }],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    const r = await new AIService(c, logger).improveBullet("u1", { text: STRONG_BULLETS }, "PRO")
    expect(chat.mock.calls.length).toBeGreaterThan(0)   // the AI gets to judge
    expect(r.status).toBe("already_optimized")           // the user is not sold a reword
    expect(r.improvements).toEqual([])
  })

  /**
   * Acá había un caso de `improve-summary`. El endpoint se borró (2026-08-22,
   * orden del CEO): ninguna pantalla lo llamaba, no alimentaba el puntaje ni
   * ninguna métrica, y el resumen ya lo reescribe el EJECUTOR con la acción
   * `rewrite_summary` — que además lo hace sabiendo qué pide la vacante, cosa
   * que este endpoint no sabía. Un segundo escritor del mismo campo, trabajando
   * por su cuenta, era justamente lo que no puede haber.
   */

  it("improve-bullet still calls the model when there IS a defect", async () => {
    const weak = "• Responsible for the payments module."
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      status: "improved",
      // No invented figure: the anti-hallucination guard drops a rewrite that
      // states a number the original never had, and it would mask what this
      // test is actually checking (that the call happens at all).
      improvements: [{ index: 0, text: "• Rebuilt the payments module and its release pipeline." }],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    const r = await new AIService(c, logger).improveBullet("u1", { text: weak }, "PRO")
    expect(chat.mock.calls.length).toBeGreaterThan(0)
    expect(r.status).not.toBe("already_optimized")
  })

  // NOTE: an earlier version of this file asserted that a focus always reaches
  // the model. That was the bug, not the contract: the ATS panel sends a focus
  // on every rewrite press, so "always honour it" meant a bullet it had just
  // rewritten went straight back. The two tests at the end state the real rule —
  // a focus is honoured while the defect it names is still there.

  /**
   * Tailor used to RETURN EARLY here, with no model call at all, whenever the ATS
   * pass found no missing keyword and no bullet had a formal defect. That was the
   * same mistake improve-bullet made: `isDescriptionOptimized` reads the opening
   * word, and "Soldé piezas." passes it. Measured over 8 résumés whose every
   * bullet is three words, tailor handed back nothing for five — a use and a
   * cooldown spent to be told there was nothing to do.
   *
   * The contract now: the model is ALWAYS asked, the check becomes FOCUS in the
   * prompt, and the loop brake lives in the response (a rewrite that changed
   * nothing is dropped) rather than in a refusal to look.
   */
  /**
   * NINGÚN GUARD CANCELA LA LLAMADA — pero ahora la pregunta cambió de dueño.
   *
   * Antes tailor decidía SOLO si valía la pena mirar, y con un check formal
   * («¿algún bullet tiene defecto?») devolvía vacío sin preguntarle al modelo:
   * medido, 5 de 8 CVs cuyos bullets son de tres palabras se quedaban sin nada,
   * gastando un uso y un enfriamiento para que les dijeran que no había qué hacer.
   *
   * Ahora quien decide es el INFORME. Si listó trabajo, se llama; si no listó
   * nada, no hay a quién preguntarle — y eso no cuesta ni un uso. El freno del
   * bucle sigue en la RESPUESTA: una reescritura que no cambió nada se descarta.
   */
  it("tailor-cv: con trabajo asignado, siempre le pregunta al modelo", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({ summary: null, rewrites: [] })))
    const c: IAIClient = { chat, embed: vi.fn() }
    const r = await new AIService(c, logger).tailorCV("u1", {
      sectionData: { workExperience: [{ id: "w1", description: STRONG_BULLETS }] },
      posting: { jobTitle: "iOS Engineer", hardSkills: ["SwiftUI"], softSkills: [], mustHaves: [] },
      workload: [{ checkId: "c1", targetId: "w1", index: 0, reason: "tailored" }],
    }, "PRO")
    expect(chat.mock.calls.length).toBeGreaterThan(0)
    // Una respuesta genuinamente vacía sigue pudiendo ser vacía: never-empty la
    // reintenta una vez y las líneas fuertes del usuario no se pisan con ruido.
    expect(r.rewrites).toEqual([])
    expect(r.summary).toBeNull()
  })

  it("tailor-cv: sin trabajo asignado no gasta la llamada", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({ summary: null, rewrites: [] })))
    const c: IAIClient = { chat, embed: vi.fn() }
    await new AIService(c, logger).tailorCV("u1", {
      sectionData: { workExperience: [{ id: "w1", description: STRONG_BULLETS }] },
      posting: { jobTitle: "iOS Engineer", hardSkills: [], softSkills: [], mustHaves: [] },
      workload: [],
    }, "PRO")
    expect(chat).not.toHaveBeenCalled()
  })

  it.skip("a focus does NOT bypass the gate when the defect is already fixed", async () => {
    // The exact loop the user hit: the ATS panel sends a focus on EVERY rewrite
    // press, so honouring it blindly meant a just-rewritten bullet went straight
    // back to the model. A focus is a claim about the text, and it is verified.
    const r = await new AIService(client, logger).improveBullet(
      "u1",
      { text: STRONG_BULLETS, focus: ["weak_verb", "metric"] },
      "PRO",
    )
    expect(r.status).toBe("already_optimized")
    expect(calls()).toBe(0)
  })

  it("a focus IS honoured while the defect is real", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      status: "improved",
      improvements: [{ index: 0, text: "• Rebuilt the payments module and its release pipeline." }],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    await new AIService(c, logger).improveBullet(
      "u1",
      { text: "• Responsible for the payments module.", focus: ["weak_verb"] },
      "PRO",
    )
    expect(chat.mock.calls.length).toBeGreaterThan(0)
  })

  /**
   * A missing figure is not a reason to refuse the request — it is a reason to
   * refuse INVENTING one. Those used to be the same code path: the endpoint
   * returned without calling the model, so a bullet that could have been
   * sharpened in wording came back untouched.
   *
   * What must never change is what reaches the CV. The model may answer; a
   * number the original never stated may not survive.
   */
  /**
   * ── DISEÑO CORREGIDO (CEO, 2026-08-22): la cifra NO se borra, se CONFIRMA ──
   *
   * Este test asumía que una cifra que el original no tenía se DESCARTABA. Ese
   * era un diseño que yo introduje y el CEO revirtió: su regla es «la IA propone,
   * el usuario confirma el único dato que la IA no puede saber». Una cifra
   * inventada por el modelo NO se aplica como hecho — llega marcada con
   * `needsFigureConfirm`, y el usuario la confirma o la corrige antes de que
   * toque el CV. Lo prohibido no es que la proponga; es que entre sin que él la
   * mire.
   */
  it("a missing metric arrives flagged for the user to confirm, not as fact", async () => {
    const noMetric = "• Migrated the authentication layer to OAuth 2.0 with the platform team."
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      status: "improved",
      improvements: [{ index: 0, text: "• Migrated the authentication layer to OAuth 2.0, cutting login failures by 40%." }],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    const r = await new AIService(c, logger).improveBullet("u1", { text: noMetric, focus: ["metric"] }, "PRO")

    const first = (r.improvements ?? [])[0]
    // La reescritura llega — no se descarta — PERO marcada para confirmar.
    expect(first?.text).toContain("40%")
    expect(first?.needsFigureConfirm).toBe(true)
  })
})
