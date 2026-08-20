import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() } } }))

import { AICoverLetterModule } from "@/lib/services/ai/modules/AICoverLetterModule"
import { LETTER_ONE_PAGE_WORDS } from "@/components/cover-letter/templates/_metrics"

/**
 * La carta que la IA escribe tiene que ENTRAR en la hoja — sin perder lo que la
 * hace valer.
 *
 * Medido en navegador: las 55 plantillas sostienen 377 palabras. El prompt pedía
 * 250–350 y nadie lo verificaba: `max_tokens: 900` deja llegar a unas 620, y el
 * usuario recibía un PDF de dos páginas donde la segunda lleva tres líneas.
 *
 * Pero acortar no puede costar contenido. Una carta más corta a la que le falta
 * una cifra es peor que una de dos páginas completa: lo que se paga acá es el
 * valor curricular, no el largo. De eso tratan la mitad de estos tests.
 */
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function reply(body: string) {
  return { choices: [{ message: { content: JSON.stringify({ body }) } }], usage: { prompt_tokens: 10, completion_tokens: 10 } }
}
function queuedClient(bodies: string[]) {
  let i = 0
  const chat = vi.fn(async () => reply(bodies[Math.min(i++, bodies.length - 1)]))
  return { client: { chat } as never, chat }
}
const input = (over: Record<string, unknown> = {}) => ({
  company: "Acme", jobTitle: "Engineer", tone: "balanced", language: "en" as const, ...over,
})

/** Prosa sin cifras ni marcas, para que sólo se mida el largo. */
const words = (n: number, seed = "steady delivery and careful follow up on every request") => {
  const pool = seed.split(" ")
  return Array.from({ length: n }, (_, i) => pool[i % pool.length]).join(" ")
}
const countWords = (html: string) =>
  html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length

describe("la carta entra en una página", () => {
  beforeEach(() => vi.clearAllMocks())

  it("no gasta un reintento cuando ya entra", async () => {
    const { client, chat } = queuedClient([words(120)])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(1)
  })

  it("comprime una carta que se pasa, y entrega la corta", async () => {
    const long = words(LETTER_ONE_PAGE_WORDS + 120)
    const short = words(200)
    const { client, chat } = queuedClient([long, short])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(countWords(res.body)).toBeLessThanOrEqual(LETTER_ONE_PAGE_WORDS)
  })

  /**
   * EL CASO QUE IMPORTA. La versión corta borró el "12" que el candidato declaró.
   * Entra en una página y es peor: gana la original. Dos páginas con la
   * información completa valen más que una página incompleta.
   */
  it("descarta la versión corta si se llevó puesta una cifra del candidato", async () => {
    const long = `I cut medication errors from 12 to 3 per month. ${words(LETTER_ONE_PAGE_WORDS)}`
    const shortButPoorer = `I cut medication errors sharply. ${words(150)}`
    const { client } = queuedClient([long, shortButPoorer])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input({ userPrompt: "I cut medication errors from 12 to 3 per month" }), "PRO")
    expect(res.body).toContain("12")
    expect(res.body).toContain("3 per month")
  })

  /** Comprimir tampoco es una licencia para inventar al reescribir. */
  it("descarta la versión corta si inventó algo al comprimir", async () => {
    const long = words(LETTER_ONE_PAGE_WORDS + 80)
    const shortInvented = `I raised revenue by 40% at Globex Corp. ${words(120)}`
    const { client } = queuedClient([long, shortInvented])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(res.body).not.toContain("Globex")
    expect(res.body).not.toContain("40%")
  })

  /** Nunca dos reintentos: esconde un prompt que dejó de funcionar. */
  it("no insiste: un solo reintento aunque la corta siga sin entrar", async () => {
    const { client, chat } = queuedClient([words(LETTER_ONE_PAGE_WORDS + 200), words(LETTER_ONE_PAGE_WORDS + 150)])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
  })

  it("nunca devuelve un hueco: si el reintento falla, entrega la larga", async () => {
    const long = words(LETTER_ONE_PAGE_WORDS + 100)
    let i = 0
    const chat = vi.fn(async () => {
      if (i++ === 0) return reply(long)
      throw new Error("boom")
    })
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(res.body.length).toBeGreaterThan(0)
    expect(countWords(res.body)).toBeGreaterThan(LETTER_ONE_PAGE_WORDS)
  })
})

