import { describe, it, expect } from "vitest"
import { findMergePairs, MERGE_PAIR_THRESHOLD } from "@/lib/services/ai/shared/semantic-match"
import { findMergeCandidates, buildMergeRoleInput } from "@/lib/ats/merge-candidates"

/**
 * The merge card never appeared, and no threshold could fix it.
 *
 * MEASURED on 20 hand-labelled pairs across ten trades in both languages:
 * `sharesSubject` asks whether two lines share vocabulary — the DUPLICATE
 * question — and offered 0 of 10 real merges, because five of them share no
 * content word at all ("Gestioné la agenda" / "Confirmé los turnos" is one job
 * written twice). Real merges scored 0.00–0.29 on that measure and non-merges
 * 0.00–0.17: overlapping bands, no cut between them.
 *
 * Cosine answers the question that was actually being asked. Real merges 0.498
 * to 0.632, different work 0.325 to 0.551 — still overlapping, so this PROPOSES
 * and never applies: the card shows both lines, the user clicks, the model may
 * decline, and a confirm stands between the answer and the CV.
 *
 * The vectors here are handmade so the test is about the ranking, not the model.
 */
const v = (x: number, y: number) => [x, y]
/** Cosine of the angle between two unit-ish vectors; easy to reason about. */
const at = (deg: number) => v(Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180))

/** Tres vectores unitarios con el MISMO coseno `c` entre cualquier par. */
const trio = (c: number) => {
  const y2 = Math.sqrt(1 - c * c)
  const x3 = (c - c * c) / y2
  return [
    [1, 0, 0],
    [c, y2, 0],
    [c, x3, Math.sqrt(Math.max(0, 1 - c * c - x3 * x3))],
  ]
}

const role = (targetId: string, texts: string[]) => ({
  targetId,
  candidates: texts.map((text, index) => ({ index, text })),
})

describe("findMergePairs proposes, ranked", () => {
  it("offers the closest pair and drops what falls under the floor", async () => {
    // 0 y 1 a 55° (cos ≈ 0.57): dentro de la banda de FUSIÓN medida
    // (0.498–0.569) y por debajo del corte de REPETICIÓN (0.62), que desde
    // 2026-08-24 se lleva los pares más parecidos a su propio hallazgo. La
    // tercera a 140°, lejos de las dos (cos ≈ −0.77 y 0.09).
    const embed = async () => [at(0), at(55), at(140)]
    const pairs = await findMergePairs([role("j", ["a", "b", "c"])], embed)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].indexes).toEqual([0, 1])
    expect(pairs[0].score).toBeGreaterThan(MERGE_PAIR_THRESHOLD)
  })

  it("never puts one bullet in two proposals", async () => {
    // Las tres EQUIDISTANTES en la banda de fusión (0.55 entre cualquier par):
    // 0-1, 0-2 y 1-2 pasan el piso sin llegar al corte de repetición. En dos
    // dimensiones no se puede — tres ángulos parecidos dejan siempre un par casi
    // idéntico, que ahora es una repetición, no una fusión.
    const embed = async () => trio(0.55)
    const pairs = await findMergePairs([role("j", ["a", "b", "c"])], embed)
    const used = pairs.flatMap((p) => p.indexes)
    expect(new Set(used).size).toBe(used.length)
  })

  it("keeps the real index of each bullet, not its position among the eligible ones", async () => {
    // 56° ≈ 0.56: fusionable, no repetido (ver el corte de arriba).
    const embed = async () => [at(0), at(56)]
    // Indexes 1 and 4 of the role; 0, 2 and 3 were filtered out upstream.
    const pairs = await findMergePairs([{
      targetId: "j",
      candidates: [{ index: 1, text: "a" }, { index: 4, text: "b" }],
    }], embed)
    expect(pairs[0].indexes).toEqual([1, 4])
  })

  it("fails closed when the embedding call throws", async () => {
    const embed = async () => { throw new Error("no network") }
    await expect(findMergePairs([role("j", ["a", "b"])], embed)).resolves.toEqual([])
  })

  it("fails closed when the provider returns the wrong number of vectors", async () => {
    const embed = async () => [at(0)]
    await expect(findMergePairs([role("j", ["a", "b"])], embed)).resolves.toEqual([])
  })

  it("asks for nothing when no role has two eligible lines", async () => {
    let called = false
    const embed = async () => { called = true; return [] }
    await findMergePairs([role("j", ["only one"])], embed)
    expect(called).toBe(false)
  })
})

