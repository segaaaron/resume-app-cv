import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

/**
 * NINGÚN CAMINO ESCRIBE EN EL CV SIN QUE EL USUARIO LO VEA Y LO ACEPTE.
 *
 * ── LO PEDIDO (CEO, 2026-09-09) ──────────────────────────────────────────────
 *
 *   «Si se usa una viñeta debería salir ese UI. Te dije que siempre le muestres
 *    al usuario y él acepta.»
 *
 * Se lee el CÓDIGO en vez de mantener una lista a mano: se enumeran las
 * escrituras al CV y se comprueba que cada una nazca de un acto que el usuario
 * confirmó. El día que alguien agregue una escritura nueva y se olvide de
 * pedirle permiso, esto se pone rojo antes de que llegue a un CV ajeno.
 */
describe("nada se escribe en el CV sin confirmación", () => {
  const hook = readFileSync("components/editor/ats3/useAts3.ts", "utf8")
  const panel = readFileSync("components/editor/ats3/TailorPanel.tsx", "utf8")

  it("las escrituras al CV son las cinco conocidas, y ninguna más", () => {
    // `updateSectionData` es la ÚNICA puerta al CV del usuario.
    const escrituras = [...hook.matchAll(/updateSectionData\(/g)].length
    expect(escrituras).toBe(5)
  })

  it("la reescritura pasa por el modal, que dice DÓNDE cae", () => {
    /**
     * `SuggestionDiffModal` es el componente que el CEO pidió recuperar, y es UNO
     * SOLO para mejorar y para crear. Recibe el puesto y la línea: sin eso, el
     * antes/después obliga a confiar.
     */
    expect(panel).toContain("onAccept={(text) => {")
    expect(panel).toContain("<SuggestionDiffModal")
    expect(panel).toContain("jobTitle: donde.puesto")
    /* Y una viñeta NUEVA va SIN número de línea: `donde` es el ancla del pedido,
       no el lugar donde va a quedar. Numerarla señalaba una línea que el cambio
       no toca. */
    expect(panel).toContain("line: esNueva ? undefined : donde.linea")
  })

  it("sacar una línea pide confirmación mostrando la línea que se va", () => {
    expect(panel).toContain('t("confirm_drop")')
    expect(panel).toContain("strike={confirmando?.bulletId === d.bulletId}")
  })

  it("no se confirma con una petición del modelo en vuelo", () => {
    /**
     * El asistente puede pedir otras versiones de la viñeta mientras la ventana
     * está abierta. Sin apagar el botón, confirmar en ese hueco escribe la
     * línea, limpia el estado, y la respuesta que llega después lo resucita: se
     * reabre y una segunda confirmación escribe la MISMA viñeta dos veces.
     */
    const asistente = readFileSync("components/editor/AIProfileInterview.tsx", "utf8")
    expect(asistente).toContain("blocked={anglesBusy}")
    /* Y la consulta se contabiliza apenas el servidor contesta, traiga ángulos
       o no: si no, el caso más probable —el modelo no ofrece otro ángulo— deja
       la insignia de cuota con el número viejo. */
    const pedido = asistente.slice(asistente.indexOf("async function bulletAngles"))
    expect(pedido.indexOf("await onSuccess()")).toBeLessThan(pedido.indexOf("alts.length === 0"))
  })

  it("las habilidades se enseñan antes de escribirlas", () => {
    expect(panel).toContain("skills_plan_in")
    expect(panel).toContain("a.applySkills(plan.final)")
  })
})
