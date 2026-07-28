/**
 * Per-engine ATS simulation (Phase 2) — deterministic, no LLM.
 *
 * The point of the feature is that the SAME resume gets DIFFERENT verdicts per engine,
 * because each real ATS is documented to trip on a different subset. These tests prove:
 *   · a clean resume passes all five engines,
 *   · each documented failure hits exactly the engines that are documented to fail on it,
 *   · the output is deterministic,
 *   · nothing throws on empty/garbage input.
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { simulateAtsEngines, type EngineId } from "@/lib/ats/engines"
import { computeResumeSignals } from "@/lib/ats/signals"

const CLEAN = [
  "Ana Rivas - Sales Lead",
  "ana@example.com | +34 600 000 000",
  "",
  "SUMMARY",
  "Sales lead with Kubernetes and analytics experience.",
  "",
  "EXPERIENCE",
  "Sales Lead at Acme, Jan 2020 - Mar 2024",
  "- Grew sales 30 percent year over year",
  "- Ran analytics on Kubernetes clusters",
  "",
  "SKILLS",
  "Sales, Kubernetes, Analytics, Leadership",
  "",
  "EDUCATION",
  "BSc Computer Science, Mar 2016",
].join("\n")

/** A layout whose extracted text has an isolated token between wide gaps on 9+ lines. */
const TWO_COLUMN = Array.from({ length: 10 }, (_, i) =>
  `Experience line ${i} content here          SKILL${i}          more body text here`,
).join("\n")

const verdictOf = (sim: ReturnType<typeof simulateAtsEngines>, engine: EngineId) =>
  sim.engines.find((e) => e.engine === engine)!.verdict

describe("clean resume passes every engine", () => {
  it("all five verdicts are clean, no findings", () => {
    const sim = simulateAtsEngines(CLEAN, "en")
    expect(sim.cleanCount).toBe(5)
    expect(sim.total).toBe(5)
    for (const e of sim.engines) {
      expect(e.verdict, `${e.label} should be clean`).toBe("clean")
      expect(e.findings).toHaveLength(0)
    }
  })
})

describe("same resume, DIFFERENT verdict per engine — the whole point", () => {
  it("a non-standard section label breaks Greenhouse and Taleo, not Workday/Lever", () => {
    // Greenhouse returns an empty array on a renamed section; Taleo needs exact labels.
    // Workday and Lever are not documented to fail on the label itself.
    const resume = CLEAN.replace("EXPERIENCE", "MY CAREER STORY")
    const sim = simulateAtsEngines(resume, "en")
    expect(verdictOf(sim, "greenhouse")).toBe("risk")
    expect(verdictOf(sim, "taleo")).toBe("risk")
    expect(verdictOf(sim, "workday")).toBe("clean")
    expect(verdictOf(sim, "lever")).toBe("clean")
  })

  it("a two-column layout is fatal in Lever/Taleo/Workday, only caution in Greenhouse/iCIMS", () => {
    // Lever silently drops the sidebar; Taleo is worst with columns; Workday's strict
    // parser reorders. Greenhouse tolerates modern formatting; iCIMS asks for manual confirm.
    const signals = computeResumeSignals(TWO_COLUMN, "en")
    expect(signals.multiColumn, "test fixture must trigger multi-column").toBe(true)

    const sim = simulateAtsEngines(TWO_COLUMN, "en")
    expect(verdictOf(sim, "lever")).toBe("risk")
    expect(verdictOf(sim, "taleo")).toBe("risk")
    expect(verdictOf(sim, "workday")).toBe("risk")
    expect(verdictOf(sim, "greenhouse")).toBe("caution")
    expect(verdictOf(sim, "icims")).toBe("caution")
  })

  it("mixed dates break the strict engines, and iCIMS flags manual entry", () => {
    // Workday/Taleo enforce a strict format; iCIMS sends the block to manual entry.
    // Greenhouse (flexible dates) and Lever are not documented to fail on dates.
    const resume = CLEAN.replace("Mar 2024", "03/2024")
    const sim = simulateAtsEngines(resume, "en")
    expect(verdictOf(sim, "workday")).toBe("risk")
    expect(verdictOf(sim, "taleo")).toBe("risk")
    expect(verdictOf(sim, "icims")).toBe("risk")
    expect(verdictOf(sim, "greenhouse")).toBe("clean")
    expect(verdictOf(sim, "lever")).toBe("clean")
  })

  it("decorative bullets fail Taleo but only caution iCIMS; others unaffected", () => {
    const resume = CLEAN.replace("- Grew sales", "→ Grew sales").replace("- Ran analytics", "✓ Ran analytics")
    const sim = simulateAtsEngines(resume, "en")
    expect(verdictOf(sim, "taleo")).toBe("risk")
    expect(verdictOf(sim, "icims")).toBe("caution")
    expect(verdictOf(sim, "workday")).toBe("clean")
    expect(verdictOf(sim, "greenhouse")).toBe("clean")
  })

  it("contact in a header/footer blinds Workday, cautions Lever", () => {
    const resume = CLEAN + "\n\nPage 2\nana@example.com | +34 600 000 000\nMore experience..."
    const sim = simulateAtsEngines(resume, "en")
    expect(verdictOf(sim, "workday")).toBe("risk")
    expect(verdictOf(sim, "lever")).toBe("caution")
  })
})

describe("findings carry a documented message and a stable code", () => {
  it("Lever's sidebar-drop message names the real behaviour", () => {
    const sim = simulateAtsEngines(TWO_COLUMN, "en")
    const lever = sim.engines.find((e) => e.engine === "lever")!
    expect(lever.findings[0].code).toBe("multiColumn")
    expect(lever.findings[0].message).toMatch(/silently drops the sidebar/i)
  })

  it("Spanish locale returns Spanish messages", () => {
    const resume = CLEAN.replace("Mar 2024", "03/2024")
    const sim = simulateAtsEngines(resume, "es")
    const workday = sim.engines.find((e) => e.engine === "workday")!
    expect(workday.behavior).toMatch(/estricto/)
    expect(workday.findings.some((f) => /Fechas inconsistentes/.test(f.message))).toBe(true)
  })
})

describe("robustness + determinism", () => {
  it("empty and garbage input never throw, and parse clean (nothing to trip on)", () => {
    for (const input of ["", "   ", "asdf", "\n\n\n"]) {
      const sim = simulateAtsEngines(input, "en")
      expect(sim.engines).toHaveLength(5)
      expect(sim.cleanCount).toBe(5)
    }
  })

  it("same input -> byte-identical output", () => {
    const a = JSON.stringify(simulateAtsEngines(TWO_COLUMN, "en"))
    const b = JSON.stringify(simulateAtsEngines(TWO_COLUMN, "en"))
    expect(a).toBe(b)
  })

  it("analyzeAts now exposes the engine simulation", async () => {
    const { analyzeAts } = await import("@/lib/ats/analyzer")
    const res = analyzeAts({ resumeText: CLEAN, jobDescription: "Sales Lead", locale: "en" })
    expect(res.engines.engines).toHaveLength(5)
    expect(res.engines.cleanCount).toBe(5)
  })
})
