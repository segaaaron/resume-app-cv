/**
 * extract-pdf — Extracción de texto PDF consciente de columnas y posición.
 *
 * pdf-parse por defecto une items por cambio de Y sin separadores ni orden,
 * destruyendo layouts de 2 columnas y tablas (celdas concatenadas sin espacio,
 * columnas intercaladas). Este módulo usa el callback `pagerender` de pdf-parse
 * para obtener cada item de texto CON sus coordenadas (x, y) y reconstruye:
 *
 *  1. Líneas visuales reales (agrupación por Y con tolerancia).
 *  2. Separadores de celda: gap horizontal grande entre items → tab (\t).
 *  3. Columnas: detecta el "gutter" vertical por página, decide cuál columna
 *     es la PRINCIPAL (la más densa en texto — cubre sidebar-left y
 *     sidebar-right) y emite primero todo el flujo principal en orden de
 *     página, luego COLUMN_BREAK, luego los sidebars. Items que cruzan el
 *     gutter (headers full-width con nombre/título) van al flujo principal.
 */

import { COLUMN_BREAK } from "./patterns"
import { extractActualText, type RecoveredText } from "./actual-text"

type PdfParseFn = (
  buf: Buffer,
  opts?: { pagerender?: (pageData: PdfPageData) => Promise<string> }
) => Promise<{ text: string; numpages: number }>
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as PdfParseFn

interface TextItem {
  str: string
  transform: number[]
  width: number
}

interface PdfPageData {
  view: number[]
  getTextContent(): Promise<{ items: TextItem[] }>
}

export interface PositionedItem {
  s: string
  x: number
  y: number
  w: number
}

export interface PageItems {
  width: number
  items: PositionedItem[]
}

/** Tolerancia vertical para considerar que dos items están en la misma línea visual. */
const LINE_Y_TOLERANCE = 3.5
/** Gap horizontal mínimo (pt) entre items para insertar separador de celda (\t). */
const CELL_GAP = 7
/** Gap horizontal mínimo (pt) para insertar un espacio simple. */
const WORD_GAP = 1.5
/** Mínimo de items a cada lado del gutter para aceptar layout de 2 columnas. */
const MIN_COLUMN_ITEMS = 5

/** Agrupa items posicionados en líneas visuales (por Y, con tolerancia). */
function groupIntoLines(items: PositionedItem[]): PositionedItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: PositionedItem[][] = []
  for (const it of sorted) {
    const last = lines[lines.length - 1]
    if (last && Math.abs(last[0].y - it.y) <= LINE_Y_TOLERANCE) {
      last.push(it)
    } else {
      lines.push([it])
    }
  }
  for (const line of lines) line.sort((a, b) => a.x - b.x)
  return lines
}

/** Une los items de una línea respetando gaps: gap grande → \t, medio → espacio. */
function joinLine(line: PositionedItem[]): string {
  let out = ""
  for (let i = 0; i < line.length; i++) {
    const it = line[i]
    if (i > 0) {
      const prev = line[i - 1]
      const gap = it.x - (prev.x + prev.w)
      if (gap >= CELL_GAP) out += "\t"
      else if (gap >= WORD_GAP && !out.endsWith(" ")) out += " "
    }
    out += it.s
  }
  return out
}

/** Rango Y de un conjunto recortando outliers (hasta 2 ítems o 10% por extremo). */
function trimmedRange(ys: number[]): [number, number] {
  const sorted = [...ys].sort((a, b) => a - b)
  const k = Math.min(2, Math.floor(sorted.length * 0.1))
  return [sorted[k], sorted[sorted.length - 1 - k]]
}

/**
 * Busca un gutter vertical (banda X sin items que la crucen) que separe la
 * página en dos columnas con solapamiento vertical real (lado a lado).
 * Devuelve la posición X del gutter o null si la página es de una columna.
 */
