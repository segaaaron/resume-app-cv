import { describe, it, expect, vi, beforeEach } from "vitest"

// Isolate from quota/db/cost. buildResumeContext → "" so grounding for the guard
// comes only from company/jobTitle/userPrompt passed in the input.
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() } } }))

import { AICoverLetterModule } from "@/lib/services/ai/modules/AICoverLetterModule"
import { db } from "@/lib/db"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function reply(body: string) {
  return { choices: [{ message: { content: JSON.stringify({ body }) } }], usage: { prompt_tokens: 10, completion_tokens: 10 } }
}

/** chat() returns queued responses in order; repeats the last once drained. */
function queuedClient(bodies: string[]) {
  let i = 0
  const chat = vi.fn(async () => reply(bodies[Math.min(i++, bodies.length - 1)]))
  return { client: { chat } as never, chat }
}

const input = (over: Record<string, unknown> = {}) => ({
  company: "Acme",
  jobTitle: "Engineer",
  tone: "balanced",
  language: "en" as const,
  ...over,
})

describe("generateCoverLetter — anti-invention guard", () => {
  beforeEach(() => vi.clearAllMocks())

  it("ships a clean draft as-is, one call", async () => {
    const { client, chat } = queuedClient(["I would bring focus and steady delivery to your team.\n\nHappy to walk you through my work."])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(res.body).toContain("<p>")
    expect(res.body).toContain("focus and steady delivery")
    expect(chat).toHaveBeenCalledTimes(1)
  })

  it("retries when the first draft invents a metric, then ships the clean retry", async () => {
    const dirty = "At my last role I increased revenue by 40% in one quarter.\n\nGlad to share details."
    const clean = "At my last role I led the checkout rebuild and mentored two engineers.\n\nGlad to share details."
    const { client, chat } = queuedClient([dirty, clean])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.body).toContain("checkout rebuild")
    expect(res.body).not.toContain("40%")
  })

  it("retries when the first draft invents a stand-in employer name", async () => {
    const dirty = "At XYZ Corp I built the mobile app end to end.\n\nGlad to talk."
    const clean = "I built a mobile app end to end and shipped it to production.\n\nGlad to talk."
    const { client, chat } = queuedClient([dirty, clean])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.body).not.toContain("XYZ Corp")
  })

  it("does not flag a real employer that happens to be named 'ABC' (present in the profile)", async () => {
    const clean = "At ABC I owned the payments service and cut incident volume.\n\nGlad to talk."
    const { client, chat } = queuedClient([clean])
    // userPrompt carries the real employer name → in grounding → not a placeholder.
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input({ userPrompt: "I worked at ABC as a backend engineer." }), "PRO")
    expect(chat).toHaveBeenCalledTimes(1)
    expect(res.body).toContain("ABC")
  })

  it("ships best-effort (never empty) when both drafts still invent", async () => {
    const dirty1 = "I boosted sales by 50% at my previous company.\n\nThanks."
    const dirty2 = "I boosted sales by 30% at my previous company.\n\nThanks."
    const { client, chat } = queuedClient([dirty1, dirty2])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    // returns the retry draft rather than nothing
    expect(res.body).toContain("30%")
  })
})

describe("generateCoverLetter — anti-empty fallback (Phase 4)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("retries once on an empty draft, then ships the grounded retry (not off_topic)", async () => {
    const { client, chat } = queuedClient(["", "Here is a solid letter about my backend work.\n\nGlad to talk."])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.body).toContain("backend work")
  })

  it("throws off_topic only when BOTH the draft and its retry come back empty", async () => {
    const { client, chat } = queuedClient(["", ""])
    const mod = new AICoverLetterModule(client, logger as never)
    await expect(mod.generateCoverLetter("u1", input(), "PRO")).rejects.toThrow("off_topic")
    expect(chat).toHaveBeenCalledTimes(2)
  })
})

