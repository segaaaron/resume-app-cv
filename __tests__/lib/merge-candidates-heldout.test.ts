import { describe, it, expect } from "vitest"
import { findMergeCandidates } from "@/lib/ats/merge-candidates"

/**
 * HELD-OUT. No line here is from the résumé this feature was built against.
 *
 * The first version of merge-candidates carried four constants chosen by looking
 * at one iOS CV, and every one of its tests was iOS too — so it was never checked
 * against the thing it claims to do: work for any résumé. Nursing, accounting,
 * teaching, warehouse, hospitality, construction, sales, in both languages.
 */
const role = (bullets: string[]) => [{ targetId: "j", jobTitle: "role", bullets }]
/** A crowded role: merging is only ever offered on one. */
const pad = ["Attended the weekly team meeting without fail", "Kept the shared drive tidy and named consistently"]

describe("held-out: two thin lines about one piece of work", () => {
  it.each([
    [
      "nursing",
      "Recorded vital signs for patients on the morning ward round",
      "Recorded vital signs and flagged abnormal readings to the nurse in charge",
    ],
    [
      "accounting",
      "Reconciled bank statements against the supplier ledger each month",
      "Reconciled bank statements and chased differences with the bank",
    ],
    [
      "teaching — Spanish",
      "Preparó material de apoyo para las clases de historia",
      "Preparó material de apoyo y guías de estudio para los exámenes",
    ],
    [
      "hospitality",
      "Served tables in the main dining room during dinner service",
      "Served tables and handled guest complaints during dinner service",
    ],
  ])("%s", (_n, a, b) => {
    expect(findMergeCandidates(role([a, b, ...pad]))).toHaveLength(1)
  })
})

/**
 * The expensive direction. Fusing two unrelated lines produces a worse bullet than
 * the two it replaced, and the user cannot undo the loss of the original wording.
 */
describe("held-out: lines that must never be fused", () => {
  it.each([
    [
      "nursing — different clinical tasks",
      "Recorded vital signs for patients on the morning ward round",
      "Trained two new auxiliaries on the discharge paperwork",
    ],
    [
      "construction — different trades",
      "Coordinó la instalación eléctrica de las viviendas según planos",
      "Supervisó el vaciado de las losas con dos cuadrillas",
    ],
    [
      "sales — different motions",
      "Managed a portfolio of accounts across the northern region",
      "Prepared the quarterly forecast for the sales director",
    ],
    [
      "warehouse — different responsibilities",
      "Operó montacargas para la carga y descarga de camiones",
      "Atendió consultas de clientes en el mostrador de retiros",
    ],
  ])("%s", (_n, a, b) => {
    expect(findMergeCandidates(role([a, b, ...pad]))).toHaveLength(0)
  })

  it("never offers a line that already carries a figure — it earned its slot", () => {
    expect(
      findMergeCandidates(
        role([
          "Recorded vital signs for 30 patients per shift on the morning round",
          "Recorded vital signs and flagged abnormal readings to the nurse in charge",
          ...pad,
        ]),
      ),
    ).toHaveLength(0)
  })

  // Same subject where one line adds nothing is a DUPLICATE — deleting one, not
  // paying a model call to fuse them.
  it("hands a duplicate to the duplicate flow instead of merging it", () => {
    expect(
      findMergeCandidates(
        role([
          "Reconciled bank statements against the supplier ledger each month",
          "Reconciled bank statements against the supplier ledger",
          ...pad,
        ]),
      ),
    ).toHaveLength(0)
  })

  it("leaves a role a recruiter can already read", () => {
    expect(
      findMergeCandidates(
        role([
          "Recorded vital signs for patients on the morning ward round",
          "Recorded vital signs and flagged abnormal readings to the nurse in charge",
        ]),
      ),
    ).toHaveLength(0)
  })

  it("never pairs across two roles — that would rewrite the candidate's history", () => {
    const line = "Reconciled bank statements against the supplier ledger each month"
    expect(
      findMergeCandidates([
        { targetId: "a", jobTitle: "A", bullets: [line, ...pad, "x".repeat(40)] },
        { targetId: "b", jobTitle: "B", bullets: [line + " and chased differences", ...pad, "y".repeat(40)] },
      ]).filter((c) => c.texts.some((t) => t.includes("Reconciled"))),
    ).toHaveLength(0)
  })
})
