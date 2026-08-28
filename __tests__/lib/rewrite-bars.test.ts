import { describe, it, expect } from "vitest"
import { isRedundantRewrite } from "@/lib/services/ai/shared/text-similarity"
import { bulletFloorMisses, MIN_BULLET_WORDS } from "@/lib/ats/output-floor"

/**
 * LAS DOS VARAS QUE DECIDEN SI UNA SUGERENCIA LLEGA AL USUARIO.
 *
 * ── POR QUÉ ESTE ARCHIVO EXISTE (auditoría, 2026-08-28) ────────────────────
 *
 * `isRedundantRewrite` («¿aporta algo?») y `bulletFloorMisses` («¿es lo bastante
 * buena para entregarla?») son los dos dueños compuestos del motor de escritura,
 * y no tenían UN solo archivo de test propio. Las partes que componen sí: seis
 * archivos ejercitan `hardCodedFactKind`, cinco `dropsContentWithoutGain`. Los
 * dueños, ninguno.
 *
 * No es teórico: el 2026-08-28 se cambió la regla del piso y los 3.741 casos de
 * la suite quedaron en verde. Nada la ataba. Ésa es la vía por la que una vara y
 * su proxy llegan a discrepar sin que nadie se entere.
 *
 * EJECUTA LAS FUNCIONES; no lee el código fuente ni cita un número suelto — el
 * mínimo se importa de su dueño, así que moverlo no rompe este archivo por el
 * motivo equivocado.
 */

describe("¿aporta algo? — el dueño de la pregunta", () => {
  const ORIG = "Subí la recompra del cliente coordinando el seguimiento posventa"

  it("rechaza el cambio de UNA palabra que se leía como mejora", () => {
    // El churn medido del 8%: «Subí…» → «Incrementé…», una palabra de diecinueve.
    expect(isRedundantRewrite(ORIG, ORIG.replace("Subí", "Incrementé"))).toBe(true)
  })

  it("rechaza la línea idéntica", () => {
    expect(isRedundantRewrite(ORIG, ORIG)).toBe(true)
  })

  it("rechaza las mismas palabras reordenadas", () => {
    // El hueco medido: tailor corría dos de los tres chequeos y un reordenado
    // entraba al CV por el ejecutor cuando el editor sí lo frenaba.
    expect(isRedundantRewrite(ORIG, "Coordinando el seguimiento posventa subí la recompra del cliente")).toBe(true)
  })

  it("DEJA PASAR la que nombra una herramienta que la original no decía", () => {
    // La vara declarada es «no dijo NADA», no «dijo poco»: una sola palabra de
    // contenido nueva ya es un aporte. Ensancharla es la vara de «palabras
    // nuevas» que se midió y rechaza el enriquecimiento que el producto cobra.
    expect(isRedundantRewrite(ORIG, `${ORIG} por teléfono y correo`)).toBe(false)
  })

  /**
   * EL RELLENO COLGADO NO MUERE ACÁ, Y ES CORRECTO. Queda escrito porque parece
   * un hueco y no lo es: «de manera exitosa y eficiente» agrega palabras de
   * contenido, así que para esta vara aportó algo. Lo frena el PISO, que no
   * pregunta si dijo algo nuevo sino si la línea quedó mejor — y no quedó.
   * Medido: `isRedundantRewrite` false · `bulletFloorMisses` ["no_gain"].
   */
  it("y el relleno colgado lo frena el piso, no esta vara", () => {
    const conRelleno = `${ORIG} de manera exitosa y eficiente`
    expect(isRedundantRewrite(ORIG, conRelleno)).toBe(false)
    expect(bulletFloorMisses(conRelleno, { original: ORIG })).toContain("no_gain")
  })

  it("con un defecto diagnosticado no descarta por cosmética: ese cambio ES el arreglo", () => {
    // «Responsible for…» → verbo de acción cambia poco texto y es exactamente lo
    // que el panel pidió. Sin `diagnosed` el guard se comería su propio arreglo.
    const conDefecto = "Responsible for the daily cash count and the receipt reconciliation"
    const arreglada = "Ran the daily cash count and the receipt reconciliation"
    expect(isRedundantRewrite(conDefecto, arreglada, { diagnosed: true })).toBe(false)
  })
})

describe("¿es lo bastante buena para entregarla? — el piso de salida", () => {
  it("marca la línea que abre nombrando una tarea", () => {
    expect(bulletFloorMisses("Responsible for the cash register and the daily reconciliation of receipts"))
      .toContain("duty_opener")
  })

  it("marca la línea que afirma una cualidad en vez de decir el trabajo", () => {
    expect(bulletFloorMisses("Hard-working team player with excellent communication skills"))
      .toContain("empty_phrasing")
  })

  it("marca la que no gana nada frente a su original", () => {
    const o = "Concilié los comprobantes de caja con el sistema contable cada mañana"
    expect(bulletFloorMisses(o, { original: o })).toContain("no_gain")
  })

  it("exige el mínimo de palabras cuando la línea nace de cero", () => {
    const corta = "Atendí a los clientes"
    expect(corta.trim().split(/\s+/).length).toBeLessThan(MIN_BULLET_WORDS)
    expect(bulletFloorMisses(corta)).toContain("too_short")
  })

  it("y lo sigue exigiendo cuando el original era flojo", () => {
    expect(bulletFloorMisses("Handled the register", { original: "Responsible for cash" }))
      .toContain("too_short")
  })

  /**
   * El caso que abrió la puerta a la invención: el panel considera sana una línea
   * de nueve palabras —verbo, cifra, concreción— y la manda igual por la tarjeta
   * de la cifra. Exigirle largo obliga al modelo a estirarla, y de ahí salen los
   * complementos que el candidato nunca nombró.
   */
  it("NO exige largo sobre una línea que el propio panel considera sana", () => {
    const sana = "Led the weekly count for a team of 11"
    const conCifra = "Led the weekly count for a team of 11 across 3 shifts"
    expect(bulletFloorMisses(conCifra, { original: sana })).not.toContain("too_short")
  })
})
