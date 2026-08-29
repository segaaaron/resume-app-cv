import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * EL BORDE HTTP DEL MOTOR v3, ejecutado.
 *
 * Todo lo demás del motor está probado ejecutándolo, pero la ruta no: es la
 * pieza donde viven el plan, la cuota, el stream y el caché en base de datos, y
 * donde un descuido no se ve hasta que un usuario paga por una pantalla vacía.
 *
 * Lo que se fija acá es lo que el proyecto ya pagó una vez en otras rutas:
 *   - un 403 o un 429 NO puede viajar dentro de un 200,
 *   - la cuota se cobra antes de trabajar y se DEVUELVE si no se gastó nada,
 *   - una corrida servida del caché no llama al modelo.
 */

vi.mock("@/lib/controllers/shared", () => ({
  requireUser: vi.fn(),
  apiError: (status: number, code: string) =>
    new Response(JSON.stringify({ error: code }), { status, headers: { "Content-Type": "application/json" } }),
  handleError: (e: unknown) =>
    new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500 }),
}))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({
  enforceAIQuota: vi.fn(),
  refundDailyQuota: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { aiAnswerCache: { findUnique: vi.fn(), create: vi.fn() } },
}))
vi.mock("@/lib/ai-client", () => ({ AI_MODEL_PROSE: "modelo-de-prueba" }))
vi.mock("@/lib/services/ai/OpenAIClientAdapter", () => ({ OpenAIClientAdapter: class {} }))

const llamadas = { jd: 0, audit: 0, triage: 0 }
vi.mock("@/lib/services/ai/modules/AIAts3Module", () => ({
  AIAts3Module: class {
    async parseJob() {
      llamadas.jd++
      return {
        roleTitleRaw: "Cajera", roleTitleCanonical: "Cajera", seniority: null, yearsRequired: null,
        domain: null, workMode: null, language: "es",
        mustHave: [{ skill: "Arqueo", raw: "arqueo", years: null, category: null }],
        niceToHave: [], responsibilities: [], softSignals: [],
      }
    }
    async audit() {
      llamadas.audit++
      return {
        bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
        coverage: [{ skill: "Arqueo", requirement: "MUST", status: "FOUND" }], titleAlignment: 1,
      }
    }
    async triage() {
      llamadas.triage++
      return []
    }
  },
}))

import { POST } from "@/app/api/ai/ats3/route"
import { requireUser } from "@/lib/controllers/shared"
import { enforceAIQuota, refundDailyQuota } from "@/lib/services/ai/shared/quota-enforcer"
import { db } from "@/lib/db"

const CUERPO = {
  resumeId: "cv1",
  jobDescription: "Buscamos cajera con arqueo de caja y atención al público en sucursal",
  language: "es",
  resume: {
    summary: "Cajera con experiencia",
    workExperience: [
      { jobTitle: "Cajera", employer: "Súper", startDate: "2021-03", endDate: "2024-06", description: "• Realicé el arqueo" },
    ],
    skills: [{ name: "Excel" }],
  },
  checks: {},
}

const req = (body: unknown) =>
  new Request("https://app.test/api/ai/ats3", { method: "POST", body: JSON.stringify(body) })

/** Lee el NDJSON como lo lee el panel: una línea por acto. */
async function actos(res: Response): Promise<Record<string, unknown>[]> {
  const texto = await res.text()
  return texto.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l))
}

beforeEach(() => {
  vi.clearAllMocks()
  llamadas.jd = 0; llamadas.audit = 0; llamadas.triage = 0
  vi.mocked(requireUser).mockResolvedValue({ userId: "u1", user: { plan: "PRO", email: "a@b.com" } } as never)
  vi.mocked(enforceAIQuota).mockResolvedValue(undefined as never)
  vi.mocked(db.aiAnswerCache.findUnique).mockResolvedValue(null as never)
  vi.mocked(db.aiAnswerCache.create).mockResolvedValue({} as never)
})

