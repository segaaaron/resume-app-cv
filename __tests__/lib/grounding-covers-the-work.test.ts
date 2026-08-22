import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { hasHardCodedFact, hardCodedFactKind } from "@/lib/services/ai/shared/ai-helpers"

/**
 * EL MODELO TIENE QUE VER LA LÍNEA QUE LE PEDIMOS REESCRIBIR.
 *
 * ── EL DEFECTO, MEDIDO ─────────────────────────────────────────────────────
 *
 * El prompt del ejecutor armaba su `groundingSource` con `work.slice(0, 4)` —
 * los primeros cuatro puestos— mientras la lista de tareas salía del informe,
 * que cubre TODOS. En cualquier CV de más de cuatro puestos:
 *
 *   · se le pedía reescribir una viñeta del quinto puesto
 *   · el modelo la reescribía bien, conservando la cifra del candidato
 *   · el guard la comparaba contra un grounding que no contenía ese puesto
 *   · la marcaba «figure» y la descartaba
 *
 * La cifra era del candidato. El guard no tenía cómo saberlo, y el usuario veía
 * una sugerencia menos habiendo gastado el uso.
 *
 * El comentario del propio código ya advertía el riesgo —«sin las viñetas acá,
 * toda reescritura fiel se leería como contenido quemado y el guard la tiraría»—
 * y el recorte estaba tres líneas más arriba.
 */
describe("una cifra del CV no puede leerse como quemada", () => {
  const PUESTOS = [
    "ID:j1 | Ejecutivo at Banco X:\n• Gestioné cartera corporativa.",
    "ID:j2 | Vendedor at Retail Y:\n• Atendí clientes en piso.",
    "ID:j3 | Cajero at Banco Z:\n• Realicé arqueo diario.",
    "ID:j4 | Asistente at Oficina W:\n• Ordené archivos.",
    "ID:j5 | Supervisor at Farmacia Q:\n• Controlé el inventario de 400 SKU y reduje los quiebres un 30%.",
  ]
  const REWRITE = "Controlé el inventario de 400 SKU aplicando conteos cíclicos y reduje los quiebres un 30%."

  it("con el puesto en el grounding, la reescritura pasa", () => {
    const completo = PUESTOS.join("\n\n")
    expect(hasHardCodedFact(REWRITE, completo)).toBe(false)
  })

  /** La demostración de por qué el recorte importaba. */
  it("sin ese puesto, la MISMA reescritura se descarta como cifra quemada", () => {
    const recortado = PUESTOS.slice(0, 4).join("\n\n")
    expect(hardCodedFactKind(REWRITE, recortado)).toBe("figure")
  })
})

describe("el prompt del ejecutor ya no recorta a ciegas", () => {
  /**
   * Comprueba una AUSENCIA: el recorte fijo no puede volver. De un `slice` que
   * no existe no hay comportamiento que ejecutar, y montar el módulo entero con
   * su cliente y su cuota para leer un prompt sería más frágil.
   */
  // Sin comentarios: el que documenta este arreglo CITA el recorte viejo, y
  // contarlo sería contar la propia explicación del cambio.
  const src = readFileSync(join(process.cwd(), "lib/services/ai/modules/AITailorModule.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")

  it("no vuelve el slice fijo de cuatro puestos", () => {
    expect(src).not.toContain("work.slice(0, 4)")
  })

  it("y el grounding se arma desde los puestos con trabajo asignado", () => {
    expect(src).toContain("conTrabajo")
    expect(src).toMatch(/relevantes/)
  })
})
