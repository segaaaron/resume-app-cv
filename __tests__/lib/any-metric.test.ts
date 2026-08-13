import { describe, it, expect } from "vitest"
import { hasAnyMetric } from "@/lib/services/ai/shared/ai-helpers"

describe("hasAnyMetric", () => {
  // Reported: this exact line was labelled "no metric" because "weeks" was not
  // on the unit list. Telling someone their own before-and-after is not a number
  // is what makes a panel untrustworthy.
  it("sees a before-and-after in units nobody remembered to list", () => {
    expect(hasAnyMetric("Cut release cycle time from 4 weeks to 2 weeks on a consumer app")).toBe(true)
    expect(hasAnyMetric("Reduje el tiempo de espera de 40 a 15 minutos en recepción")).toBe(true)
  })

  it("works outside tech, where the units are different entirely", () => {
    for (const line of [
      "Atendí a 30 pacientes por turno en el área de emergencias",
      "Supervisé a 12 estudiantes durante el taller de lectura",
      "Recovered $4,200 in mispriced inventory during an audit",
      "Instalé 45 luminarias en el edificio central",
      "Serví 120 cubiertos por noche en temporada alta",
    ]) {
      expect(hasAnyMetric(line)).toBe(true)
    }
  })

  it("still says no when there is nothing to count", () => {
    for (const line of [
      "Managed third-party dependencies and maintained compatibility with CocoaPods",
      "Developed modular and reusable components to accelerate delivery",
      "Responsable de la atención al cliente en el local",
    ]) {
      expect(hasAnyMetric(line)).toBe(false)
    }
  })
})
