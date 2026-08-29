import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"
import { computeCostUsd, MODEL_PRICING } from "@/lib/services/ai/shared/cost-tracker"

// TODA llamada al modelo tiene que dejar registrado lo que gastó. Tres no lo hacían y
// nadie se enteraba: el panel mostraba un costo por usuario menor que el real, y las dos
// peores corrían dentro de CADA análisis ATS, que es la función más usada del producto.
//
// Este guard lee el código fuente. Un grep contesta "¿falta alguna hoy?"; sólo un test
// contesta "¿se va a cazar la próxima?".

const DIRS = ["lib/services/ai/modules", "lib/services/ai/shared"]
/** Sitios donde una llamada sin contador está justificada, con su motivo. */
const EXEMPT: Record<string, string> = {
  // Su uso se DEVUELVE al llamador (retryUsage) y AISummaryModule lo suma al suyo.
  "summary-gate.ts": "devuelve retryUsage y AISummaryModule lo agrega",
}

function filesWithModelCalls(): { file: string; path: string; calls: number; reports: boolean }[] {
  const out: { file: string; path: string; calls: number; reports: boolean }[] = []
  for (const dir of DIRS) {
    for (const f of readdirSync(join(process.cwd(), dir))) {
      if (!f.endsWith(".ts")) continue
      const path = join(process.cwd(), dir, f)
      const src = readFileSync(path, "utf8")
      const calls = (src.match(/aiClient\.chat\(/g) ?? []).length
      if (calls === 0) continue
      // Cuenta la LLAMADA, no el import: la primera versión de este guard buscaba
      // "logAIUsage" a secas y daba verde con el import presente y la llamada borrada.
      // Un test que no detecta el bug que dice cubrir es peor que no tenerlo.
      const reports =
        /logAIUsage\s*\(/.test(src) ||     // registra su propio gasto
        /onUsage\s*:/.test(src) ||          // lo reporta al llamador
        /onUsage\?\.\(/.test(src) ||       // lo emite (helper compartido)
        /retryUsage/.test(src)              // lo devuelve para que el llamador lo sume
      out.push({ file: f, path, calls, reports })
    }
  }
  return out
}

describe("ningún gasto de IA queda sin contar", () => {
  it("encuentra los módulos de IA (un guard sobre cero archivos no prueba nada)", () => {
    // Eran diez hasta que tres módulos se fueron con el motor ATS viejo
    // (2026-08-28). Lo que este caso cuida es lo que dice su propio nombre —que
    // el guard no corra sobre cero archivos—, no un número que hay que venir a
    // corregir cada vez que un módulo nace o muere.
    expect(filesWithModelCalls().length).toBeGreaterThan(0)
  })

  it("cada archivo que llama al modelo registra o reporta su uso", () => {
    const silent = filesWithModelCalls()
      .filter((f) => !f.reports && !EXEMPT[f.file])
      .map((f) => f.file)
    expect(silent, `Llaman al modelo sin contar el gasto: ${silent.join(", ")}`).toEqual([])
  })
})

describe("precios de OpenAI", () => {
  it("los modelos activos tienen precio propio, no la tarifa de castigo", () => {
    for (const m of ["gpt-5.4-nano", "gpt-5.4-mini", "text-embedding-3-small"]) {
      expect(MODEL_PRICING[m], m).toBeDefined()
    }
  })

  it("calcula sobre el precio por millón de tokens", () => {
    // 1M de entrada a $0,20 + 1M de salida a $1,25
    expect(computeCostUsd("gpt-5.4-nano", 1_000_000, 1_000_000)).toBeCloseTo(1.45, 6)
  })

  it("un modelo desconocido se cobra CARO — sub-reportar es peor que exagerar", () => {
    const unknown = computeCostUsd("modelo-que-no-existe", 1_000_000, 0)
    const known = computeCostUsd("gpt-5.4-mini", 1_000_000, 0)
    expect(unknown).toBeGreaterThan(known)
  })

  // OpenAI cobra más barato el prompt que ya vio. Cobrarlo entero infla el gasto del
  // panel — hacia arriba, que es el lado seguro, pero inservible para calcular margen.
  it("cobra los tokens cacheados a su precio de caché, no al de entrada", () => {
    // 600 frescos a $0,20/1M + 400 cacheados a $0,02/1M = (120 + 8) / 1e6
    expect(computeCostUsd("gpt-5.4-nano", 1000, 0, 400)).toBeCloseTo(0.000128, 12)
  })

  it("los cacheados vienen DENTRO de promptTokens y no se cobran dos veces", () => {
    const conCache = computeCostUsd("gpt-5.4-nano", 1000, 0, 400)
    const sinCache = computeCostUsd("gpt-5.4-nano", 1000, 0, 0)
    // Si se sumaran aparte en vez de descontarse del total, salir más caro con caché.
    expect(conCache).toBeLessThan(sinCache)
    expect(conCache).toBeGreaterThan(0)
  })

  // ESTE es el que impide volver a una constante global: 5.4 descuenta 90% y 4.1 un 75%.
  // Un único CACHED_INPUT_RATIO no puede satisfacer las dos filas a la vez.
  it("el descuento de caché NO es el mismo para todos los modelos", () => {
    const ratio = (m: string) => MODEL_PRICING[m].cachedInputPer1M / MODEL_PRICING[m].inputPer1M
    expect(ratio("gpt-5.4-nano")).toBeCloseTo(0.1, 6)
    expect(ratio("gpt-4.1-nano")).toBeCloseTo(0.25, 6)
    expect(ratio("gpt-5.4-nano")).not.toBeCloseTo(ratio("gpt-4.1-nano"), 3)
  })

  it("ningún modelo cobra el prompt cacheado MÁS caro que el fresco", () => {
    for (const [m, p] of Object.entries(MODEL_PRICING)) {
      expect(p.cachedInputPer1M, m).toBeLessThanOrEqual(p.inputPer1M)
      expect(p.cachedInputPer1M, m).toBeGreaterThan(0)
    }
  })

  it("un cachedTokens absurdo no puede hacer negativo el costo", () => {
    expect(computeCostUsd("gpt-5.4-nano", 100, 0, 99999)).toBeGreaterThanOrEqual(0)
    expect(computeCostUsd("gpt-5.4-nano", 100, 0, -50)).toBeGreaterThan(0)
  })

  it("sin tokens, sin costo", () => {
    expect(computeCostUsd("gpt-5.4-nano", 0, 0)).toBe(0)
  })
})
