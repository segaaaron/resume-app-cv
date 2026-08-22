import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * EL PANEL TIENE QUE PODER LEERSE.
 *
 * Medido el 2026-08-21 sobre los tokens reales: `--a-muted-2` daba **2.93:1**
 * sobre blanco y **2.59:1** sobre la superficie gris, contra el mínimo de 4.5:1
 * que pide WCAG AA. Y no era texto decorativo: en este panel pinta las etiquetas
 * de 9 y 9.5px — la peor combinación posible, diminuto y sin contraste.
 *
 * `--a-warn` sobre `--a-warn-soft` daba **2.68:1**, y ése es el par de las bandas
 * de aviso: el texto que explica un problema era el menos legible de la pantalla.
 *
 * ── POR QUÉ ESTE TEST CALCULA EN VEZ DE COMPARAR CADENAS ───────────────────
 *
 * Un test que afirmara `expect(css).toContain("#6D6B63")` se rompería al ajustar
 * el tono y pasaría en verde con cualquier otro color ilegible. Éste lee los
 * tokens del CSS de verdad y ejecuta la fórmula de WCAG: si alguien aclara un
 * color hasta volverlo ilegible, falla — diga lo que diga el hex.
 */

const CSS = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

function token(name: string): string {
  const m = CSS.match(new RegExp(`--a-${name}:\\s*(#[0-9A-Fa-f]{6})`))
  if (!m) throw new Error(`token --a-${name} no encontrado en globals.css`)
  return m[1]
}

/** Luminancia relativa, tal como la define WCAG 2.1. */
function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = ch.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Texto normal. El panel usa 9–12.5px, así que el umbral de texto grande no aplica. */
const AA = 4.5

describe("el texto del panel cumple el contraste mínimo", () => {
  const surfaces: Array<[string, string]> = [
    ["surface", token("surface")],
    ["surface-2", token("surface-2")],
    ["surface-3", token("surface-3")],
  ]

  for (const [label, bg] of surfaces) {
    for (const ink of ["ink", "ink-2", "muted", "muted-2"]) {
      it(`--a-${ink} sobre --a-${label}`, () => {
        const r = contrast(token(ink), bg)
        expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
      })
    }
  }
})

describe("la tinta semántica se lee sobre su propio fondo", () => {
  /**
   * TINTA vs RELLENO. Los tokens `--a-ok`, `--a-warn` y `--a-bad` están
   * calibrados para pintar puntos, barras y bordes, donde el mínimo es 3:1 y lo
   * que importa es que el color se distinga. Sobre su fondo suave no llegaban a
   * 4.5:1, así que el TEXTO necesita su propia variante — la distinción que el
   * sistema ya hacía en `accent` y `ai`, y que a estos tres les faltaba.
   */
  for (const kind of ["ok", "warn", "bad"]) {
    it(`--a-${kind}-ink sobre --a-${kind}-soft`, () => {
      const r = contrast(token(`${kind}-ink`), token(`${kind}-soft`))
      expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
    })

    it(`--a-${kind}-ink también se lee sobre la superficie blanca`, () => {
      const r = contrast(token(`${kind}-ink`), token("surface"))
      expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
    })
  }

  /** Los de relleno siguen siendo distinguibles como forma (3:1). */
  for (const kind of ["ok", "warn", "bad"]) {
    it(`--a-${kind} sirve de relleno visible`, () => {
      expect(contrast(token(kind), token("surface"))).toBeGreaterThanOrEqual(3)
    })
  }
})

describe("los acentos que ya tenían tinta siguen cumpliendo", () => {
  it("--a-accent-ink sobre --a-accent-soft", () => {
    expect(contrast(token("accent-ink"), token("accent-soft"))).toBeGreaterThanOrEqual(AA)
  })
  it("--a-ai-ink sobre --a-ai-soft", () => {
    expect(contrast(token("ai-ink"), token("ai-soft"))).toBeGreaterThanOrEqual(AA)
  })

  /**
   * EL HUECO QUE ESTE BLOQUE CIERRA. La primera versión de este guard cubría los
   * tokens de tinta y los tres semánticos, y dejaba fuera `--a-ai` y
   * `--a-accent` — que también se usaban como color de TEXTO. Medido después:
   * `--a-ai` daba 4.23:1 sobre blanco, y era el color del título «VEREDICTO DEL
   * RECLUTADOR», en mayúsculas de 10px. Un guard incompleto da la misma falsa
   * confianza que no tenerlo.
   *
   * Los de relleno (`--a-ai`, `--a-accent`) pintan iconos y puntos: les basta
   * 3:1 como forma. Para texto están sus `-ink`, y ésa es la regla que el bloque
   * de abajo hace cumplir en los componentes.
   */
  for (const kind of ["ai", "accent"]) {
    it(`--a-${kind}-ink se lee sobre la superficie blanca`, () => {
      const r = contrast(token(`${kind}-ink`), token("surface"))
      expect(r, `${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
    })
  }

  /**
   * `--a-ai` (violeta) llega a 4.23:1 y sirve de relleno; `--a-accent` (el cian
   * de marca, claro por diseño) se queda en 2.41:1 y NO sirve ni de forma. No se
   * oscurece —es la identidad— pero tampoco se usa donde haga falta contraste:
   * su único uso era el anillo de foco de teclado, donde desaparecía. Ahí va la
   * tinta.
   */
  it("--a-ai sirve de relleno visible", () => {
    expect(contrast(token("ai"), token("surface"))).toBeGreaterThanOrEqual(3)
  })

  it("el anillo de foco de teclado se distingue del fondo", () => {
    for (const f of ["components/editor/ats-report/TermTable.tsx"]) {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      for (const m of src.matchAll(/outlineColor:\s*"var\(--a-([a-z0-9-]+)\)"/g)) {
        const r = contrast(token(m[1]), token("surface"))
        expect(r, `--a-${m[1]} como foco: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe("ningún componente pinta texto semántico sobre su fondo suave sin la tinta", () => {
  /**
   * Comprueba una AUSENCIA: el par «fondo suave + color de relleno» no puede
   * volver. De un par que no existe no hay comportamiento que ejecutar, y
   * montar cada componente para leerle el color computado sería más frágil.
   */
  const files = [
    "components/editor/ATSScorePanel.tsx",
    "components/editor/ats-report/CheckRow.tsx",
    "components/editor/ats-report/TermCard.tsx",
    "components/editor/ats-report/TermTable.tsx",
    "components/editor/ats-report/ReportRail.tsx",
    "components/editor/ats-report/ReportSectionCard.tsx",
    "components/editor/ats-report/BulletQualityPanel.tsx",
  ]
  for (const f of files) {
    it(f.split("/").pop()!, () => {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      for (const kind of ["ok", "warn", "bad"]) {
        expect(src, `${f} · ${kind}`).not.toContain(
          `background: "var(--a-${kind}-soft)", color: "var(--a-${kind})"`,
        )
      }
      // Y los acentos: `--a-ai` / `--a-accent` sobre su fondo suave es texto por
      // debajo del mínimo. Para texto van los `-ink`.
      for (const kind of ["ai", "accent"]) {
        expect(src, `${f} · ${kind}`).not.toContain(
          `background: "var(--a-${kind}-soft)", color: "var(--a-${kind})"`,
        )
      }
    })
  }
})
