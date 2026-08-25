import { describe, it, expect } from "vitest"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks } from "@/lib/ats/report"
import type { WritingChecks } from "@/lib/ats/writing-checks"
import type { ATSContentQuality } from "@/lib/services/ai/shared/ai-types"

/**
 * LA BRECHA DE AÑOS INFORMA, NO CASTIGA (F2).
 *
 * Es una señal que un ATS real sí extrae —Greenhouse la calibra por nombre— así
 * que decirla es honesto. Cobrarla no lo es mientras no esté medida contra CVs
 * reales: un requisito mal juzgado no resta unos puntos, baja el TECHO, y eso ya
 * se pagó una vez con una licenciatura que el CV sí tenía.
 */
const emptyWriting = (): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true,
})

const base = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 60,
  categories: [],
  writing: emptyWriting(),
  content: { totalBullets: 0, quantifiedBullets: 0, quantificationPct: 0, weakOpenerBullets: 0, metriclessBullets: [] } as unknown as ATSContentQuality,
  missingKeywords: [],
  listedOnlyKeywords: [],
  matchedKeywords: [],
  missingSoftSkills: [],
  matchedSoftSkills: [],
  unmetRequirements: [],
  templateSafety: "safe",
  recruiterFixes: [],
  ...over,
})

describe("la brecha de años", () => {
  it("se muestra cuando el CV suma menos años de los que pide la oferta", () => {
    const r = buildAtsReport(base({
      posting: { jobTitle: "Cajero", hardSkills: [], softSkills: [], mustHaves: [], yearsRequired: 5 },
      cvYears: 3,
    }))
    const c = allChecks(r).find((x) => x.id === "search.years_gap")
    expect(c, "no se informó la brecha").toBeDefined()
    expect(c?.params).toMatchObject({ required: 5, actual: 3 })
  })

  it("y no cuesta un solo punto", () => {
    const r = buildAtsReport(base({
      posting: { jobTitle: "Cajero", hardSkills: [], softSkills: [], mustHaves: [], yearsRequired: 5 },
      cvYears: 3,
    }))
    const c = allChecks(r).find((x) => x.id === "search.years_gap")
    expect(c?.weight, "la brecha empezó a cobrar puntos").toBe(0)
    expect(c?.state, "pintarla como crítica sería mentir sobre lo que cuesta").toBe("warn")
  })

  it("calla cuando el CV llega o cuando la oferta no dice años", () => {
    const llega = buildAtsReport(base({
      posting: { jobTitle: "Cajero", hardSkills: [], softSkills: [], mustHaves: [], yearsRequired: 3 },
      cvYears: 4,
    }))
    expect(allChecks(llega).find((x) => x.id === "search.years_gap")).toBeUndefined()

    const sinDato = buildAtsReport(base({
      posting: { jobTitle: "Cajero", hardSkills: [], softSkills: [], mustHaves: [] },
      cvYears: 1,
    }))
    expect(allChecks(sinDato).find((x) => x.id === "search.years_gap")).toBeUndefined()
  })
})
