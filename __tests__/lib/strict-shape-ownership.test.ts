import { describe, it, expect } from "vitest"
import { ATSExtractionSchema, ATSExtractionShape } from "@/lib/services/ai/shared/ai-types"
import { strictJsonFormat } from "@/lib/services/ai/shared/strict-schema"

/**
 * LA FORMA TIENE UN SOLO DUEÑO, AUNQUE SE ESCRIBA DOS VECES.
 *
 * `ATSExtractionShape` declara lo que se le EXIGE al modelo (F0.5, modo
 * estricto); `ATSExtractionSchema` declara lo que aceptamos PARSEAR, con sus
 * `.catch()` que reparan. No pueden ser el mismo objeto —un `.catch()` es un
 * transform y no se puede expresar en JSON Schema— pero sí tienen que describir
 * la misma forma: si alguien agrega un campo a uno y se olvida del otro, el
 * modelo devuelve algo que nadie lee, o se le exige algo que nadie usa.
 */
describe("la forma exigida y la forma parseada no pueden divergir", () => {
  it("declaran exactamente los mismos campos", () => {
    const exigida = Object.keys(ATSExtractionShape.shape).sort()
    const parseada = Object.keys(ATSExtractionSchema.shape).sort()
    expect(exigida, "un campo existe en una y no en la otra").toEqual(parseada)
  })

  /**
   * Y el modo estricto tiene tres reglas que la API no negocia: todo campo
   * obligatorio, ningún campo extra, y un objeto en la raíz. Si el conversor
   * dejara de aplicarlas, la llamada se caería con un 400 a mitad de un análisis
   * — mejor que se caiga acá.
   */
  it("el formato cumple las reglas del modo estricto", () => {
    const f = strictJsonFormat("ats_extraction", ATSExtractionShape)
    const schema = f.json_schema.schema as {
      type: string
      required: string[]
      additionalProperties: boolean
      properties: Record<string, unknown>
    }
    expect(f.json_schema.strict).toBe(true)
    expect(schema.type, "la raíz tiene que ser un objeto").toBe("object")
    expect(schema.additionalProperties, "el modo estricto no admite campos extra").toBe(false)
    expect(schema.required.sort(), "en modo estricto TODOS los campos son obligatorios")
      .toEqual(Object.keys(schema.properties).sort())
  })
})
