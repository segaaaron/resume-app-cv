import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { applyAllPlan, isReadyToSend, allChecks, type AtsReport } from "@/lib/ats/report"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { appliedSignatures, rememberApplied, forgetApplied } from "@/lib/ats/applied-memory"
import { textSignature, matchesApplied } from "@/lib/ats/action-plan"
import { postingTermsLost } from "@/lib/ats/keyword-safety"
import type { WritingChecks } from "@/lib/ats/writing-checks"

/**
 * LO QUE EL USUARIO YA ACEPTÓ NO SE LE VUELVE A OFRECER.
 *
 * Al aplicar un arreglo el CV cambia; como la clave de caché del análisis incluye
 * el texto del CV, la corrida siguiente le pregunta al modelo DE CERO, y el
 * modelo vuelve a opinar sobre el párrafo que él mismo acababa de escribir. El
 * usuario lo leía como «me sugiere lo que ya tengo», y tenía razón.
 *
 * ── ESTE ARCHIVO SE REESCRIBIÓ ENTERO (2026-08-21) ─────────────────────────
 *
 * Tenía QUINCE asserts que buscaban cadenas dentro del código fuente:
 * `toContain("rememberApplied")`, `toContain("appliedSignatures(memoryResumeId)")`,
 * `toContain("criticalChecks(report).length === 0")`. Ninguno ejecutaba nada.
 * Pasaban en verde con la memoria desconectada, con el filtro invertido, con el
 * estado de «listo» roto — y bastaba con renombrar una variable para ponerlos en
 * rojo sin haber cambiado un comportamiento.
 *
 * Es parte de por qué los defectos de este panel llegaban a la pantalla del CEO
 * con la suite entera en verde. Ahora todo lo de acá corre las funciones y lee
 * lo que devuelven.
 */

const emptyWriting = (over: Partial<WritingChecks> = {}): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true,
  ...over,
})

const reportInput = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 72,
  categories: [],
  writing: emptyWriting(),
  missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
  templateSafety: "safe", recruiterFixes: [],
  ...over,
})

// ─────────────────────────────────────────────────────────────────────────────

describe("la firma reconoce el texto aceptado aunque vuelva distinto", () => {
  /**
   * Por qué firma y no texto exacto: el modelo reescribe su propia salida con
   * variaciones —cambia una preposición, reordena— y una comparación literal no
   * lo reconocería. Se compara por conjunto de palabras.
   */
  it("reconoce la misma frase con otra puntuación y otro orden", () => {
    const aceptado = "Ejecuté estrategias comerciales para la rotación de productos."
    const sigs = [textSignature(aceptado)]
    expect(matchesApplied("Ejecuté estrategias comerciales para la rotación de productos", sigs)).toBe(true)
  })

  it("y no confunde una frase distinta con una aceptada", () => {
    const sigs = [textSignature("Ejecuté estrategias comerciales de rotación.")]
    expect(matchesApplied("Atendí clientes en sala de ventas.", sigs)).toBe(false)
  })
})

describe("la memoria guarda por CV y sobrevive al re-análisis", () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    // El módulo accede por `window.localStorage`, no por el global suelto.
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("lo guardado se lee de vuelta", () => {
    rememberApplied("cv-1", "sig-a")
    expect(appliedSignatures("cv-1")).toContain("sig-a")
  })

  /** Dos CVs del mismo usuario no comparten lo aplicado. */
  it("no se mezcla entre CVs", () => {
    rememberApplied("cv-1", "sig-a")
    expect(appliedSignatures("cv-2")).not.toContain("sig-a")
  })

  it("y se puede olvidar", () => {
    rememberApplied("cv-1", "sig-a")
    forgetApplied("cv-1")
    expect(appliedSignatures("cv-1")).toEqual([])
  })
})

