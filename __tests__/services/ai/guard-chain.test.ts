import { describe, it, expect } from "vitest"
import { vi } from "vitest"
vi.mock("@/lib/db", () => ({ db: {} }))
import { hardCodedFactKind, losesStatedFigure } from "@/lib/services/ai/shared/ai-helpers"
import { isTrivialEdit, isCosmeticReword, addsNoInformation, dropsContentWithoutGain } from "@/lib/services/ai/shared/text-similarity"
import { droppedPostingTerms } from "@/lib/ats/rewrite-keeps-match"

/**
 * LA CADENA DE GUARDS, CORRIDA ENTERA: ¿deja pasar lo bueno y mata lo malo?
 *
 * ── POR QUÉ ESTE TEST EXISTE (CEO, 2026-08-22) ─────────────────────────────
 *
 *   «Revisá si las doctrinas y los guards ya no se contradicen, y si ahora deja
 *    pasar información de alto impacto para el usuario.»
 *
 * Cada guard tiene sus propios tests unitarios. Ninguno contestaba la pregunta
 * que importa, que es sobre la CADENA: siete filtros en fila, cada uno correcto
 * por su cuenta, pueden dejar al usuario sin nada. Acá se corren en el mismo
 * orden que `AIBulletModule` los corre, sobre reescrituras realistas de los dos
 * tipos, y se cuenta cuántas sobreviven de cada lado.
 *
 * Las líneas de `VALIOSAS` son el trabajo que el usuario paga: nombran el
 * contenido del oficio, conservan todo lo que él dijo y agregan el vocabulario
 * que un aviso busca. Si una de ésas muere, el producto no sirve — no importa
 * cuán bien esté escrito cada guard por separado.
 */

/** La cadena de improve-bullet, en el MISMO orden en que el módulo la corre. */
function survivesBulletChain(original: string, suggested: string, source: string, terms: string[]) {
  const kind = hardCodedFactKind(suggested, source)
  if (kind === "placeholder" || kind === "brand") return "hardCoded"
  // DISEÑO CORREGIDO (CEO): la cifra no se descarta — llega marcada para que el
  // usuario la confirme. Placeholder y marca sí mueren (arriba).
  if (kind === "figure") return "figureConfirm"
  if (isTrivialEdit(original, suggested)) return "trivial"
  if (isCosmeticReword(original, suggested)) return "cosmetic"
  if (addsNoInformation(original, suggested)) return "noInfo"
  if (dropsContentWithoutGain(original, suggested)) return "dropsContent"
  if (losesStatedFigure(original, suggested)) return "figureLoss"
  if (droppedPostingTerms(original, suggested, terms).length > 0) return "termLoss"
  return "KEPT"
}
const TERMS = ["Swift", "SwiftUI", "GraphQL", "RESTful APIs"]
const SOURCE_SIN = "iOS Developer. Swift, SwiftUI, GraphQL, RESTful APIs, Core Data, unit testing."
// El mismo CV, pero con la sección propia «AREAS OF EXPERTISE» VISIBLE.
const SOURCE_CON = SOURCE_SIN + "\nAREAS OF EXPERTISE: Cocoa Touch · VIPER · XCTest · TypeScript · Dart"
const SOURCE = SOURCE_CON

/** Reescrituras que SÍ aportan: nombran el contenido del oficio, conservan todo. */
const VALIOSAS: Array<[string, string]> = [
  ["• Responsable de las APIs",
   "• Integré APIs RESTful para los flujos de onboarding y pagos con Swift networking, agregando modelos de request/response y manejo de errores"],
  ["• Trabajé en la app",
   "• Desarrollé pantallas en SwiftUI para el flujo de pagos, resolviendo estados de carga y errores de red visibles para el usuario"],
  ["• Hice pruebas",
   "• Escribí pruebas unitarias con XCTest sobre la capa de red y los modelos de dominio, cubriendo los casos de error de la API"],
  ["• Ayudé al equipo con GraphQL",
   "• Integré consultas GraphQL para el catálogo de productos, definiendo fragmentos reutilizables y el manejo de errores parciales"],
  ["• Atendí caja",
   "• Ejecuté el arqueo de caja cuadrando efectivo, comprobantes y diferencias bajo procedimientos de control interno antes del cierre"],
  ["• Revisé código",
   "• Revisé pull requests del equipo iOS señalando riesgos de concurrencia y deuda técnica antes de cada release"],
]

