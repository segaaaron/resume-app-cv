import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"
import { QUANTIFICATION_BAND, SCORE_WEIGHTS } from "@/lib/ats/scoring-config"

/**
 * EL IMPACTO CUANTIFICADO AHORA PUNTÚA.
 *
 * «Toda la información que tenemos debe cuadrar con el score, y viceversa. Las
 * cosas opcionales no aportan score» (CEO, 2026-08-21).
 *
 * El panel medía qué proporción de las viñetas lleva una cifra real, lo pintaba
 * en un medidor con su banda verde, y le pedía al candidato que cuantificara sus
 * logros. Ese trabajo valía CERO: lo hacía, el número no se movía, y concluía
 * —con razón— que el panel le pedía cosas que no cuentan.
 *
 * Es uno de los nueve criterios que la investigación documenta para Workday,
 * Greenhouse y Taleo.
 */
const KW = {
  jobTitle: "Ejecutivo Comercial",
  hardSkills: ["Salesforce", "CRM"],
  softSkills: ["Negociación"],
  mustHaves: [],
} as never
const SECTIONS = { experience: true, education: true, skills: true, contact: true, summary: true } as never
const HAY = "Ejecutivo Comercial. Gestioné cartera en Salesforce, pipeline en CRM, negociación con clientes."
const EV = "Gestioné cartera en Salesforce, pipeline en CRM, negociación con clientes."

const scoreAt = (pct: number | null) =>
  computeATSMatch(KW, HAY, "Ejecutivo Comercial", SECTIONS, EV, undefined, undefined, undefined, undefined, pct).score

describe("cuantificar los logros sube el puntaje", () => {
  it("un CV sin ninguna cifra puntúa menos que uno en la banda", () => {
    expect(scoreAt(0)).toBeLessThan(scoreAt(QUANTIFICATION_BAND.min))
  })

  it("y la mejora es progresiva, no un salto", () => {
    expect(scoreAt(20)).toBeGreaterThan(scoreAt(0))
    expect(scoreAt(40)).toBeGreaterThan(scoreAt(20))
  })
})

describe("pero NO premia saturar, porque el panel desaconseja saturar", () => {
  /**
   * LA CONTRADICCIÓN QUE ESTO EVITA. La doctrina dice que no toda viñeta lleva
   * número — un CV donde todas terminan en una cifra se lee como fabricado — y
   * el medidor dibuja esa banda. Si el puntaje premiara linealmente hasta el
   * 100%, empujaría al candidato justo a lo que la pantalla de al lado le
   * desaconseja. Sería el mismo panel diciendo dos cosas opuestas.
   */
  it("el 100% puntúa igual o menos que la banda sana", () => {
    expect(scoreAt(100)).toBeLessThanOrEqual(scoreAt(QUANTIFICATION_BAND.max))
  })

  it("cuantificar de más cuesta, igual que cuantificar de menos", () => {
    expect(scoreAt(100)).toBeLessThan(scoreAt(QUANTIFICATION_BAND.min))
  })

  it("dentro de la banda el puntaje no cambia", () => {
    expect(scoreAt(QUANTIFICATION_BAND.min)).toBe(scoreAt(QUANTIFICATION_BAND.max))
  })
})

describe("sin viñetas no se penaliza a nadie", () => {
  /**
   * Un CV que aún no cargó la experiencia no es uno que no cuantifica: es uno
   * que no podemos medir. La categoría queda fuera del reparto y los pesos se
   * renormalizan solos.
   */
  it("un CV sin el dato puntúa como uno en la banda", () => {
    expect(scoreAt(null)).toBe(scoreAt(QUANTIFICATION_BAND.max))
  })
})

describe("la banda tiene un solo dueño", () => {
  /**
   * Vivía dentro de `BulletQualityPanel.tsx`. Mientras sólo la usaba el panel
   * alcanzaba; cuando pasó a PUNTUAR, dos copias del mismo umbral es como el
   * número y la pantalla terminan diciendo cosas distintas.
   */
  it("el panel la lee de scoring-config, no de una copia propia", () => {
    const src = readFileSync(join(process.cwd(), "components/editor/ats-report/BulletQualityPanel.tsx"), "utf8")
    expect(src).not.toMatch(/const TARGET_MIN = \d/)
    expect(src).toContain("QUANTIFICATION_BAND")
  })

  it("y la categoría pesa lo declarado", () => {
    expect(SCORE_WEIGHTS.impact.value).toBe(0.08)
    expect(SCORE_WEIGHTS.impact.basis).toBe("chosen")
  })
})