describe("generateCoverLetter — tailoring brief (Phase 2)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("injects the deterministic brief into the prompt when a JD + résumé are given", async () => {
    vi.mocked(db.resume.findFirst).mockResolvedValue({
      personalDetails: {
        skills: [{ name: "Swift" }, { name: "SwiftUI" }],
        workExperience: [{ description: "Shipped Swift and SwiftUI apps integrating REST APIs." }],
      },
    } as never)
    const { client, chat } = queuedClient(["I ship Swift and SwiftUI apps.\n\nGlad to talk."])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter(
      "u1",
      input({ resumeId: "r1", jobDescription: "We need a developer strong in Swift and SwiftUI building REST APIs. Kubernetes is required." }),
      "PRO",
    )
    const prompt = ((chat.mock.calls[0] as unknown[])[0] as { messages: { content: string }[] }).messages[1].content
    // the injected block header (the rule text mentions "TAILORING BRIEF" always;
    // only the "=== TAILORING BRIEF ===" section is conditional on a JD).
    expect(prompt).toContain("=== TAILORING BRIEF")
    expect(prompt.toLowerCase()).toContain("swift")
    // the gaps line names tech the résumé lacks and tells the model never to claim it
    expect(prompt.toLowerCase()).toContain("kubernetes")
  })

  it("adds NO brief when there is no JD (purely additive — old behavior intact)", async () => {
    const { client, chat } = queuedClient(["A letter with no vacancy targeting.\n\nThanks."])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter("u1", input(), "PRO")
    const prompt = ((chat.mock.calls[0] as unknown[])[0] as { messages: { content: string }[] }).messages[1].content
    expect(prompt).not.toContain("=== TAILORING BRIEF")
  })
})

/**
 * Una cifra que el perfil no respalda — incluida la que sale de NUESTRO prompt.
 *
 * MEDIDO, 1 de 5 rondas sobre el mismo perfil: el modelo se salió de personaje y
 * le habló al operador con nuestra propia instrucción dentro de la carta —
 * "te devuelvo una versión final en 3 párrafos, dentro de las 250–350 palabras
 * pedidas". Eso se guardaba como la carta del candidato y se envía a un
 * reclutador tal cual.
 *
 * `detectHallucination` no lo veía: sólo acusa un número cuando lleva unidad
 * (%, users, requests), y es estrecho a propósito porque un falso positivo ahí
 * cuesta la carta entera. Aquí sí se puede ser estricto, porque no descarta
 * nada: dispara UN reintento y, si el segundo no convence, queda el primero.
 */
describe("generateCoverLetter — cifras sin respaldo", () => {
  beforeEach(() => vi.clearAllMocks())

  it("reintenta cuando la carta cita una cifra que el perfil no dio", async () => {
    const leak = "Me entusiasma el puesto en Acme.\n\nEn cuanto me pases el perfil, te devuelvo una versión final en 3 párrafos, dentro de las 250-350 palabras pedidas."
    const clean = "Me entusiasma el puesto en Acme por su foco en la calidad.\n\nQuedo a disposición para conversarlo."
    const { client, chat } = queuedClient([leak, clean])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input({ language: "es" }), "PRO")

    expect(chat.mock.calls.length).toBe(2)
    expect(res.body).not.toContain("250")
    expect(res.body).toContain("calidad")
  })

  it("deja pasar una cifra que SÍ está en el perfil", async () => {
    const body = "Con 9 años en atención al cliente, me interesa el puesto en Acme.\n\nQuedo a disposición."
    const { client, chat } = queuedClient([body])
    const mod = new AICoverLetterModule(client, logger as never)
    // La cifra viaja en lo que el candidato conto: es suya, no inventada.
    const res = await mod.generateCoverLetter("u1", input({ language: "es", userPrompt: "Tengo 9 años en atención al cliente" }), "PRO")

    expect(chat.mock.calls.length).toBe(1)
    expect(res.body).toContain("9 años")
  })

  it("no reintenta una carta sin ninguna cifra", async () => {
    const { client, chat } = queuedClient(["Me entusiasma el puesto en Acme.\n\nQuedo a disposición para conversarlo."])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter("u1", input({ language: "es" }), "PRO")
    expect(chat.mock.calls.length).toBe(1)
  })
})