describe("un almacenamiento roto nunca rompe el panel", () => {
  /**
   * `localStorage` tira en ventana privada, con las cookies bloqueadas y en
   * algunos navegadores embebidos. Si eso propagara, el panel entero dejaría de
   * pintarse por una comodidad opcional.
   */
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => { throw new Error("denied") },
        setItem: () => { throw new Error("denied") },
        removeItem: () => { throw new Error("denied") },
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it("leer no tira, devuelve vacío", () => {
    expect(() => appliedSignatures("cv-1")).not.toThrow()
    expect(appliedSignatures("cv-1")).toEqual([])
  })

  it("escribir y olvidar tampoco tiran", () => {
    expect(() => rememberApplied("cv-1", "sig")).not.toThrow()
    expect(() => forgetApplied("cv-1")).not.toThrow()
  })
})

describe("lo aceptado se filtra en la ENTRADA al informe", () => {
  /**
   * En la entrada y no en cada tarjeta: si cada componente decidiera por su
   * cuenta, el hallazgo seguiría contando en los totales de los que no filtran
   * — que es como el botón terminó prometiendo un número y resolviendo otro.
   */
  const FIX = {
    issue: 'La línea "Implementar estrategias comerciales" está en infinitivo.',
    severity: "high",
    fix: "Ejecuté estrategias comerciales para la rotación.",
    action: { kind: "rewrite_bullet", targetId: "j1", index: 0 },
  }
  const cv = { workExperience: [{ id: "j1", jobTitle: "Ventas", description: "• Implementar estrategias comerciales." }] }

  const build = (isAlreadyAccepted?: (t?: string | null) => boolean) =>
    buildPanelReport({
      result: { score: 70, analysis: { criticalFixes: [FIX] } } as never,
      writing: emptyWriting(),
      sectionData: cv,
      jobDescription: "Ventas",
      isAlreadyAccepted,
    })

  /**
   * El aporte del reclutador vive en su propia tarjeta, o fusionado en la
   * determinista cuando la línea ya tenía una — «una viñeta, una tarjeta» es hoy
   * una propiedad del ensamblador, no algo que cada emisor recuerda. Lo que este
   * caso mide es la MEMORIA: que lo ya aceptado no vuelva a entrar por ninguna
   * puerta.
   */
  const aporteDelReclutador = (r: ReturnType<typeof build>) =>
    allChecks(r).filter((c) => c.id.startsWith("tips.recruiter") || (!!c.fixHint && c.action?.kind === "rewrite_bullet"))

  it("sin memoria, el hallazgo entra", () => {
    expect(aporteDelReclutador(build())).toHaveLength(1)
  })

  it("con el arreglo ya aceptado, no entra en ninguna parte del informe", () => {
    expect(aporteDelReclutador(build((t) => t === FIX.fix))).toHaveLength(0)
  })
})

describe("toda viñeta señalada llega con su objetivo apuntado", () => {
  /**
   * Sin `targetId` e `index`, el modal no sabe qué línea reescribir y el botón no
   * puede aplicar nada: el hallazgo se vería y no se podría resolver.
   */
  it("un casi-duplicado viaja como reescritura de esa línea", () => {
    const r = buildAtsReport(reportInput({
      writing: emptyWriting({
        nearDuplicates: [{ targetId: "j1", index: 2, text: "Atendí clientes", otherText: "Atención a clientes", jobTitle: "Ventas" }] as never,
      }),
    }))
    const check = allChecks(r).find((c) => c.action?.kind === "rewrite_bullet")
    expect(check).toBeDefined()
    expect(check?.action).toMatchObject({ targetId: "j1", index: 2 })
  })
})

describe("el estado de listo mira la nota Y los críticos abiertos", () => {
  const withCritical = () =>
    buildAtsReport(reportInput({ score: 100, unmetRequirements: ["Salesforce"] }))

  it("una nota alta con un crítico abierto no está lista", () => {
    const r = withCritical()
    expect(r.score).toBe(100)
    expect(isReadyToSend(r)).toBe(false)
  })

  it("y sin nada abierto sí", () => {
    expect(isReadyToSend(buildAtsReport(reportInput({ score: 100 })))).toBe(true)
  })

  /** Bajo el umbral no alcanza con no tener críticos. */
  it("una nota baja no está lista aunque no haya críticos", () => {
    expect(isReadyToSend(buildAtsReport(reportInput({ score: 55 })))).toBe(false)
  })
})

