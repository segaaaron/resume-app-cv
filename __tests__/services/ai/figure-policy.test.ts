import { describe, it, expect } from "vitest"
import { vi } from "vitest"
vi.mock("@/lib/db", () => ({ db: {} }))
import { hardCodedFactKind } from "@/lib/services/ai/shared/ai-helpers"

/**
 * LA CIFRA: UNA SOLA REGLA, Y LA MISMA EN LOS TRES LADOS.
 *
 * ── LA CONTRADICCIÓN QUE ESTO CIERRA (barrido, 2026-08-22) ─────────────────
 *
 * La doctrina que se le manda al modelo dice, textual: proponé el tamaño medible
 * del trabajo que él describió **como RANGO que confirma o corrige en un clic,
 * nunca como número exacto presentado como hecho**.
 *
 * Y después el código decía otras dos cosas, las dos equivocadas:
 *
 *  · SEIS módulos usaban `hasHardCodedFact`, un booleano: cualquier número que
 *    no estuviera en la fuente tiraba la reescritura ENTERA. Le pedíamos el
 *    rango en el prompt y le borrábamos la respuesta. El usuario no ve un
 *    descarte: ve menos sugerencias y líneas peladas donde el tamaño era obvio.
 *
 *  · tailor hacía lo contrario y se pasaba de largo: dejaba pasar CUALQUIER
 *    cifra con el chip «confirmá la cifra», incluido un resultado exacto que el
 *    candidato nunca contó. Un chip no vuelve legítimo un hecho fabricado — la
 *    mayoría aplica sin leer, y lo que queda en el CV es algo que no puede
 *    defender en la entrevista.
 *
 * La línea correcta pasa por el medio y ya estaba escrita en la doctrina; lo que
 * faltaba era que el código supiera leerla.
 */
describe("y el tipo de dato quemado se sigue distinguiendo", () => {
  it("un placeholder nunca es una propuesta", () => {
    expect(hardCodedFactKind("Atendí [N] clientes", "Atendí clientes")).toBe("placeholder")
  })

  /**
   * ── LO QUE ESTE TEST ME CORRIGIÓ A MÍ (2026-08-22) ────────────────────────
   *
   * Escribí este caso con «entre 50 y 100 clientes» esperando `"figure"`, y da
   * `null`. La causa: `METRIC_REGEX` sólo acusa un número cuando lleva UNA DE
   * SUS UNIDADES (%, users/usuarios, requests, reduction, increase…). «clientes»
   * no está en esa lista.
   *
   * O sea que el guard booleano nunca estuvo tirando la mayoría de los rangos
   * propuestos: estaba tirando, sobre todo, cifras con forma de RESULTADO
   * («un 40%», «12 usuarios»), que es lo que la doctrina también prohíbe.
   *
   * La contradicción era real pero más chica de lo que yo describí, y queda
   * escrito acá con su medida exacta en vez de en un reporte que nadie relee.
   * El arreglo sigue siendo el correcto: cubre el caso donde el rango SÍ usa una
   * unidad de la lista, que antes se descartaba siendo legítimo.
   */
  it("una cifra sólo se acusa cuando lleva una unidad de la lista", () => {
    expect(hardCodedFactKind("Atendí entre 50 y 100 clientes", "Atendí clientes")).toBe(null)
    expect(hardCodedFactKind("Atendí entre 20 y 30 usuarios", "Atendí clientes")).toBe("figure")
  })

  it("una cifra que la fuente no tiene se marca como figure — el usuario la confirma", () => {
    // Ya no se juzga la FORMA (rango vs exacta): toda cifra ausente del CV es
    // `figure` y viaja al chip de confirmación. El diseño del CEO: la IA propone,
    // el usuario decide. Se acabó el borrado por no tener forma de rango.
    expect(hardCodedFactKind("Atendí entre 20 y 30 usuarios por turno", "Atendí usuarios")).toBe("figure")
    expect(hardCodedFactKind("Reduje los errores un 40%", "Corregí errores")).toBe("figure")
  })

  it("y una cifra que la fuente ya decía no es nada", () => {
    expect(hardCodedFactKind("Atendí 80 clientes por día", "Atendía 80 clientes")).toBe(null)
  })
})
