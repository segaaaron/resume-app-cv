import { describe, it, expect } from "vitest"
import { droppedPostingTerms, losesPostingTerm } from "@/lib/ats/rewrite-keeps-match"
// El matcher viejo se fue con su motor: estas dos preguntas las contesta
// `vocabulary`, que es de donde el guard las toma de verdad.
import { termPresent as keywordPresent, normalizeTerm as normalize } from "@/lib/ats/vocabulary"

/**
 * UNA REESCRITURA NO PUEDE BAJARTE EL PUNTAJE.
 *
 * ── EL DEFECTO, MEDIDO CONTRA LA API REAL (2026-08-21) ─────────────────────
 *
 * Ocho CVs, aplicando todo lo que el panel ofreció y volviendo a medir. Uno
 * salió PEOR de lo que entró: `en-security-guard`, **23 → 16**. Apretás un botón
 * rotulado como mejora y perdés siete puntos.
 *
 * Los cinco guards de reescritura miran el TEXTO —la cifra, el contenido, la
 * trivialidad, la tercera persona, la línea equivocada—. Ninguno miraba LA
 * VACANTE. Una reescritura más rica, con verbo fuerte, que conserva las cifras y
 * dice más palabras, pasa los cinco y se come «Salesforce» por el camino.
 */
describe("los términos de la vacante sobreviven a la reescritura", () => {
  const POSTING = ["Salesforce", "CRM", "prospección", "negociación"]

  it("caza el caso medido: la línea decía el término y la reescritura no", () => {
    expect(droppedPostingTerms(
      "Gestioné la cartera de clientes en Salesforce con seguimiento semanal",
      "Gestioné la cartera de clientes con seguimiento semanal y reportes al comité",
      POSTING,
    )).toEqual(["Salesforce"])
  })

  it("nombra todos los que se cayeron, no sólo el primero", () => {
    expect(droppedPostingTerms(
      "Prospección activa en Salesforce y CRM para la cartera del sur",
      "Trabajé la cartera del sur con visitas semanales",
      POSTING,
    ).sort()).toEqual(["CRM", "Salesforce", "prospección"])
  })

  /**
   * EL ERROR SIMÉTRICO, QUE ES EL QUE HAY QUE VIGILAR. Un guard que se lleva
   * puesta la reescritura buena deja al usuario con el aviso y sin la
   * corrección: el bucle «me lo marca y no me lo arregla» que este proyecto ya
   * pagó dos veces.
   */
  it("una reescritura que conserva el término pasa", () => {
    expect(losesPostingTerm(
      "Gestioné cartera en Salesforce",
      "Gestioné una cartera de 120 clientes en Salesforce, priorizando por probabilidad de cierre",
      POSTING,
    )).toBe(false)
  })

  it("y una que AGREGA términos, también", () => {
    expect(losesPostingTerm(
      "Atendí clientes del sur",
      "Atendí clientes del sur con prospección activa y seguimiento en CRM",
      POSTING,
    )).toBe(false)
  })

  /**
   * NO EXIGE AGREGAR. Pedirle a cada reescritura que sume un término empujaría
   * al relleno de keywords — justo lo que el aviso de sobre-optimización del
   * panel desaconseja. La regla es asimétrica a propósito.
   */
  it("no reclama por un término que la línea nunca tuvo", () => {
    expect(droppedPostingTerms(
      "Atendí clientes del sur",
      "Atendí clientes del sur con visitas quincenales",
      POSTING,
    )).toEqual([])
  })

  /** Falla ABIERTO: sin vacante que consultar no se descarta nada. */
  it("sin términos de la vacante no descarta nada", () => {
    expect(droppedPostingTerms("Gestioné cartera en Salesforce", "Gestioné cartera", [])).toEqual([])
  })
})

/**
 * LA PARTE QUE LO VUELVE UNA SOLUCIÓN DE FONDO Y NO UN SEXTO HEURÍSTICO.
 *
 * «El que manda es el ATS. Si tenés otras cosas que validar, deberías validar
 * contra la respuesta del ATS y no a ciegas» (CEO, 2026-08-21).
 *
 * El guard usa `termPresent` y `normalizeTerm`, que son literalmente las mismas
 * funciones que el matcher reexporta como `keywordPresent` y `normalize` para
 * contar la cobertura. Si esto dijera que un término se cayó y el matcher lo
 * siguiera contando, el panel volvería a tener dos verdades.
 */
describe("el guard y el puntaje responden con la misma función", () => {
  const CASOS = [
    ["Gestioné cartera en Salesforce", "Salesforce", true],
    ["Gestioné la cartera de clientes", "Salesforce", false],
    ["Prospección activa de cuentas nuevas", "prospección", true],
  ] as const

  for (const [texto, termino, esperado] of CASOS) {
    it(`«${termino}» en «${texto.slice(0, 34)}…»`, () => {
      // Lo que responde el motor del puntaje…
      const segúnElMatcher = keywordPresent(termino, normalize(texto))
      expect(segúnElMatcher).toBe(esperado)
      // …y lo que responde el guard, sobre el mismo dato.
      const seCae = droppedPostingTerms(texto, "línea reescrita sin nada de eso", [termino]).length > 0
      expect(seCae).toBe(esperado)
    })
  }
})
