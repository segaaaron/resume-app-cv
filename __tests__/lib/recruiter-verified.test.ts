import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { buildPanelReport } from "@/lib/ats/panel-report"

/** Lo que el reportero de errores mandó al servidor durante el test. */
const posted: Array<{ message: string }> = []
import { rejectionOf, verifiedRecruiterFixes, verifyContextOf } from "@/lib/ats/recruiter-verified"
import type { RecruiterFix } from "@/lib/ats/build-report"

/**
 * EL ATS MANDA. Un hallazgo del modelo entra si el CV lo respalda.
 *
 * «El que manda es el ATS. Si tenés otras cosas que validar, deberías validar
 * contra la respuesta del ATS y no a ciegas» (CEO, 2026-08-21). Auditados los
 * ocho productores del informe, siete eran deterministas y `criticalFixes` era
 * el único que llegaba del modelo a pantalla sin que nadie comprobara nada.
 */
const cv = {
  workExperience: [
    {
      id: "j1",
      jobTitle: "Ejecutivo Comercial",
      description:
        "• Implementar estrategias comerciales y promociones orientadas a la rotación de productos, logrando aumentar las ventas entre un 15% y 20%.\n• Atención a clientes en sala.",
    },
  ],
}

const resumeText =
  "Ejecutivo Comercial. Implementar estrategias comerciales y promociones orientadas a la rotación de productos, logrando aumentar las ventas entre un 15% y 20%. Atención a clientes en sala."

const ctx = () => verifyContextOf(cv, resumeText)

const fix = (over: Partial<RecruiterFix> = {}): RecruiterFix => ({
  issue: 'La línea "Implementar estrategias comerciales y promociones orientadas" está en infinitivo.',
  fix: "Ejecuté estrategias comerciales…",
  severity: "high",
  action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
  ...over,
})

describe("un hallazgo que el CV respalda", () => {
  it("pasa entero", () => {
    expect(rejectionOf(fix(), ctx())).toBeNull()
  })

  /**
   * La lectura general del reclutador no cita ni apunta a una línea. No hay nada
   * que contrastar, y descartarla sería tirar justo lo que aporta.
   */
  it("un juicio general sin cita ni línea también pasa", () => {
    expect(rejectionOf(fix({ issue: "El CV se lee genérico para esta vacante.", action: undefined }), ctx())).toBeNull()
  })
})

describe("lo que ya no llega a pantalla", () => {
  /**
   * EL CASO DE LA CAPTURA. «"…" en , índice 3, está en infinitivo»: el modelo no
   * supo nombrar el puesto, dejó el hueco y lo mostrábamos con la coma colgando.
   * El usuario no distingue un error del modelo de uno del producto.
   */
  it("una referencia con el nombre en blanco", () => {
    const f = fix({ issue: '"Implementar estrategias comerciales" en , índice 3, está en infinitivo.' })
    expect(rejectionOf(f, ctx())).toBe("broken_reference")
  })

  /**
   * LA COMA INCIDENTAL NO ES UN HUECO, y confundirlas costaba caro.
   *
   * La primera versión de este guard usaba `\s*` y descartaba tres hallazgos
   * buenos de cada tres que llevaran una aclaración entre comas. Medido antes de
   * que llegara a producción. Lo que separa un caso del otro es el espacio: el
   * hueco real deja «en , índice 3»; la frase normal va pegada, «de, entre otras».
   */
  it("una aclaración entre comas NO es una referencia rota", () => {
    for (const issue of [
      "Responsable de, entre otras cosas, la atención al cliente.",
      "A cargo de, además, la caja chica.",
      "Trabajó en, por ejemplo, tres sucursales distintas.",
    ]) {
      expect(rejectionOf({ issue }, ctx()), issue).toBeNull()
    }
  })

  /** El modelo habla de un CV que no es éste. */
  it("una cita que no está en el CV", () => {
    const f = fix({ issue: 'La línea "Gestioné un equipo de veinte vendedores" no tiene métrica.' })
    expect(rejectionOf(f, ctx())).toBe("quote_not_in_cv")
  })

  /** El botón no podría aplicar nada, y el usuario buscaría una línea que no hay. */
  it("un arreglo que apunta a un puesto inexistente", () => {
    const f = fix({ action: { kind: "rewrite_bullet", targetId: "j99", index: 0 } })
    expect(rejectionOf(f, ctx())).toBe("missing_target")
  })

  it("y uno que apunta a un puesto sin ninguna viñeta", () => {
    const empty = verifyContextOf({ workExperience: [{ id: "j1", description: "" }] }, resumeText)
    expect(rejectionOf(fix(), empty)).toBe("missing_target")
  })
})

