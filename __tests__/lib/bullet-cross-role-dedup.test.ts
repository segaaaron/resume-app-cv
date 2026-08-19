import { describe, it, expect } from "vitest"
import { addsNothingNew, findNearDuplicateBullets } from "@/lib/ats/resume-integrity"

/**
 * Two roles, one résumé, the same lines.
 *
 * Reported from a real CV: two "Desarrollador Web" jobs came back from the
 * assistant both talking about REST APIs, Git and responsive layout. A recruiter
 * reads the same document twice, and the credibility engine docks points for
 * duplicates — so the product was generating what it then penalised.
 *
 * The wizard now filters suggestions against every bullet already on the CV,
 * using the integrity checker's own predicate rather than a threshold invented
 * for the occasion. These tests pin that predicate down, because the filter is
 * only as good as what it calls a duplicate.
 */
describe("bullets repeated across roles", () => {
  const REST_A = "Diseñé y consumí REST APIs para integrar funcionalidades y datos desde servicios externos"
  const REST_B = "Integré y consumí datos desde servicios mediante REST APIs para soportar funcionalidades del sistema"
  const GIT_A = "Organicé el trabajo y el seguimiento de cambios con Git, facilitando revisiones y despliegues"
  const GIT_B = "Organicé el trabajo y el seguimiento de cambios con Git para facilitar revisiones y despliegues"

  it("catches the near-copy", () => {
    expect(addsNothingNew(GIT_A, GIT_B)).toBe(true)
  })

  /**
   * And here is the honest limit, measured rather than assumed: the same work
   * REWORDED slips past. "Diseñé y consumí REST APIs para integrar
   * funcionalidades" and "Integré y consumí datos mediante REST APIs para
   * soportar funcionalidades" are the same line to a reader and different lines
   * to a word-overlap ratio.
   *
   * So the arrival filter is the SAFETY NET, not the guarantee. The first line
   * of defence is the prompt: every suggestion request now carries the bullets
   * the other roles already hold, under "do NOT repeat this". Closing this gap
   * deterministically would need the semantic matcher, which costs an embedding
   * call per option — worth doing only if reworded duplicates keep landing.
   */
  it("does not catch the same work reworded — the prompt is what prevents that", () => {
    expect(addsNothingNew(REST_A, REST_B)).toBe(false)
  })

  it("leaves genuinely different work alone", () => {
    const other = "Migré la base de datos a PostgreSQL sin interrumpir el servicio"
    expect(addsNothingNew(GIT_A, other)).toBe(false)
    expect(addsNothingNew(REST_A, other)).toBe(false)
  })

  /**
   * The gap the report exposed on the detection side, kept visible rather than
   * quietly assumed fixed: the integrity check compares bullets WITHIN a role
   * and never across roles, so the duplicate pair below goes unreported. The
   * wizard no longer creates it; a CV that already carries one — or one written
   * by hand — is still not flagged.
   */
  it("documents that the analyser still does not look across roles", () => {
    const found = findNearDuplicateBullets([
      { id: "w1", jobTitle: "Desarrollador Web", bullets: [GIT_A] },
      { id: "w2", jobTitle: "Desarrollador Web", bullets: [GIT_B] },
    ])
    expect(found).toEqual([])

    // Same two lines inside one role ARE caught, which is what the check covers.
    const sameRole = findNearDuplicateBullets([
      { id: "w1", jobTitle: "Desarrollador Web", bullets: [GIT_A, GIT_B] },
    ])
    expect(sameRole.length).toBeGreaterThan(0)
  })
})
