import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL_PROSE: "gpt-prose", AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "", logAIUsage: vi.fn(),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() } } }))

import { AICoverLetterModule } from "@/lib/services/ai/modules/AICoverLetterModule"

/**
 * La nota ATS viaja CON la carta.
 *
 * El motor ya puntuaba el borrador dentro del bucle de generación —"el algoritmo
 * detecta, la IA escribe"— y el resultado se tiraba: `return { body }`. Para ver
 * un número que el servidor había calculado antes de responder, el usuario tenía
 * que irse a otra pantalla. Es determinista: devolverlo no cuesta un token.
 *
 * LA REGLA QUE ESTE TEST PROTEGE: es un DATO, nunca una puerta. Ninguna nota, por
 * baja que sea, puede impedir que la carta se entregue. Un guard que frena la
 * entrega de información útil es exactamente lo que el CEO prohibió.
 */
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
const LETTER = "Coordino la gestion de cartera vencida y la negociacion de acuerdos de pago con clientes.\n\nQuedo a disposicion para ampliar estos puntos."
const client = () => {
  const chat = vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify({ body: LETTER }) } }],
    usage: { prompt_tokens: 10, completion_tokens: 10 },
  }))
  return { client: { chat } as never, chat }
}
const JD = "Buscamos analista de cobranzas para gestion de cartera vencida, negociacion de acuerdos de pago y reportes mensuales."

describe("la nota ATS vuelve con la carta", () => {
  beforeEach(() => vi.clearAllMocks())

  it("la devuelve cuando hubo oferta contra la cual puntuar", async () => {
    const { client: c } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    const res = await mod.generateCoverLetter("u1", { jobTitle: "Analista", language: "es", tone: "balanced", jobDescription: JD }, "PRO")
    expect(res.ats).toBeDefined()
    expect(typeof res.ats?.score).toBe("number")
    expect(Array.isArray(res.ats?.matched)).toBe(true)
  })

  it("no la inventa cuando no hay oferta: sin nada que medir, no hay nota", async () => {
    const { client: c } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    const res = await mod.generateCoverLetter("u1", { jobTitle: "Analista", language: "es", tone: "balanced" }, "PRO")
    expect(res.ats).toBeUndefined()
    expect(res.body.length).toBeGreaterThan(0)
  })

  /** LO QUE NO PUEDE PASAR NUNCA: que una nota baja se coma la carta. */
  it("entrega la carta igual cuando la nota es mala", async () => {
    const chat = vi.fn(async () => ({
      choices: [{ message: { content: JSON.stringify({ body: "Me interesa el puesto y quedo a disposicion.\n\nGracias por su tiempo." }) } }],
      usage: {},
    }))
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const res = await mod.generateCoverLetter("u1", { jobTitle: "Analista", language: "es", tone: "balanced", jobDescription: JD }, "PRO")
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.ats).toBeDefined()
  })

  it("no cuesta una llamada más: la nota es determinista", async () => {
    const { client: c, chat } = client()
    const mod = new AICoverLetterModule(c, logger as never)
    await mod.generateCoverLetter("u1", { jobTitle: "Analista", language: "es", tone: "balanced", jobDescription: JD }, "PRO")
    expect(chat.mock.calls.length).toBeLessThanOrEqual(2) // 1 + a lo sumo el reintento ATS que ya existía
  })
})

/**
 * LO QUE EL SERVIDOR YA SABÍA Y NO DECÍA.
 *
 * ── LA DECISIÓN (CEO, 2026-08-27) ───────────────────────────────────────────
 *
 * De las 49 frases prohibidas sólo 9 tienen un reemplazo determinista seguro
 * —fórmulas de apertura—. Las otras 40 («team player», «detail-oriented») son
 * cualidades AFIRMADAS: no se cambian por otra palabra, se cambian contando qué
 * hizo la persona, y eso es reescribir la oración.
 *
 * Lo que sobrevivía a la sustitución iba al log y el usuario NO SE ENTERABA: su
 * carta salía con la frase puesta. Las salidas eran rechazar y reintentar —una
 * llamada más por carta afectada, y sin garantía: el modelo puede devolver otro
 * cliché distinto—, dejarlo así, o DECIRLO. Se dice: cuesta cero tokens y deja la
 * decisión donde corresponde, igual que el informe hace con una viñeta que abre
 * mal.
 */
describe("las frases que afirman una cualidad se le dicen al usuario", () => {
  const conCliches = "I am excited to apply. I am a team player and detail-oriented, passionate about mobile.\n\nIn my last role I rewrote the Core Data stack and cut crash rates by 20%."
  // La MISMA forma que el cliente de arriba: el mock que no la respeta prueba
  // otra cosa que el producto.
  const clienteCon = (texto: string) => ({
    chat: vi.fn(async () => ({
      choices: [{ message: { content: JSON.stringify({ body: texto }) } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    })),
  })

  it("las nombra, y son las que la sustitución NO puede arreglar sola", async () => {
    const mod = new AICoverLetterModule(clienteCon(conCliches) as never, logger as never)
    const res = await mod.generateCoverLetter("u1", { jobTitle: "iOS Developer", language: "en", tone: "balanced" }, "PRO")
    // «I am excited to» tiene reemplazo determinista y NO debe aparecer acá: se
    // arregló sola, sin gastar un token y sin molestar al usuario.
    expect(res.weakPhrases ?? []).not.toContain("i am excited to")
    // Las cualidades afirmadas sí: son las que sólo la persona puede cambiar.
    expect(res.weakPhrases ?? []).toEqual(expect.arrayContaining(["team player"]))
  })

  it("y NUNCA impide entregar la carta: es un dato, no una puerta", async () => {
    const mod = new AICoverLetterModule(clienteCon(conCliches) as never, logger as never)
    const res = await mod.generateCoverLetter("u1", { jobTitle: "iOS Developer", language: "en", tone: "balanced" }, "PRO")
    expect(res.body.length).toBeGreaterThan(0)
  })

  it("una carta que cuenta trabajo real no recibe ninguna marca", async () => {
    const limpia = "I rewrote the Core Data stack and cut crash rates by 20% over two releases.\n\nI coordinated the release pipeline with the QA team each sprint."
    const mod = new AICoverLetterModule(clienteCon(limpia) as never, logger as never)
    const res = await mod.generateCoverLetter("u1", { jobTitle: "iOS Developer", language: "en", tone: "balanced" }, "PRO")
    expect(res.weakPhrases ?? []).toEqual([])
  })
})
