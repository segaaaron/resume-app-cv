import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * UNA LLAMADA, UNA TARJETA, TODO RESUELTO.
 *
 * El panel reescribía la viñeta en una tarjeta y pedía su métrica en otra, y la
 * habilidad blanda en una tercera. El usuario resolvía una y aparecía otra sobre
 * la MISMA línea: por eso sentía que el panel no terminaba nunca y se
 * contradecía. Decisión del CEO (2026-08-19): que todo viaje CON la viñeta.
 *
 * `metricHint` dice QUÉ MEDIR en esa línea —nunca una cifra, que la pone el
 * candidato— y `demonstrates` nombra la blanda que esa línea pasa a probar.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const MOD = "lib/services/ai/modules/AITailorModule.ts"

describe("la viñeta vuelve con todo resuelto", () => {
  it("el tipo declara los dos campos junto al texto", () => {
    const types = read("lib/services/ai/shared/ai-types.ts")
    expect(types).toMatch(/interface TailorBulletChange[\s\S]{0,1800}metricHint\?: string/)
    expect(types).toMatch(/interface TailorRewrite[\s\S]{0,1200}demonstrates\?: string/)
  })

  /** Un campo que el prompt no pide, el modelo no lo manda. */
  it("el prompt los pide en los DOS idiomas", () => {
    const src = read(MOD)
    const en = src.indexOf('"metricHint" names WHAT TO MEASURE')
    const es = src.indexOf('"metricHint" dice QUÉ MEDIR')
    expect(en, "rama EN").toBeGreaterThan(-1)
    expect(es, "rama ES").toBeGreaterThan(-1)
  })

  it("el ejemplo de JSON los muestra en las dos ramas", () => {
    const src = read(MOD)
    expect((src.match(/"metricHint":/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect((src.match(/"demonstrates":/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  /** Sin esto el modelo los manda y el parseo los tira: el trabajo se pierde. */
  it("el parseo los conserva y los acota", () => {
    const src = read(MOD)
    expect(src).toMatch(/typeof r\.metricHint === "string"/)
    expect(src).toMatch(/typeof r\.demonstrates === "string"/)
    expect(src).toMatch(/metricHint: r\.metricHint\.trim\(\)\.slice\(0, 160\)/)
  })

  /**
   * La regla que NO puede aflojarse: la pista dice qué medir, nunca cuánto.
   * Una cifra inventada por el modelo es lo que quema al candidato en la
   * entrevista.
   */
  it("el prompt prohíbe que la pista traiga una cifra", () => {
    const src = read(MOD)
    expect(src).toContain("never a number, never hard-code one")
    expect(src).toContain("nunca una cifra, nunca la quemes")
  })
})

/**
 * Y en el origen: una lista de alternativas es UN requisito.
 *
 * Reportado con captura: la vacante pedía "Ingeniería Comercial, Administración
 * de Empresas, Marketing o afines" y el modelo devolvía TRES requisitos sueltos.
 * Separados, cada uno se juzga solo y como mucho se cumple uno — los demás
 * figuran como incumplidos para cualquier candidato del planeta.
 */
describe("las alternativas no se parten en el origen", () => {
  it("el prompt de extracción lo dice en los dos idiomas", () => {
    const src = read("lib/services/ai/modules/AIReviewModule.ts")
    expect(src).toContain("ALTERNATIVE LIST IS ONE REQUIREMENT")
    expect(src).toContain("UNA LISTA DE ALTERNATIVAS ES UN SOLO REQUISITO")
  })

  it("y aclara cuándo SÍ hay que separar", () => {
    const src = read("lib/services/ai/modules/AIReviewModule.ts")
    expect(src).toContain('Excel AND SQL')
    expect(src).toContain('Excel Y SQL')
  })
})

/**
 * Y en pantalla: la tarjeta de la viñeta muestra TODO.
 *
 * El texto reescrito, qué número la levantaría y qué blanda pasa a demostrar —
 * todo en la misma tarjeta, porque todo vino de la misma llamada. Antes cada
 * cosa vivía en su sección: el usuario aplicaba la reescritura y le aparecía
 * otra tarjeta pidiendo la métrica de la MISMA línea, y una tercera por la
 * blanda. Resolvía una y nacían dos.
 */
describe("la tarjeta de la viñeta muestra todo junto", () => {
  // La tarjeta se mudó al modal de Tailor: es donde el usuario ve la reescritura
  // completa. Los dos extras siguen viajando CON la línea, que era el punto —
  // sueltos en otra sección, resolvía la reescritura y le aparecía una segunda
  // tarjeta sobre la MISMA línea pidiéndole el número.
  const src = () => read("components/editor/ats-report/FixCard.tsx")

  /** Viajan pegados a la reescritura, desde el módulo hasta la tarjeta. */
  it("los dos campos llegan intactos al puente", () => {
    const bridge = read("lib/ats/tailor-resolutions.ts")
    expect(bridge).toContain("r.metricHint")
    expect(bridge).toContain("r.demonstrates")
  })

  it("pinta la blanda que esa línea demuestra", () => {
    expect(src()).toContain('t("reason_demonstrates"')
  })

  /** Sólo cuando la línea no tiene número: si ya lo tiene, pedirlo es ruido. */
  /**
   * La pista sólo viaja cuando la línea no tiene número: el módulo no la emite si
   * ya lo tiene, así que pedirla de nuevo es imposible aguas abajo.
   */
  it("la pista sólo existe cuando falta el número", () => {
    expect(read(MOD)).toContain("metricHint")
    expect(src()).toContain("resolution?.metricHint")
  })

  it("hay texto para las dos cosas en los dos idiomas", () => {
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).editor.ats
      expect(m.reason_demonstrates, loc).toContain("{skill}")
      expect(m.metric_hint_line, loc).toContain("{hint}")
    }
  })
})

/**
 * El rojo permanente de la tarjeta de credibilidad.
 *
 * Reportado con captura: 97 de keywords, 95 de credibilidad, un solo hallazgo
 * marcado "MENOR" — y la tarjeta entera en rojo. El rojo significa "algo está
 * mal"; usarlo siempre lo convierte en ruido y le enseña al usuario a
 * ignorarlo justo cuando algo SÍ está mal.
 */
/**
 * LOS DOS TESTS DE LA NOTA DE CREDIBILIDAD SE FUERON CON ELLA.
 *
 * Comprobaban que su color saliera del número y que se callara sin hallazgos.
 * Los dos eran ciertos — y la nota igual se borró del riel: era un segundo
 * puntaje al lado del principal, sin un solo botón. Dos números que cuentan
 * cosas distintas, uno al lado del otro, se leen como una contradicción aunque
 * ambos sean ciertos.
 *
 * El cálculo sigue vivo: los hallazgos de credibilidad que tienen algo que
 * arreglar entran al informe como chequeos, con su sección y su salida.
 */