describe("lo que NO se juzga acá", () => {
  /**
   * El índice es una PISTA, no la identidad (`bullet-locate.ts`). Exigir que
   * caiga justo descartaría hallazgos buenos cuyo número se corrió porque el
   * usuario editó el puesto entre el análisis y la lectura.
   */
  it("un índice corrido no descarta el hallazgo", () => {
    expect(rejectionOf(fix({ action: { kind: "rewrite_bullet", targetId: "j1", index: 7 } }), ctx())).toBeNull()
  })

  /**
   * Una palabra suelta entre comillas es el término del que habla, no una cita
   * del documento. Tratarla como cita descartaría hallazgos correctos sobre
   * términos que —justamente— NO están en el CV.
   */
  it("un término corto entrecomillado no cuenta como cita", () => {
    expect(rejectionOf(fix({ issue: 'Falta "CRM" en tus viñetas.', action: undefined }), ctx())).toBeNull()
  })
})

describe("lo descartado se cuenta", () => {
  /**
   * Un guard que sólo dice «no» esconde si está filtrando de más. Si un día se
   * come la mitad de los hallazgos, es el PROMPT lo que se rompió — y sin el
   * número eso se lee como «el modelo dejó de encontrar cosas».
   */
  it("dice cuántos cayó y por qué", () => {
    const out = verifiedRecruiterFixes(
      [
        fix(),
        fix({ issue: '"Algo" en , índice 3.' }),
        fix({ issue: 'La línea "Gestioné un equipo de veinte vendedores" flojea.' }),
        fix({ action: { kind: "rewrite_bullet", targetId: "nope", index: 0 } }),
      ],
      ctx(),
    )
    expect(out.kept).toHaveLength(1)
    expect(out.rejected).toEqual({ broken_reference: 1, quote_not_in_cv: 1, missing_target: 1 })
  })
})

/**
 * QUE EL FILTRO SE LO COMA TODO SE REGISTRA.
 *
 * El recuento por motivo existía desde el principio y un comentario prometía que
 * servía «para vigilar que el filtro no se coma lo bueno» — pero el número no
 * llegaba a ninguna parte. Un comentario que promete lo que el código no hace es
 * peor que no tenerlo.
 *
 * Sólo cuando no sobrevive ninguno: es el único caso que el usuario nota —pagó
 * el uso y ve la sección vacía— y el único que no se explica por un CV normal.
 */
describe("el aviso cuando no sobrevive ningún hallazgo", () => {
  const noop = () => {}
  const emptyWriting = () => ({
    clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
    bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
    nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
    metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
  })

  const build = (fixes: unknown[]) =>
    buildPanelReport({
      result: { score: 70, analysis: { criticalFixes: fixes } } as never,
      writing: emptyWriting() as never,
      content: { totalBullets: 1, quantifiedBullets: 0, quantificationPct: 0, weakOpenerBullets: 0, metriclessBullets: [] } as never,
      sectionData: cv,
      jobDescription: "Ventas",
    })

  const BUENO = {
    issue: 'La línea "Implementar estrategias comerciales y promociones orientadas" está en infinitivo.',
    severity: "high", fix: "Ejecuté…",
    action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
  }
  const MALO = { issue: 'La línea "Gestioné un equipo de veinte vendedores" flojea.', severity: "high", fix: "x" }

  beforeEach(() => {
    posted.length = 0
    vi.stubGlobal("window", { location: { pathname: "/editor" } })
    vi.stubGlobal("fetch", (_u: string, o: { body: string }) => {
      posted.push(JSON.parse(o.body) as { message: string })
      return Promise.resolve({ ok: true } as Response)
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("avisa cuando el árbitro descartó todo", () => {
    build([MALO])
    expect(posted.map((p) => p.message)).toContain("ux: recruiter_findings_all_dropped")
  })

  /** Que caiga alguno es el guard trabajando; registrarlo sería puro ruido. */
  it("no avisa cuando sobrevive alguno", () => {
    build([BUENO, MALO])
    expect(posted.map((p) => p.message)).not.toContain("ux: recruiter_findings_all_dropped")
  })

  it("ni cuando no había nada que descartar", () => {
    build([])
    expect(posted).toEqual([])
    void noop
  })
})
