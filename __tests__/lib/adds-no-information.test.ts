import { describe, it, expect } from "vitest"
import { addsNoInformation, isTrivialEdit, isCosmeticReword } from "@/lib/services/ai/shared/text-similarity"

/**
 * The two shapes that reached the user labelled as improvements.
 *
 * The bullet endpoint no longer refuses to call the model on a line that has no
 * formal defect — four deterministic rules were deciding whether a professional
 * writer could sharpen someone's sentence, and measured on four ordinary
 * bullets, three never reached the AI at all.
 *
 * That moves the burden here. A model asked to improve a good line will always
 * answer something, and what it answers when there is nothing to fix is a
 * reorder or a padded clause. Measured against the existing filters before this
 * one was written:
 *
 *   reorder  isTrivialEdit=false  isCosmeticReword=false  → shown to the user
 *   padding  isTrivialEdit=false  isCosmeticReword=false  → shown to the user
 *
 * So the model may always speak, and this is what stops it selling silence.
 */
const ORIGINAL = "Led the migration to SwiftUI across 4 apps, cutting crash rate 30%."

describe("a rewrite that says nothing new", () => {
  it("catches a reorder the older filters let through", () => {
    const reorder = "Led the SwiftUI migration across 4 apps, cutting crash rate 30%."
    expect(isTrivialEdit(ORIGINAL, reorder)).toBe(false)     // the gap
    expect(isCosmeticReword(ORIGINAL, reorder)).toBe(false)  // the gap
    expect(addsNoInformation(ORIGINAL, reorder)).toBe(true)  // closed
  })

  it("catches an empty clause bolted on the end", () => {
    const padded = "Led the migration to SwiftUI across 4 apps, cutting crash rate 30% to improve quality."
    expect(isTrivialEdit(ORIGINAL, padded)).toBe(false)
    expect(addsNoInformation(ORIGINAL, padded)).toBe(true)
  })

  it("catches Spanish padding, which is where it was actually seen", () => {
    // Measured live: the model answered this to "Realicé mantenimiento
    // preventivo de equipos" — the same sentence with a purpose invented for it.
    const o = "Realicé mantenimiento preventivo de equipos"
    expect(addsNoInformation(o, "Realicé mantenimiento preventivo de equipos para mantener su funcionamiento")).toBe(true)
    expect(addsNoInformation(o, "Realicé mantenimiento preventivo de equipos asegurando la calidad del proceso")).toBe(true)
  })

  /**
   * The other half of the bar, and the more important one: a guard that ate real
   * improvements would be worse than no guard. "Said little" is not "said
   * nothing" — a single new content word is an addition.
   */
  it("leaves a genuine addition alone", () => {
    const o = "Coordiné la agenda del gerente"
    expect(addsNoInformation(o, "Coordiné la agenda y las reuniones del gerente")).toBe(false)
    expect(addsNoInformation(o, "Coordiné la agenda del gerente en Outlook")).toBe(false)
  })

  it("leaves a real rewrite alone", () => {
    expect(addsNoInformation(
      "Responsable de atender a los clientes en caja",
      "Atendí a los clientes en caja y resolví sus reclamos",
    )).toBe(false)
  })

  it("leaves a rewrite that swaps a weak verb alone", () => {
    // Words leave AND arrive: a substitution, which the cosmetic check judges —
    // this one must not pre-empt it.
    expect(addsNoInformation(
      "Ayudé con el mantenimiento de las máquinas",
      "Ejecuté el mantenimiento preventivo de las máquinas",
    )).toBe(false)
  })

  it("treats an empty suggestion as nothing, not as an improvement", () => {
    expect(addsNoInformation(ORIGINAL, "   ")).toBe(true)
  })
})
