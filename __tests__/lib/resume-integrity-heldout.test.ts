import { describe, it, expect } from "vitest"
import { findNearDuplicateBullets, checkChronology, checkYearsClaim } from "@/lib/ats/resume-integrity"

/**
 * HELD-OUT. Not one line here comes from the résumé the checks were built against.
 *
 * The first version of the duplicate rule was a similarity threshold calibrated on
 * a single iOS CV — a number fitted to one document, which is exactly the mistake
 * a cross-lingual gate in this codebase already made and paid for: perfect on the
 * set that produced it, six false positives out of twenty-two on a fresh one.
 *
 * So the rules are structural now, and this file is the test that they are: nursing,
 * accounting, teaching, warehouse, sales, construction, hospitality — in both
 * languages, none of them written while looking at the implementation.
 */
const dup = (bullets: string[]) => findNearDuplicateBullets([{ id: "j", jobTitle: "role", bullets }])

describe("held-out: the same achievement written twice, across industries", () => {
  it.each([
    [
      "nursing — same opening, different tail",
      "Administered medication to up to 30 patients per shift, documenting each dose in the electronic record",
      "Administered medication to patients on the ward, coordinating with the attending physician on dosage changes",
    ],
    [
      "accounting — one line adds nothing",
      "Prepared monthly financial statements for management, reconciling bank accounts and supplier ledgers",
      "Prepared monthly financial statements for management",
    ],
    [
      "teaching — Spanish, same opening",
      "Diseñó el plan de clases de matemáticas para tres grados, adaptando el material a distintos ritmos de aprendizaje",
      "Diseñó el plan de clases de matemáticas para tres grados, incorporando evaluaciones semanales",
    ],
    [
      "warehouse — reworded, nothing new",
      "Gestionó el inventario del almacén y las devoluciones a proveedores, manteniendo el stock al día",
      "Gestionó el inventario del almacén y las devoluciones a proveedores",
    ],
    [
      "sales — same action and object",
      "Managed a portfolio of 40 accounts across the northern region, renewing contracts each quarter",
      "Managed a portfolio of 40 accounts across the northern region, upselling additional services",
    ],
  ])("%s", (_name, a, b) => {
    expect(dup([a, b])).toHaveLength(1)
  })
})

/**
 * The expensive direction. A false flag sends someone deleting real work, and the
 * pairs below are exactly the ones that LOOK alike: same verb, same field, same
 * sentence shape — and two different things done.
 */
describe("held-out: different achievements that merely look alike", () => {
  it.each([
    [
      "nursing — different clinical task",
      "Administered medication to up to 30 patients per shift, documenting each dose",
      "Recorded vital signs and escalated abnormal readings to the attending physician",
    ],
    [
      "accounting — different statement, different cycle",
      "Prepared monthly financial statements for management",
      "Filed quarterly tax returns for eight small businesses",
    ],
    [
      "construction — same verb, different trade",
      "Coordinó la instalación eléctrica de 15 viviendas según planos",
      "Coordinó la instalación sanitaria de 15 viviendas con dos cuadrillas",
    ],
    [
      "hospitality — same shape, different responsibility",
      "Trained twelve new servers on the point-of-sale system and table service standards",
      "Trained the kitchen team on allergen handling and food safety records",
    ],
    [
      "teaching — same subject, different work",
      "Diseñó el plan de clases de matemáticas para tres grados",
      "Evaluó a 120 estudiantes por trimestre y reportó avances a las familias",
    ],
    [
      "warehouse — related but distinct",
      "Gestionó el inventario del almacén y las devoluciones a proveedores",
      "Operó montacargas para carga y descarga de camiones",
    ],
    [
      "sales — different metric, different motion",
      "Managed a portfolio of 40 accounts across the northern region",
      "Generated 120 qualified leads per quarter through cold outreach",
    ],
  ])("%s", (_name, a, b) => {
    expect(dup([a, b])).toHaveLength(0)
  })
})

describe("held-out: chronology and the years claim outside tech", () => {
  it("catches a nurse's CV listed oldest-first", () => {
    expect(
      checkChronology([
        { id: "1", jobTitle: "Auxiliar de enfermería", startDate: "2012", endDate: "2015" },
        { id: "2", jobTitle: "Enfermera", startDate: "2016", endDate: "2020" },
        { id: "3", jobTitle: "Enfermera jefe", startDate: "2021", currentlyWorking: true },
      ])?.mostRecent,
    ).toBe("Enfermera jefe")
  })

  it("catches an accountant claiming more years than the dates show", () => {
    expect(
      checkYearsClaim("Contadora con 15 años de experiencia en cierres mensuales", [
        { id: "1", jobTitle: "Asistente contable", startDate: "2018", endDate: "2021" },
        { id: "2", jobTitle: "Contadora", startDate: "2021", currentlyWorking: true },
      ], 2026),
    ).toEqual({ claimed: 15, actual: 8 })
  })

  it("leaves an honest claim alone", () => {
    expect(
      checkYearsClaim("Contadora con 8 años de experiencia", [
        { id: "1", jobTitle: "Asistente contable", startDate: "2018", endDate: "2021" },
        { id: "2", jobTitle: "Contadora", startDate: "2021", currentlyWorking: true },
      ], 2026),
    ).toBeNull()
  })
})