const CROWDED = [
  "Gestioné la agenda médica de los profesionales del consultorio",
  "Confirmé los turnos por teléfono el día anterior a cada consulta",
  "Recibí a los pacientes en admisión y verifiqué sus datos",
  "Coordiné con las aseguradoras la autorización de las prestaciones",
]

describe("a proposal still answers to every filter this file already had", () => {
  const roles = [{ targetId: "j", jobTitle: "Recepcionista", bullets: CROWDED }]

  it("offers the proposed pair", () => {
    const got = findMergeCandidates(roles, 4, [{ targetId: "j", indexes: [0, 1], score: 0.6 }])
    expect(got).toHaveLength(1)
    expect(got[0].texts[0]).toContain("agenda médica")
  })

  it("refuses a pair whose line carries a figure — that line earned its slot", () => {
    const withFigure = [{ targetId: "j", jobTitle: "R", bullets: [
      "Gestioné la agenda médica de 120 pacientes por semana en el consultorio",
      ...CROWDED.slice(1),
    ] }]
    const got = findMergeCandidates(withFigure, 4, [{ targetId: "j", indexes: [0, 1], score: 0.9 }])
    expect(got).toHaveLength(0)
  })

  it("refuses a pair where one line adds nothing — that is a duplicate, not a merge", () => {
    const dup = [{ targetId: "j", jobTitle: "R", bullets: [
      "Gestioné la agenda médica de los profesionales del consultorio",
      "Gestioné la agenda médica de los profesionales",
      ...CROWDED.slice(2),
    ] }]
    const got = findMergeCandidates(dup, 4, [{ targetId: "j", indexes: [0, 1], score: 0.99 }])
    expect(got).toHaveLength(0)
  })

  it("refuses a role a recruiter would not call crowded", () => {
    const small = [{ targetId: "j", jobTitle: "R", bullets: CROWDED.slice(0, 2) }]
    const got = findMergeCandidates(small, 4, [{ targetId: "j", indexes: [0, 1], score: 0.9 }])
    expect(got).toHaveLength(0)
  })

  it("ignores a proposal pointing at a bullet that is not there", () => {
    const got = findMergeCandidates(roles, 4, [{ targetId: "j", indexes: [0, 99], score: 0.9 }])
    expect(got).toHaveLength(0)
  })

  /**
   * The panel recomputes on every keystroke with no network, so between analyses
   * there are no proposals. It must behave exactly as it did before rather than
   * going blank.
   */
  it("falls back to the deterministic pass when there are no proposals", () => {
    const twins = [{ targetId: "j", jobTitle: "R", bullets: [
      "Gestioné la agenda médica de los profesionales del consultorio",
      "Gestioné la agenda médica de los turnos y las consultas del día",
      ...CROWDED.slice(2),
    ] }]
    expect(findMergeCandidates(twins).length).toBeGreaterThan(0)
  })
})

describe("buildMergeRoleInput only pays to embed what could be offered", () => {
  it("skips roles under the crowding line", () => {
    const out = buildMergeRoleInput({ workExperience: [
      { id: "small", description: "• una línea larga que igual no alcanza el mínimo\n• otra línea larga de la misma longitud" },
    ] })
    expect(out).toEqual([])
  })

  it("drops lines with a figure and fragments, keeping their real index", () => {
    const out = buildMergeRoleInput({ workExperience: [{ id: "j", description: [
      "• Gestioné la agenda médica de los profesionales del consultorio",
      "• Atendí a 40 pacientes por día en la recepción del consultorio",
      "• Corto",
      "• Confirmé los turnos por teléfono el día anterior a cada consulta",
    ].join("\n") }] })
    expect(out).toHaveLength(1)
    expect(out[0].candidates.map((c) => c.index)).toEqual([0, 3])
  })

  it("skips a role left with fewer than two eligible lines", () => {
    const out = buildMergeRoleInput({ workExperience: [{ id: "j", description: [
      "• Gestioné la agenda médica de los profesionales del consultorio",
      "• Atendí a 40 pacientes por día en la recepción del consultorio",
      "• Cobré 30 consultas particulares durante el mes de diciembre",
      "• Emití 15 comprobantes por semana para las obras sociales",
    ].join("\n") }] })
    expect(out).toEqual([])
  })
})
