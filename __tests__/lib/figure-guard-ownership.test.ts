import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * TODO LO QUE REESCRIBE UNA LÍNEA DEL CV PROTEGE LA CIFRA DEL CANDIDATO.
 *
 * ── POR QUÉ ESTE GUARD EXISTE ──────────────────────────────────────────────
 *
 * «No quiero nada de parches para estas soluciones, así que revisá bien»
 * (CEO, 2026-08-21).
 *
 * La regla «nunca borrar una cifra que el candidato escribió» se midió y se
 * aplicó el 2026-08-19 en tailor, review y el ATS. Barriendo los productores en
 * esta sesión apareció el cuarto: `improve-bullet` escribe la misma clase de
 * prosa, va al mismo campo del CV, y nunca la consultó.
 *
 * No se detectó antes porque NINGÚN otro guard lo ve, y está documentado en el
 * test de la propia regla: `hasHardCodedFact` caza cifras AÑADIDAS, no borradas;
 * `isTrivialEdit` e `isCosmeticReword` no aplican porque la redacción sí cambió;
 * `dropsContentWithoutGain` ve ganancia porque el texto creció.
 *
 * Una regla aplicada en tres de cuatro lugares no es una regla: es una
 * costumbre. Esto la vuelve obligatoria y falla cuando aparece el quinto.
 *
 * ── POR QUÉ LEE EL FUENTE ──────────────────────────────────────────────────
 *
 * El defecto es una AUSENCIA — una llamada que no está. De un guard que nadie
 * invoca no hay comportamiento que ejecutar: el módulo se comporta exactamente
 * como si la regla no existiera. Registrado en `source-reading-guards`.
 *
 * Lo que la regla HACE sí se ejecuta, en `figure-preservation.test.ts` y en
 * `trivial-fix-has-no-button.test.ts`. Esto sólo vigila que se la llame.
 */

/**
 * Los módulos que reescriben prosa que TERMINA DENTRO del CV del candidato.
 *
 * Fuera quedan, y cada uno con su razón:
 *   · `AIImportModule` / `AITranslateModule` — transcriben y traducen, no
 *     reescriben; su contrato de pérdida es `import-recovery.ts`.
 *   · `AISkillBulletModule` — escribe una línea NUEVA; no hay cifra previa que
 *     borrar.
 *   · `AICoverLetterModule` — no escribe en el CV, pero YA consulta la regla, y
 *     se deja anotado para que nadie la quite pensando que no aplica.
 */
const REESCRIBEN: Record<string, string> = {
  AITailorModule: "reescribe viñetas y el resumen contra la vacante",
  AIBulletModule: "reescribe una viñeta desde el editor",
  AIReviewModule: "propone el reemplazo que el botón del panel escribe",
  AIMergeBulletsModule: "funde dos viñetas en una",
  AICoverLetterModule: "conserva las cifras del CV dentro de la carta",
}

/**
 * La excepción DECLARADA, no un olvido.
 *
 * `AISummaryModule` no llama a `losesStatedFigure` porque tiene un mecanismo
 * propio y más fuerte: `summary-gate.ts` le pasa al modelo las cifras reales del
 * candidato, le exige que al menos una aparezca en CADA versión, y puntúa las
 * que no la traen. Exigirle además la llamada sería pedirle que compruebe dos
 * veces lo que ya garantiza antes de escribir.
 */
const CON_PUERTA_PROPIA: Record<string, string> = {
  AISummaryModule: "summary-gate.ts exige la cifra en cada versión, antes de escribir",
}

const src = (m: string) => readFileSync(join(process.cwd(), `lib/services/ai/modules/${m}.ts`), "utf8")