function findGutter(page: PageItems): number | null {
  const { width, items } = page
  if (items.length < MIN_COLUMN_ITEMS * 2) return null

  const yAll = items.map(i => i.y)
  const contentH = Math.max(...yAll) - Math.min(...yAll)
  if (contentH <= 0) return null

  let best: { x: number; spans: number; rightCount: number } | null = null

  for (let gx = width * 0.3; gx <= width * 0.72; gx += 4) {
    const left = items.filter(it => it.x + it.w <= gx)
    const right = items.filter(it => it.x >= gx)
    if (left.length < MIN_COLUMN_ITEMS || right.length < MIN_COLUMN_ITEMS) continue

    // Exigir solapamiento vertical: columnas lado a lado, no apiladas
    const lMin = Math.min(...left.map(i => i.y)), lMax = Math.max(...left.map(i => i.y))
    const rMin = Math.min(...right.map(i => i.y)), rMax = Math.max(...right.map(i => i.y))
    const overlap = Math.min(lMax, rMax) - Math.max(lMin, rMin)
    const minSpan = Math.min(lMax - lMin, rMax - rMin)
    if (minSpan <= 0 || overlap < minSpan * 0.3) continue

    // La columna derecha debe tener altura sustancial — celdas sueltas de una
    // tabla (FIRM/LOC en 2-3 filas) no son una columna real.
    if (rMax - rMin < contentH * 0.25) continue

    // Rango de solapamiento RECORTADO (sin outliers: timestamps/banners sueltos
    // no definen el rango). Dentro de él NINGÚN item puede cruzar el gutter;
    // fuera (header/footer full-width) se tolera.
    const [lLoT, lHiT] = trimmedRange(left.map(i => i.y))
    const [rLoT, rHiT] = trimmedRange(right.map(i => i.y))
    const overlapLo = Math.max(lLoT, rLoT), overlapHi = Math.min(lHiT, rHiT)
    const crossesInside = items.some(it =>
      it.x < gx && it.x + it.w > gx &&
      it.y >= overlapLo - 5 && it.y <= overlapHi + 5
    )
    if (crossesInside) continue

    // Tabla vs columnas: si (casi) todas las líneas derechas comparten fila
    // visual (mismo Y) con items izquierdos, son CELDAS de una tabla, no una
    // columna independiente. Un sidebar real tiene interlineado propio y solo
    // coincide casualmente (<90%).
    const rightYs: number[] = []
    for (const it of [...right].sort((a, b) => b.y - a.y)) {
      if (!rightYs.length || Math.abs(rightYs[rightYs.length - 1] - it.y) > 2) rightYs.push(it.y)
    }
    const sharedRows = rightYs.filter(ry => left.some(l => Math.abs(l.y - ry) <= 2)).length
    if (sharedRows / rightYs.length >= 0.9) continue

    // Preferir el gutter con MENOS items cruzándolo (los que cruzan se tratan
    // como full-width y se mezclan al main — cuantos menos, más limpio el corte).
    const spans = items.filter(it => it.x < gx && it.x + it.w > gx).length
    if (!best || spans < best.spans || (spans === best.spans && right.length > best.rightCount)) {
      best = { x: gx, spans, rightCount: right.length }
    }
  }

  return best ? best.x : null
}

/** Convierte los items de una página en texto: columna principal y sidebar por separado. */
function renderPage(page: PageItems): { main: string; sidebar: string } {
  const gutter = findGutter(page)

  if (gutter === null) {
    const text = groupIntoLines(page.items).map(joinLine).join("\n")
    return { main: text, sidebar: "" }
  }

  const spanItems = page.items.filter(it => it.x < gutter && it.x + it.w > gutter)
  const leftItems = page.items.filter(it => it.x + it.w <= gutter)
  const rightItems = page.items.filter(it => it.x >= gutter)

  // Columna PRINCIPAL = la más densa en texto (no la izquierda por defecto):
  // plantillas sidebar-izquierda ponen nombre/experiencia en la derecha.
  const leftChars = leftItems.reduce((n, it) => n + it.s.length, 0)
  const rightChars = rightItems.reduce((n, it) => n + it.s.length, 0)
  const leftIsMain = leftChars >= rightChars

  // Items que cruzan el gutter (headers full-width: nombre, título) van al
  // flujo principal, ordenados por Y junto al resto del main.
  const mainItems = [...(leftIsMain ? leftItems : rightItems), ...spanItems]
  const sideItems = leftIsMain ? rightItems : leftItems

  return {
    main: groupIntoLines(mainItems).map(joinLine).join("\n"),
    sidebar: groupIntoLines(sideItems).map(joinLine).join("\n"),
  }
}

/**
 * Reconstruye el texto del documento desde items posicionados.
 * Pura — testeable sin bytes PDF reales.
 */