describe("el prompt cita el número medido, no uno suelto", () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([["en"], ["es"]])("pide el largo en %s", async (language) => {
    const { client, chat } = queuedClient([words(100)])
    const mod = new AICoverLetterModule(client, logger as never)
    await mod.generateCoverLetter("u1", input({ language }), "PRO")
    const sent = JSON.stringify((chat.mock.calls as unknown[][])[0][0])
    expect(sent).toContain(String(LETTER_ONE_PAGE_WORDS))
  })

  /**
   * El número sale de la medición de las plantillas y vive con ellas. Si alguien
   * lo escribe a mano en el prompt, el día que una plantilla cambie su encabezado
   * los dos números se separan sin que nadie lo note.
   */
  it("el módulo lee la constante de las plantillas", () => {
    const src = readFileSync(join(process.cwd(), "lib/services/ai/modules/AICoverLetterModule.ts"), "utf8")
    expect(src).toContain('from "@/components/cover-letter/templates/_metrics"')
    expect(src).toMatch(/\$\{LETTER_ONE_PAGE_WORDS\} words TOTAL/)
    expect(src).toMatch(/\$\{LETTER_ONE_PAGE_WORDS\} palabras EN TOTAL/)
  })
})

/**
 * El otro camino: "Mejorar carta". Devuelve 3 versiones y NADA verificaba su
 * largo — se podía generar una carta que entraba, apretar Mejorar, y recibir una
 * que no. El guard vive en el MISMO reintento que ya existía para los clichés:
 * dos reintentos separados serían dos usos y dos esperas por una sola petición.
 */
function versionsReply(vs: string[]) {
  return { choices: [{ message: { content: JSON.stringify({ status: "improved", versions: vs }) } }], usage: { prompt_tokens: 10, completion_tokens: 10 } }
}
const improveInput = (body: string, over: Record<string, unknown> = {}) => ({
  body, company: "Acme", jobTitle: "Engineer", language: "en" as const, ...over,
})
/** Prosa distinta a la original, o `usableVersions` la descarta por eco. */
const alt = (n: number) => words(n, "handled scheduling reviewed records answered queries trained new staff daily")

describe("mejorar carta: las versiones también entran", () => {
  beforeEach(() => vi.clearAllMocks())

  it("no gasta reintento si al menos una versión entra", async () => {
    const chat = vi.fn(async () => versionsReply([alt(150), alt(200), alt(180)]))
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    await mod.improveCoverLetter("u1", improveInput(words(300)), "PRO")
    expect(chat).toHaveBeenCalledTimes(1)
  })

  it("reintenta cuando NINGUNA entra, y toma las que sí entran", async () => {
    const long = LETTER_ONE_PAGE_WORDS + 90
    let i = 0
    const chat = vi.fn(async () => {
      i += 1
      return i === 1
        ? versionsReply([alt(long), alt(long + 5), alt(long + 10)])
        : versionsReply([alt(180), alt(190), alt(200)])
    })
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const res = await mod.improveCoverLetter("u1", improveInput(words(400)), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.versions.every((v) => countWords(v) <= LETTER_ONE_PAGE_WORDS)).toBe(true)
  })

  /** Otra vez la misma vara: entrar no justifica perder un dato. */
  it("no toma la versión corta que borró una cifra del candidato", async () => {
    const long = `I cut errors from 12 to 3 per month. ${alt(LETTER_ONE_PAGE_WORDS)}`
    let i = 0
    const chat = vi.fn(async () => {
      i += 1
      return i === 1
        ? versionsReply([long, long, long])
        : versionsReply([`I cut errors sharply. ${alt(150)}`, long, long])
    })
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const res = await mod.improveCoverLetter("u1", improveInput(`I cut errors from 12 to 3 per month. ${words(300)}`), "PRO")
    expect(res.versions[0]).toContain("12")
  })

  it("nunca deja al usuario sin versiones si el reintento falla", async () => {
    let i = 0
    const chat = vi.fn(async () => {
      i += 1
      if (i === 1) return versionsReply([alt(LETTER_ONE_PAGE_WORDS + 60), alt(LETTER_ONE_PAGE_WORDS + 70), alt(LETTER_ONE_PAGE_WORDS + 80)])
      throw new Error("boom")
    })
    const mod = new AICoverLetterModule({ chat } as never, logger as never)
    const res = await mod.improveCoverLetter("u1", improveInput(words(400)), "PRO")
    expect(res.versions.length).toBeGreaterThan(0)
  })
})