/**
 * Dos caminos escriben la carta del usuario; no pueden tener dos varas.
 *
 * `generateCoverLetter` pasaba por `letterInventsContent` y `usableVersions`
 * —el único filtro del camino de MEJORAR— sólo por `detectHallucination`. Así
 * que la fuga medida en generate (el modelo hablándole al operador con nuestra
 * propia instrucción: "3 párrafos, 250-350 palabras") entraba igual por mejorar.
 * El propio comentario de esa función dice "un solo dueño, para que el reintento
 * pase por todos los chequeos" — y los chequeos no eran los mismos.
 */
describe("improveCoverLetter — la misma vara que la carta nueva", () => {
  beforeEach(() => vi.clearAllMocks())

  const versionsReply = (versions: string[]) => ({
    choices: [{ message: { content: JSON.stringify({ status: "improved", versions }) } }],
    usage: { prompt_tokens: 10, completion_tokens: 10 },
  })
  const BODY = "<p>Me interesa el puesto en Acme por su foco en la atención al cliente.</p><p>Quedo a disposición.</p>"

  it("descarta la versión que cita una cifra que la carta no tenía", async () => {
    const leak = "Te devuelvo la carta en 3 párrafos, dentro de las 250-350 palabras pedidas, lista para enviar."
    const good = "Me interesa el puesto en Acme porque mi trabajo diario es sostener el trato en mostrador sin perder el ritmo del turno."
    const chat = vi.fn(async () => versionsReply([leak, good]))
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const r = await mod.improveCoverLetter("u1", { body: BODY, language: "es" } as never, "PRO")

    const all = (r.versions ?? []).join(" ")
    expect(all).not.toContain("250")
    expect(all).toContain("mostrador")
  })

  /**
   * Nunca dejar al usuario sin nada: si TODAS se caen, vuelve su propia carta
   * con "ya está bien". Un filtro más estricto no puede convertirse en un hueco.
   */
  it("devuelve la carta del usuario cuando ninguna versión sobrevive", async () => {
    const chat = vi.fn(async () => versionsReply([
      "Una versión con 250 palabras exactas y 3 párrafos pedidos.",
      "Otra con 999 clientes atendidos por semana.",
    ]))
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const r = await mod.improveCoverLetter("u1", { body: BODY, language: "es" } as never, "PRO")

    expect(r.status).toBe("already_optimized")
    expect(r.versions).toEqual([BODY])
  })
})

/**
 * La regla mira si el número CUANTIFICA algo, no si hay un dígito.
 *
 * La primera versión marcaba cualquier cifra y tumbó un caso de prueba que sólo
 * contenía "alert(1)" dentro de un texto escapado: un dígito suelto no es una
 * afirmación sobre el candidato. Lo que hay que cazar es "250-350 palabras" o
 * "3 párrafos" — la cifra con la unidad que mide, que es como se afirma un dato.
 */
describe("qué cuenta como cifra afirmada", () => {
  beforeEach(() => vi.clearAllMocks())

  it("no reintenta por un dígito que no mide nada", async () => {
    const body = "Me interesa el puesto en Acme.\n\nMantengo el parser alert(1) y quedo a disposición."
    const { client, chat } = queuedClient([body])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter("u1", input({ language: "es" }), "PRO")
    expect(chat.mock.calls.length).toBe(1)
  })

  it("sí reintenta por un rango con su unidad", async () => {
    const leak = "Te la devuelvo dentro de las 250-350 palabras pedidas."
    const clean = "Me interesa el puesto en Acme por su foco en el trato diario.\n\nQuedo a disposición."
    const { client, chat } = queuedClient([leak, clean])
    const mod = new AICoverLetterModule(client, logger as never)
    const r = await mod.generateCoverLetter("u1", input({ language: "es" }), "PRO")
    expect(chat.mock.calls.length).toBe(2)
    expect(r.body).not.toContain("250")
  })

  it("acepta la cifra del candidato aunque su unidad cambie de palabra", async () => {
    const body = "Con 9 años de trayectoria, me interesa el puesto en Acme.\n\nQuedo a disposición."
    const { client, chat } = queuedClient([body])
    const mod = new AICoverLetterModule(client, logger as never)
    // El perfil dice "9 años de experiencia"; la carta escribe "9 años de trayectoria".
    await mod.generateCoverLetter("u1", input({ language: "es", userPrompt: "Tengo 9 años de experiencia en caja" }), "PRO")
    expect(chat.mock.calls.length).toBe(1)
  })
})