/** Lo que el guard TIENE que matar. */
const BASURA: Array<[string, string]> = [
  ["• Integré APIs RESTful para onboarding", "• Integré APIs RESTful para onboarding."],
  ["• Desarrollé la app en Swift", "• Desarrollé la aplicación en Swift"],
  ["• Atendí 80 clientes por día", "• Atendí clientes en ventanilla con buen trato"],
  ["• Integré APIs RESTful con Swift", "• Integré APIs con buenas prácticas"],
  ["• Hice pruebas de la app", "• Escribí pruebas con [N] casos de prueba"],
  ["• Trabajé en la app", "• Trabajé en la app usando Kubernetes y Terraform"],
]

describe("la cadena de guards, corrida entera", () => {
  /**
   * ── LO QUE ESTA MEDICIÓN DESTAPÓ (2026-08-22) ────────────────────────────
   *
   * La sección propia del usuario («AREAS OF EXPERTISE») era invisible para el
   * análisis, y eso costaba DOS cosas, no una. La conocida: el puntaje le cobraba
   * como ausentes keywords que su CV muestra. La que nadie había visto: el guard
   * anti-invención usa ese mismo texto como FUENTE, así que una reescritura que
   * nombraba XCTest —herramienta que él declara en esa sección— se descartaba
   * como dato inventado sobre él.
   *
   * O sea que la sección invisible no sólo bajaba la nota: le borraba las mejores
   * reescrituras, en silencio y sin que ningún test lo viera.
   */
  it("una herramienta que el usuario declara en una sección propia no es un invento", () => {
    const linea = "• Escribí pruebas unitarias con XCTest sobre la capa de red y los modelos de dominio, cubriendo los casos de error de la API"
    const sinSeccion = survivesBulletChain("• Hice pruebas", linea, SOURCE_SIN, TERMS)
    const conSeccion = survivesBulletChain("• Hice pruebas", linea, SOURCE_CON, TERMS)
    
    expect(sinSeccion).toBe("hardCoded")
    expect(conSeccion).toBe("KEPT")
  })

  /** Si una de éstas muere, el usuario pagó un uso para que no le devolvamos nada. */
  it("ninguna reescritura de valor real se pierde", () => {
    const muertas = VALIOSAS
      .map(([o, s]) => [s.slice(0, 50), survivesBulletChain(o, s, SOURCE, TERMS)] as const)
      .filter(([, v]) => v !== "KEPT")
    expect(muertas).toEqual([])
  })
  /** Y el error simétrico: un guard que no filtra nada es un guard que no existe. */
  it("ninguna reescritura vacía o inventada llega al usuario", () => {
    const vivas = BASURA
      .map(([o, s]) => [s.slice(0, 50), survivesBulletChain(o, s, SOURCE, TERMS)] as const)
      .filter(([, v]) => v === "KEPT")
    expect(vivas).toEqual([])
  })

  /**
   * Y LA CIFRA NO SE BORRA — va a confirmar (diseño del CEO, 2026-08-22).
   *
   * «Reduje los errores un 40%» es una cifra que el CV no tiene. El diseño viejo
   * la descartaba; el correcto la deja llegar MARCADA para que el usuario la
   * confirme o corrija. No es basura que muere ni valor que entra a ciegas: es
   * una propuesta que el usuario decide.
   */
  it("una cifra propuesta llega para confirmar, no se descarta ni se aplica a ciegas", () => {
    const v = survivesBulletChain("• Hice pruebas de la app", "• Reduje los errores en producción un 40%", SOURCE, TERMS)
    expect(v).toBe("figureConfirm")
  })
})