export function reconstructText(pages: PageItems[]): string {
  const rendered = pages.map(renderPage)
  const mains = rendered.map(r => r.main).filter(Boolean)
  const sidebars = rendered.map(r => r.sidebar).filter(Boolean)

  // Flujo principal completo primero (secciones continúan entre páginas),
  // después el contenido de sidebars — nunca intercalado. COLUMN_BREAK le
  // indica al parser que ahí termina el flujo principal.
  const parts = [...mains]
  if (sidebars.length) parts.push(COLUMN_BREAK, ...sidebars)
  return parts.join("\n")
}

/**
 * Extrae texto de un PDF con reconstrucción de columnas y celdas.
 * API compatible con pdf-parse: devuelve { text, numpages }.
 */
/**
 * Mete en la página el texto que el PDF declara y sus glifos no dicen.
 *
 * Sólo lo AUSENTE. Un span de `/ActualText` puede acompañar a un texto que el
 * extractor ya leyó perfectamente —Word marca también los que sí son glifos— y
 * volver a insertarlo duplicaría la línea. Se compara contra lo que la página ya
 * tiene: si el texto ya está, el span no aporta nada y se descarta.
 *
 * El ancho se estima porque el span no lo declara; sólo lo usa la detección de
 * columnas, y una estimación conservadora no mueve un gutter.
 */
export function mergeRecovered(page: PageItems, recovered: RecoveredText[]): void {
  if (recovered.length === 0) return
  const key = (t: string) => t.trim().replace(/\s+/g, " ").toLowerCase()
  /**
   * Ya presente = LA MISMA LÍNEA ya lo dice. La posición es lo que hace que dos
   * textos sean la misma aparición, no el texto suelto.
   *
   * Dos comparaciones más anchas se probaron y las dos borraron datos reales del
   * CV que originó esto:
   *   · contra todo el texto de la página → "LLANQUE" desaparecía por estar
   *     dentro de "comercialllanque@gmail.com", su propio correo;
   *   · contra los items sueltos de cualquier parte → volvía a desaparecer,
   *     esta vez porque uno de sus empleadores se llama "Comercial Llanque",
   *     setecientos puntos más abajo en la misma página.
   *
   * El extractor suele partir una línea en varios items ("Marketing" + " " +
   * "Digital"), así que se compara contra la línea entera y sin espacios.
   */
  const sameLineSays = (r: RecoveredText, k: string): boolean => {
    const line = page.items
      .filter((it) => Math.abs(it.y - r.y) <= LINE_Y_TOLERANCE)
      .sort((a, b) => a.x - b.x)
      .map((it) => it.s)
      .join("")
    return key(line).replace(/\s+/g, "").includes(k.replace(/\s+/g, ""))
  }
  for (const r of recovered) {
    const k = key(r.text)
    if (!k || sameLineSays(r, k)) continue
    // ~0.5 pt por carácter a 10 pt: basta para ordenar y para no crear gutters.
    page.items.push({ s: r.text.trim(), x: r.x, y: r.y, w: r.text.trim().length * 5 })
  }
}

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  const pages: PageItems[] = []

  /**
   * El texto que el documento declara aparte de lo que dibuja.
   *
   * Se lee del archivo, no de pdf-parse, porque la versión de pdf.js que este
   * paquete trae no conoce `/ActualText` ni expone el marked content donde vive.
   * Ver `actual-text.ts` para el CV real que se importaba sin nombre: su
   * encabezado no eran letras, eran curvas.
   */
  const recovered = extractActualText(buffer)

  const result = await pdfParse(buffer, {
    pagerender: async (pageData: PdfPageData) => {
      const tc = await pageData.getTextContent()
      const items: PositionedItem[] = []
      for (const it of tc.items) {
        // \x00 son glifos decorativos/separadores sin mapeo Unicode → separador visual
        const s = it.str.replace(/\x00/g, "·")
        if (!s.trim()) continue
        items.push({ s, x: it.transform[4], y: it.transform[5], w: it.width })
      }
      const page: PageItems = { width: pageData.view[2] ?? 595, items }
      mergeRecovered(page, recovered.filter((r) => r.page === pages.length))
      pages.push(page)
      return ""
    },
  })

  return { text: reconstructText(pages), numpages: result.numpages }
}
