import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { Z_MODAL, Z_MODAL_FOLLOW_UP } from "@/lib/ui/z-layers"

/**
 * LO QUE PREGUNTA VA ENCIMA DE LO QUE PREGUNTÓ.
 *
 * ── EL DEFECTO (reportado con captura, 2026-08-21) ─────────────────────────
 *
 * «Al aplicar habilidades duras creo que se levanta otro modal detrás de este.»
 *
 * Apretar «Escribirlo en una viñeta» dentro del modal del ejecutor dispara
 * `weaveSkill`. Cuando el modelo no encuentra dónde va la habilidad, la app
 * pregunta a qué puesto pertenece (`JobPickerModal`) — y esa pregunta se abría
 * en `z-130` debajo del modal que la abrió, que estaba en `z-9999`.
 *
 * No era sólo feo: el fondo que cierra la pregunta también quedaba debajo, así
 * que no se podía contestar NI cancelar. La app esperaba una respuesta
 * invisible, con el uso de IA ya gastado.
 */
describe("un modal que nace dentro de otro se apila encima", () => {
  it("la pregunta de seguimiento está por encima del modal", () => {
    expect(Z_MODAL_FOLLOW_UP).toBeGreaterThan(Z_MODAL)
  })

  /**
   * EMPATAR TAMPOCO SIRVE. Los dos son portales a `body`: con el mismo z el
   * ganador lo decide el orden del DOM, que es una moneda al aire y cambia según
   * cuál se montó primero. Por eso la comprobación es «mayor», no «mayor o
   * igual» — y por eso el valor se deriva (`Z_MODAL + 1`) en vez de escribirse.
   */
  it("y no empata con él", () => {
    expect(Z_MODAL_FOLLOW_UP).not.toBe(Z_MODAL)
  })
})

/**
 * Comprueba una AUSENCIA: que ninguno de los dos vuelva a elegir su número por
 * su cuenta. De una clase que NO está no hay comportamiento que ejecutar, y el
 * defecto original fue exactamente eso — dos componentes eligiendo un `z-[...]`
 * a mano sin mirarse.
 */
/**
 * TODO LO QUE EL PANEL ABRE DESDE SU MODAL DECLARA SU CAPA.
 *
 * ── POR QUÉ ESTE BLOQUE EXISTE ─────────────────────────────────────────────
 *
 * El primer arreglo subió `JobPickerModal` y se dio el problema por cerrado. No
 * lo estaba: el CEO volvió con la misma captura, ahora con el diálogo que
 * muestra la VIÑETA NUEVA al agregar una habilidad. Ése usa el `Dialog`
 * compartido, que vive en `z-50` — muy por debajo del modal del ejecutor.
 *
 * Arreglar el que se ve y no barrer los hermanos es exactamente el parche que no
 * se quiere. Esto ENUMERA los que el panel monta y falla cuando aparezca otro.
 *
 * Es un test de AUSENCIA —una declaración que no está— y por eso lee el fuente;
 * queda registrado en `source-reading-guards`.
 */
describe("todo diálogo que el panel abre sobre su modal declara su capa", () => {
  const ABRE_DESDE_EL_MODAL: Record<string, string> = {
    "components/editor/SuggestionDiffModal.tsx": "confirma la viñeta nueva de una habilidad",
    "components/resume/sections/SummaryVersionModal.tsx": "elige entre las versiones del resumen",
    "components/editor/JobPickerModal.tsx": "pregunta a qué puesto pertenece la habilidad",
  }
  for (const [file, porque] of Object.entries(ABRE_DESDE_EL_MODAL)) {
    it(`${file.split("/").pop()} — ${porque}`, () => {
      const src = readFileSync(join(process.cwd(), file), "utf8")
      expect(src, `${file} no declara su capa: va a salir detrás del ejecutor`)
        .toContain("Z_MODAL_FOLLOW_UP")
    })
  }

  /**
   * Y el primitivo conserva la palanca. Sin `layer`, `DialogContent` monta su
   * propio fondo en `z-50` y no hay forma de subirlo desde afuera — que es
   * justamente por qué el defecto no se podía arreglar en el componente.
   */
  it("el Dialog compartido acepta una capa explícita", () => {
    const src = readFileSync(join(process.cwd(), "components/ui/dialog.tsx"), "utf8")
    expect(src, "DialogContent perdió la prop layer").toContain("layer?: number")
    expect(src, "el fondo del diálogo ignora la capa").toContain("<DialogOverlay style={layer")
  })
})

describe("ninguno de los dos elige su capa por su cuenta", () => {
  const files = {
    "components/editor/ats-report/TailorModal.tsx": "Z_MODAL",
    "components/editor/JobPickerModal.tsx": "Z_MODAL_FOLLOW_UP",
  }
  for (const [file, layer] of Object.entries(files)) {
    it(file.split("/").pop()!, () => {
      const src = readFileSync(join(process.cwd(), file), "utf8")
      const overlay = src.slice(0, src.indexOf("role=\"dialog\""))
      expect(overlay, `${file} vuelve a poner un z-[...] a mano`).not.toMatch(/className="[^"]*\bz-\[\d+\]/)
      expect(src, `${file} no usa la escala compartida`).toContain(layer)
    })
  }
})
