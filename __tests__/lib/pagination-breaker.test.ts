import { describe, it, expect } from "vitest"
import { breakIntoPages } from "@/lib/pagination/breaker"
import { type FlowAtom, DEFAULT_WEIGHTS } from "@/lib/pagination/types"

/** Helper: átomo con altura fija y flags opcionales. */
const atom = (id: string, height: number, extra: Partial<FlowAtom> = {}): FlowAtom => ({
  id,
  height,
  ...extra,
})

describe("pagination breaker — básicos", () => {
  it("array vacío → layout vacío, badness 0", () => {
    const layout = breakIntoPages([])
    expect(layout.pages).toEqual([])
    expect(layout.totalBadness).toBe(0)
  })

  it("todo cabe en una página → una sola página", () => {
    const atoms = [atom("a", 200), atom("b", 200), atom("c", 200)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages).toHaveLength(1)
    expect(layout.pages[0].atomIndices).toEqual([0, 1, 2])
    expect(layout.pages[0].usedHeight).toBe(600)
    expect(layout.pages[0].fillHeight).toBe(400)
  })

  it("desborde exacto → parte a segunda página sin cortar átomos", () => {
    const atoms = [atom("a", 600), atom("b", 600)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages).toHaveLength(2)
    expect(layout.pages[0].atomIndices).toEqual([0])
    expect(layout.pages[1].atomIndices).toEqual([1])
  })

  it("cada página conserva orden y suma alturas correcta", () => {
    const atoms = [atom("a", 500), atom("b", 500), atom("c", 500), atom("d", 500)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    const flat = layout.pages.flatMap(p => p.atomIndices)
    expect(flat).toEqual([0, 1, 2, 3]) // orden preservado, sin duplicar ni perder
    layout.pages.forEach(p => {
      const sum = p.atomIndices.reduce((s, idx) => s + atoms[idx].height, 0)
      expect(p.usedHeight).toBe(sum)
    })
  })
})

describe("pagination breaker — reglas de calidad", () => {
  it("NO deja un header keepNext huérfano al pie de página", () => {
    // Sin la regla, greedy llenaría pág 1 con [a(700), header(100)] y dejaría
    // el header solo al pie. El breaker debe empujar el header a la pág 2.
    const atoms = [
      atom("a", 700),
      atom("header", 100, { keepNext: true }),
      atom("body", 250),
    ]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    const page1 = layout.pages[0].atomIndices
    // El header (idx 1) no debe ser el último de la página 1.
    expect(page1[page1.length - 1]).not.toBe(1)
    // header y su cuerpo viajan juntos a la página siguiente.
    const page2 = layout.pages[1].atomIndices
    expect(page2).toContain(1)
    expect(page2).toContain(2)
  })

  it("respeta forcedBreakBefore aunque quepa en la página anterior", () => {
    const atoms = [
      atom("a", 200),
      atom("b", 200, { forcedBreakBefore: true }), // debe empezar página nueva
      atom("c", 200),
    ]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages).toHaveLength(2)
    expect(layout.pages[0].atomIndices).toEqual([0])
    expect(layout.pages[1].atomIndices).toEqual([1, 2])
  })

  it("prefiere cortar en frontera de sección (bonus)", () => {
    // Dos distribuciones caben; la que corta justo antes del sectionStart
    // debe ganar por el bonus de frontera.
    const atoms = [
      atom("exp1", 400),
      atom("exp2", 400),
      atom("skillsHeader", 200, { sectionStart: true }),
      atom("skill1", 400),
    ]
    // pageHeight 1000: pág1 = [exp1,exp2]=800, corte antes de skillsHeader (sectionStart).
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages[0].atomIndices).toEqual([0, 1])
    expect(layout.pages[1].atomIndices).toEqual([2, 3])
  })

  it("átomo más alto que la página se coloca solo (overflow inevitable)", () => {
    const atoms = [atom("huge", 1400), atom("b", 200)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages[0].atomIndices).toEqual([0])
    expect(layout.pages[0].fillHeight).toBe(0) // clamp, no negativo
    expect(layout.pages[1].atomIndices).toEqual([1])
  })
})

describe("pagination breaker — gaps entre átomos (fix margen colapsado)", () => {
  it("suma gaps INTERNOS al ocupar la página", () => {
    // 2 átomos de 400 + gap 100 entre ellos = 900 usado (no 800).
    const atoms = [atom("a", 400, { gapAfter: 100 }), atom("b", 400)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages).toHaveLength(1)
    expect(layout.pages[0].usedHeight).toBe(900)
    expect(layout.pages[0].fillHeight).toBe(100)
  })

  it("DESCARTA el gap de frontera (el del último átomo de una página)", () => {
    // a(500) gapAfter 600 → si el gap contara en frontera, no cabría con nada.
    // Al cortar tras 'a', su gap de frontera se descarta: a sola en pág 1.
    const atoms = [atom("a", 500, { gapAfter: 600 }), atom("b", 500)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    // Sin el fix, sumar el gap haría a(500)+gap(600)=1100 > 1000 y rompería.
    // Con el fix, a y b caben juntas (500+600 interno = 1100 > 1000 → parten),
    // pero el gap de 'a' NO bloquea colocarla sola en pág 1.
    expect(layout.pages[0].atomIndices).toEqual([0])
    expect(layout.pages[0].usedHeight).toBe(500) // gap de frontera descartado
    expect(layout.pages[1].atomIndices).toEqual([1])
  })

  it("átomos sin gapAfter (undefined) se tratan como gap 0 — retrocompat", () => {
    const atoms = [atom("a", 400), atom("b", 400)]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    expect(layout.pages[0].usedHeight).toBe(800)
  })
})

describe("pagination breaker — óptimo global vs greedy", () => {
  it("elige cortes globalmente óptimos, no llenado avaro local", () => {
    // Greedy llenaría pág1 hasta el tope dejando un header huérfano; el DP
    // sacrifica algo de llenado local para minimizar badness TOTAL.
    const atoms = [
      atom("a", 500),
      atom("b", 450),
      atom("h", 60, { keepNext: true, sectionStart: true }),
      atom("c", 500),
      atom("d", 400),
    ]
    const layout = breakIntoPages(atoms, { pageHeight: 1000 })
    // El header no queda huérfano al pie de ninguna página no-final.
    layout.pages.slice(0, -1).forEach(p => {
      const last = p.atomIndices[p.atomIndices.length - 1]
      expect(atoms[last].keepNext).not.toBe(true)
    })
    // Solución con badness finita (no prohibida).
    expect(Number.isFinite(layout.totalBadness)).toBe(true)
  })

  it("badness total baja cuando el corte cae en sección vs corte forzado feo", () => {
    const clean = breakIntoPages(
      [atom("a", 800), atom("s", 300, { sectionStart: true }), atom("b", 300)],
      { pageHeight: 1000 },
    )
    // El bonus de sección hace que la badness sea menor que sin frontera.
    const noSection = breakIntoPages(
      [atom("a", 800), atom("s", 300), atom("b", 300)],
      { pageHeight: 1000 },
    )
    expect(clean.totalBadness).toBeLessThan(noSection.totalBadness)
  })

  it("pesos por defecto son sanos: prohibiciones grandes, penalidades escaladas", () => {
    expect(DEFAULT_WEIGHTS.orphanHeader).toBeGreaterThan(DEFAULT_WEIGHTS.sectionBoundaryBonus)
    expect(DEFAULT_WEIGHTS.underfullRatio).toBeGreaterThan(0)
    expect(DEFAULT_WEIGHTS.underfullRatio).toBeLessThan(1)
  })
})