describe("una reescritura no puede perder términos de la vacante", () => {
  /**
   * La mitad del guard que sí protege al usuario. La otra —exigir que AGREGUE un
   * término— se retiró en 2026-08-19: descartaba enriquecimiento legítimo del
   * oficio, que es el valor que se paga.
   */
  it("avisa del término que la reescritura se llevó", () => {
    const lost = postingTermsLost(
      "Gestioné cuentas clave con Salesforce.",
      "Gestioné cuentas clave del segmento corporativo.",
      ["Salesforce"],
    )
    expect(lost).toEqual(["Salesforce"])
  })

  it("y no se queja cuando el término sobrevive", () => {
    expect(postingTermsLost(
      "Gestioné cuentas con Salesforce.",
      "Gestioné cuentas clave del corporativo usando Salesforce.",
      ["Salesforce"],
    )).toEqual([])
  })
})

describe("hay texto para el estado final en los dos idiomas", () => {
  it("las dos ramas tienen la copia, y con su interpolación", () => {
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(readFileSync(join(process.cwd(), `messages/${loc}.json`), "utf8")).editor.ats
      expect(m.ready_title, loc).toBeTruthy()
      expect(m.ready_body, loc).toContain("{score}")
    }
  })
})

describe("aplicar todo aplica todo", () => {
  /**
   * El botón decía «aplicar las 5» con 10 pendientes: las reescrituras entraban y
   * los términos —la palanca más grande del puntaje— quedaban afuera.
   */
  const plan = (over: Partial<AtsReport> = {}, applied = new Set<string>(), added?: Set<string>, listas?: Set<string>) =>
    applyAllPlan({
      score: 70,
      sections: [{ id: "hard", scoreCategory: "hardSkills", coveragePct: 40, checks: [
        { id: "c1", section: "hard", state: "warn", weight: 3, titleKey: "k", owner: "tailor",
          action: { kind: "rewrite_summary" } },
        { id: "c2", section: "hard", state: "warn", weight: 3, titleKey: "k", owner: "user" },
      ] }],
      terms: [
        { term: "Excel", section: "hard", jd: 2, cv: 0, listOnly: false },
        { term: "Ventas", section: "hard", jd: 1, cv: 3, listOnly: false },
      ],
      bullets: [], overOptimised: false, recoverable: 0, credibility: { score: 100, band: null },
      ...over,
    }, applied, added, listas)

  /**
   * ── ACTUALIZADO (2026-08-25) ─────────────────────────────────────────────
   *
   * `c1` es un `rewrite_summary`: NO se ejecuta solo, necesita el texto que el
   * ejecutor escribió. Entra al masivo únicamente cuando ese texto ya está —lo
   * dice el conjunto `ready`—, porque un clic que dispara N llamadas al modelo
   * termina abriendo N confirmaciones sobre UNA sola pantalla y tirando las que
   * no sobrevivieron. Ver `entraAlMasivo`.
   */
  it("aplica lo que el ejecutor YA escribió, y los términos que faltan", () => {
    expect(plan(undefined, undefined, undefined, new Set(["c1"]))).toEqual({ checkIds: ["c1"], terms: ["Excel"] })
  })

  it("y lo que todavía no está escrito no entra: se acepta de a uno", () => {
    expect(plan()).toEqual({ checkIds: [], terms: ["Excel"] })
  })

  it("no repite lo ya aplicado ni el término ya agregado", () => {
    expect(plan({}, new Set(["c1"]), new Set(["Excel"]), new Set(["c1"]))).toEqual({ checkIds: [], terms: [] })
  })
})
