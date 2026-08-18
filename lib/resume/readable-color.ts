// Guarantees a colour is legible as TEXT on the surface it sits on.
//
// WHY IT EXISTS: the premium templates were designed on dark canvases, where a pale gold
// or a soft cream reads perfectly. Moved onto white — which is what a résumé is printed
// on, and what a recruiter opens — those same values collapse: #cbab5c on white is about
// 2.0:1, well under the 4.5:1 a body text needs. The result is a CV that looks elegant on
// screen and arrives half-invisible.
//
// The signature colour still shows: this only darkens it far enough to be readable, and
// only where it carries TEXT. Frames, rules, diamonds and other decoration keep the exact
// designed value, because nothing has to be read off them.
//
// Contrast is WCAG 2.1 relative luminance. 4.5:1 is the AA threshold for body text.

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function toHex([r, g, b]: [number, number, number]): string {
  const p = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")
  return `#${p(r)}${p(g)}${p(b)}`
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 1 // unknown format → treat as light, so callers darken rather than lighten
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two colours, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The same colour, darkened just enough to be readable as text on `bg`.
 *
 * Returns the original when it already passes — a signature that works is never touched.
 * Steps toward black in small multiplications so the hue survives; a gold stays gold, it
 * just stops being a highlighter on paper.
 */
export function readableOn(color: string, bg = "#ffffff", min = 4.5): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  if (contrastRatio(color, bg) >= min) return color

  let current: [number, number, number] = [...rgb] as [number, number, number]
  for (let i = 0; i < 40; i++) {
    current = [current[0] * 0.92, current[1] * 0.92, current[2] * 0.92]
    const hex = toHex(current)
    if (contrastRatio(hex, bg) >= min) return hex
  }
  return "#1a1a1a" // pathological input — legible beats faithful
}