describe("la ruta del motor v3", () => {
  it("entrega el análisis en actos, y el puntaje llega primero", async () => {
    const res = await POST(req(CUERPO))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("ndjson")
    // Sin esto un proxy junta los actos: el streaming existiría en el servidor
    // y no en la pantalla.
    expect(res.headers.get("Cache-Control")).toContain("no-transform")

    const salida = await actos(res)
    expect(salida.map((a) => a.act)).toEqual(["score", "job", "covered", "triage", "findings", "done"])
    const score = salida[0].score as { total: number }
    expect(score.total).toBeGreaterThan(0)
    expect(score.total).toBeLessThanOrEqual(100)
  })

  it("cobra la cuota ANTES de trabajar", async () => {
    await POST(req(CUERPO))
    expect(enforceAIQuota).toHaveBeenCalledWith("u1", "ats3", "PRO")
  })

  it("un plan sin acceso responde su código, NUNCA dentro de un 200", async () => {
    vi.mocked(enforceAIQuota).mockRejectedValue(
      Object.assign(new Error("feature_pro_only"), { status: 403 }) as never,
    )
    const res = await POST(req(CUERPO))
    // Apenas se manda el primer byte el estado ya viajó: un 403 escondido en un
    // 200 le muestra al usuario un panel vacío en vez del aviso correcto.
    expect(res.status).not.toBe(200)
  })

  it("datos inválidos responden 422 y no llaman al modelo", async () => {
    const res = await POST(req({ resumeId: "cv1", jobDescription: "corto" }))
    expect(res.status).toBe(422)
    expect(llamadas.jd).toBe(0)
  })

  it("una corrida servida del caché no llama al modelo y DEVUELVE la cuota", async () => {
    // La cuota se cobra antes de trabajar —es lo que frena un bucle— pero
    // reanalizar un CV que no cambió no gasta una sola llamada.
    vi.mocked(db.aiAnswerCache.findUnique).mockImplementation((async (args: { where: { kind_inputHash: { kind: string } } }) => {
      const kind = args.where.kind_inputHash.kind
      if (kind === "ats3-jd") return { payload: {
        roleTitleRaw: "Cajera", roleTitleCanonical: "Cajera", seniority: null, yearsRequired: null,
        domain: null, workMode: null, language: "es",
        mustHave: [{ skill: "Arqueo", raw: "arqueo", years: null, category: null }],
        niceToHave: [], responsibilities: [], softSignals: [],
      } }
      if (kind === "ats3-audit") return { payload: {
        bullets: [], summary: { identity: true, proof: true, fit: true, extra: true },
        coverage: [{ skill: "Arqueo", requirement: "MUST", status: "FOUND" }], titleAlignment: 1,
      } }
      if (kind === "ats3-triage") return { payload: [] }
      return null
    }) as never)

    const salida = await actos(await POST(req(CUERPO)))
    expect(llamadas).toEqual({ jd: 0, audit: 0, triage: 0 })
    expect((salida.at(-1)!.telemetry as { calls: number }).calls).toBe(0)
    expect(refundDailyQuota).toHaveBeenCalledWith("u1", "ats3", "PRO")
  })

  it("la vacante se guarda SIN resumeId: dos candidatos con el mismo aviso la comparten", async () => {
    await POST(req(CUERPO))
    const escrituras = vi.mocked(db.aiAnswerCache.create).mock.calls.map((c) => c[0].data as Record<string, unknown>)
    const vacante = escrituras.find((d) => d.kind === "ats3-jd")
    expect(vacante?.resumeId).toBeNull()
    // Lo derivado del CV sí cuelga de él: se borra cuando el usuario lo borra.
    expect(escrituras.find((d) => d.kind === "ats3-audit")?.resumeId).toBe("cv1")
  })

  it("un caché roto cuesta una llamada, nunca la petición", async () => {
    vi.mocked(db.aiAnswerCache.findUnique).mockRejectedValue(new Error("la base no responde") as never)
    vi.mocked(db.aiAnswerCache.create).mockRejectedValue(new Error("la base no responde") as never)
    const res = await POST(req(CUERPO))
    expect(res.status).toBe(200)
    expect((await actos(res)).map((a) => a.act)).toContain("findings")
  })

  it("un cuerpo gigante se rechaza en el borde", async () => {
    const res = await POST(req({ ...CUERPO, jobDescription: "x".repeat(20_001) }))
    expect(res.status).toBe(422)
    expect(llamadas.jd).toBe(0)
  })
})