describe("ningún módulo que reescribe el CV se salta la regla de la cifra", () => {
  for (const [m, porque] of Object.entries(REESCRIBEN)) {
    it(`${m} — ${porque}`, () => {
      expect(src(m), `${m} no consulta losesStatedFigure`).toContain("losesStatedFigure")
    })
  }

  for (const [m, porque] of Object.entries(CON_PUERTA_PROPIA)) {
    it(`${m} tiene puerta propia — ${porque}`, () => {
      const gate = readFileSync(join(process.cwd(), "lib/services/ai/shared/summary-gate.ts"), "utf8")
      expect(gate, "la puerta propia dejó de exigir la cifra").toMatch(/MUST appear, as a figure, in EVERY version/)
    })
  }

  /**
   * Y LO MISMO CON LOS TÉRMINOS DE LA VACANTE — la regla que llegó última.
   *
   * ── POR QUÉ ESTÁ ACÁ Y NO EN SU PROPIO ARCHIVO ───────────────────────────
   *
   * Es exactamente el mismo defecto que la cifra, un canal más allá: una
   * reescritura que se lleva puesto algo que el candidato ya tenía. La cifra se
   * cerró en cuatro productores el 19/08; los términos quedaron sin guard hasta
   * que una medición de punta a punta mostró un CV volviendo de 23 a 16.
   *
   * Vigilarlos en el mismo lugar es lo que impide repetir la historia: cuando
   * aparezca el próximo canal que reescribe, este archivo va a fallar por las
   * DOS reglas a la vez, no por una y dentro de tres meses por la otra.
   *
   * Se exige donde el reemplazo se ESCRIBE en el CV. `AIMergeBulletsModule` no
   * entra: fusiona dos líneas y ya verifica, con `contentDroppedFrom`, que no se
   * pierda ninguna palabra de ninguna de las dos — que es más fuerte que mirar
   * sólo los términos de la oferta.
   */
  /**
   * ── LA REGLA, DEL CEO, TRES VECES (2026-08-22) ───────────────────────────
   *
   *   «El ATS manda. Todo lo que tenga el ATS debe consultar al ATS, y así con
   *    todos los componentes o IA que tengas. Todo se coordina con el ATS.»
   *
   * Auditados los ocho módulos, DOS reescribían texto del CV sin que el ATS
   * estuviera nunca en la sala: `improve-bullet` reemplaza una viñeta e
   * `improve-summary` reemplaza el resumen — y sus tipos de entrada no tenían
   * siquiera un campo para la vacante. Sus prompts pedían «incorporá keywords
   * del sector» y el modelo elegía cuáles mirando el título del puesto.
   *
   * El resumen cuenta igual que una viñeta: el matcher lee TODO el texto del CV,
   * así que una versión que se lleva puesto «Salesforce» baja el puntaje lo
   * mismo que una viñeta que lo pierde.
   */
  const CONTRA_LA_VACANTE: Record<string, string> = {
    AITailorModule: "escribe el reemplazo de una viñeta contra la vacante",
    AIReviewModule: "propone el reemplazo que el botón del panel escribe",
    AIBulletModule: "reescribe una viñeta desde el editor",
    AISummaryModule: "reescribe el resumen, que el matcher lee como cualquier viñeta",
  }
  for (const [m, porque] of Object.entries(CONTRA_LA_VACANTE)) {
    it(`${m} protege los términos de la vacante — ${porque}`, () => {
      expect(src(m), `${m} no consulta droppedPostingTerms`).toContain("droppedPostingTerms")
    })
  }

  /**
   * Y las ALTERNATIVAS pasan el mismo filtro que la principal.
   *
   * El usuario elige una con un clic, así que una variante que se salta un guard
   * es peor que no ofrecer opción: es la misma pérdida, entrando por la puerta
   * de al lado. El propio comentario del módulo lo promete —«Alternatives face
   * the SAME gauntlet»— y la cifra se le había escapado.
   */
  /**
   * Y NO ALCANZA CON DEFENDERSE: el prompt tiene que RECIBIR los términos.
   *
   * Un guard que descarta lo que pierde un término, sobre un modelo que nunca
   * supo cuáles eran, sólo produce reescrituras descartadas. Las dos mitades van
   * juntas — decirle cuáles son, y verificar que no los suelte.
   */
  it("los dos endpoints del editor reciben los términos, no los adivinan", () => {
    for (const m of ["AIBulletModule", "AISummaryModule"]) {
      expect(src(m), `${m} no recibe los términos de la vacante`).toContain("postingTerms")
    }
  })

  it("las alternativas de improve-bullet pasan el mismo filtro", () => {
    const code = src("AIBulletModule")
    const alts = code.slice(code.indexOf("const alternatives"), code.indexOf(".slice(0, 2)"))
    expect(alts, "una alternativa puede borrar la cifra").toContain("losesStatedFigure")
  })
})
