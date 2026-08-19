/**
 * actual-text — el texto que el PDF declara aparte porque lo que dibuja no son letras.
 *
 * QUÉ PROBLEMA RESUELVE, medido sobre un CV real que se importó sin nombre.
 *
 * Word exporta ciertos encabezados —los que llevan espaciado entre letras o un
 * efecto de texto— como TRAZOS VECTORIALES. En el content stream no hay glifos,
 * hay curvas:
 *
 *     /P <</MCID 67/Lang (es-ES)>> BDC
 *     214.18 801.36 m   210.77 801.36 l   207.67 806.16 l ...
 *
 * Ningún extractor de texto puede leer eso, porque no hay texto que leer. Y para
 * que un lector de pantalla igual pueda decirlo, el PDF declara el contenido real
 * al lado, en el árbol de estructura:
 *
 *     <</S/Span/Type/StructElem/ActualText(RUBEN) /K[67] /Pg 3 0 R>>
 *
 * `/ActualText` es exactamente el mecanismo que el estándar define para "lo que
 * se ve no es el texto — el texto es este", y un extractor conforme tiene que
 * honrarlo. El nuestro no lo hacía, así que el usuario subía su CV y recibía un
 * currículum sin su nombre, sin el prefijo del teléfono y sin la ciudad: todo lo
 * que su plantilla había dibujado en vez de escribir.
 *
 * POR QUÉ NO ALCANZA CON PEGARLO AL PRINCIPIO. El span trae su MCID, y el MCID
 * aparece en el content stream justo antes de los trazos — cuya primera
 * coordenada es dónde está en la página. Con eso el texto recuperado entra en la
 * misma reconstrucción de líneas y columnas que todo lo demás, en su sitio, en
 * vez de quedar amontonado arriba adivinando el orden.
 *
 * FALLA CERRADA: cualquier cosa que no se entienda devuelve una lista vacía y la
 * extracción sigue siendo la de siempre. Nunca inventa una posición ni un texto.
 */

import { inflateSync } from "node:zlib"

export interface RecoveredText {
  /** Índice de página, 0-based, en el orden del documento. */
  page: number
  text: string
  x: number
  y: number
}

/** Tope de trabajo: un PDF con más streams que esto no es un CV. */
const MAX_STREAMS = 400
/** Un span de ActualText más largo que esto no es una línea de CV. */
const MAX_SPAN_CHARS = 500

/**
 * Decodifica una cadena literal de PDF: UTF-16BE cuando trae BOM, y las
 * secuencias de escape del formato. Devuelve "" ante cualquier cosa rara.
 */
function decodePdfString(raw: string): string {
  let s = raw
    .replace(/\\([nrtbf()\\])/g, (_, c: string) =>
      ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" })[c] ?? c)
    .replace(/\\([0-7]{1,3})/g, (_, o: string) => String.fromCharCode(parseInt(o, 8)))
  // BOM UTF-16BE: Word lo usa en cuanto aparece un acento.
  if (s.charCodeAt(0) === 0xfe && s.charCodeAt(1) === 0xff) {
    let out = ""
    for (let i = 2; i + 1 < s.length; i += 2) {
      out += String.fromCharCode((s.charCodeAt(i) << 8) | s.charCodeAt(i + 1))
    }
    s = out
  }
  return s.length > MAX_SPAN_CHARS ? "" : s
}

/**
 * Todo lo que se puede leer del archivo: cada stream inflado, y el archivo tal
 * cual.
 *
 * El crudo NO es redundante. Un PDF sin comprimir guarda el árbol de estructura
 * como objetos sueltos, fuera de todo stream, y buscando sólo dentro de streams
 * no aparecía nunca — el `/ActualText` estaba ahí y no lo veíamos. Lo encontró
 * el test con un archivo armado a mano.
 */
function readableStreams(buf: Buffer): string[] {
  const out: string[] = [buf.toString("latin1")]
  const hay = out[0]
  const re = /stream\r?\n/g
  let m: RegExpExecArray | null
  while ((m = re.exec(hay)) && out.length < MAX_STREAMS) {
    const start = m.index + m[0].length
    const end = hay.indexOf("endstream", start)
    if (end < 0) break
    const slice = buf.subarray(start, end)
    try {
      out.push(inflateSync(slice).toString("latin1"))
    } catch {
      // Sin comprimir, o con un filtro que no manejamos: el crudo sirve igual
      // para buscar /ActualText y /MCID, que son texto plano.
      out.push(slice.toString("latin1"))
    }
  }
  return out
}

/**
 * Los objetos de página, en orden de documento, para traducir "/Pg 3 0 R" a un
 * índice. Se leen del crudo porque Word emite las páginas como objetos sueltos.
 */
function pageObjectOrder(buf: Buffer): Map<number, number> {
  const hay = buf.toString("latin1")
  const order: number[] = []
  const re = /(\d+)\s+0\s+obj\s*<<[^>]*?\/Type\s*\/Page[^s]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(hay))) order.push(Number(m[1]))
  const map = new Map<number, number>()
  order.forEach((objNum, i) => map.set(objNum, i))
  return map
}

/**
 * La posición de cada MCID: la primera coordenada que aparece tras su `BDC`.
 *
 * Sirve tanto un trazo (`x y m`) como un rectángulo (`x y w h re`) o una matriz
 * de texto (`a b c d x y Tm`) — las tres son la forma en que un productor deja
 * su marca en el sitio donde va el contenido. Se lee sólo la primera, porque lo
 * único que se necesita es dónde EMPIEZA.
 */
function mcidPositions(stream: string): Map<number, { x: number; y: number }> {
  const out = new Map<number, { x: number; y: number }>()
  const re = /\/MCID\s+(\d+)[^>]*>>\s*BDC/g
  let m: RegExpExecArray | null
  while ((m = re.exec(stream))) {
    const mcid = Number(m[1])
    if (out.has(mcid)) continue
    /**
     * Sólo DENTRO de su propia sección marcada, nunca más allá del `EMC`.
     *
     * Con una ventana de tamaño fijo, un span cuyo contenido no declaraba
     * coordenada se quedaba con la del vecino siguiente — y un par de ellos
     * salieron en (0, 0), que después inyectaba el texto al pie de la página.
     * El `EMC` es el final exacto de la sección y es el límite correcto.
     */
    const from = m.index + m[0].length
    const emc = stream.indexOf("EMC", from)
    const window = stream.slice(from, emc > 0 ? Math.min(emc, from + 4000) : from + 4000)
    const coord =
      // Un texto real declara su matriz; un trazo, su primer punto; un relleno,
      // su rectángulo. Se prueba en ese orden porque Tm es el más específico.
      /(?:-?\d+(?:\.\d+)?\s+){4}(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm\b/.exec(window) ??
      /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+m\b/.exec(window) ??
      /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(?:-?\d+(?:\.\d+)?)\s+(?:-?\d+(?:\.\d+)?)\s+re\b/.exec(window)
    if (!coord) continue
    const x = Number(coord[1])
    const y = Number(coord[2])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    out.set(mcid, { x, y })
  }
  return out
}

/**
 * El texto que el documento declara y sus glifos no dicen, con su posición.
 *
 * Devuelve SÓLO spans con un MCID localizable: sin posición no hay forma honesta
 * de colocarlo, y colocarlo mal es peor que no traerlo.
 */
export function extractActualText(buf: Buffer): RecoveredText[] {
  try {
    const streams = readableStreams(buf)
    if (streams.length === 0) return []

    // 1. Los spans declarados: texto + MCID + página.
    const spans: { page: number; mcid: number; text: string }[] = []
    const pages = pageObjectOrder(buf)
    const spanRe = /\/ActualText\s*\(((?:[^()\\]|\\.)*)\)\s*\/K\s*\[\s*(\d+)\s*\]\s*\/Pg\s+(\d+)\s+0\s+R/g
    for (const s of streams) {
      let m: RegExpExecArray | null
      while ((m = spanRe.exec(s))) {
        const text = decodePdfString(m[1])
        if (!text.trim()) continue
        const page = pages.get(Number(m[3]))
        if (page === undefined) continue
        spans.push({ page, mcid: Number(m[2]), text })
      }
      spanRe.lastIndex = 0
    }
    if (spans.length === 0) return []

    // 2. Dónde está cada MCID. Un MCID es único por página, así que la posición
    //    se busca en el stream que lo contiene y se indexa por página.
    const posByPage = new Map<number, Map<number, { x: number; y: number }>>()
    const pagesWithSpans = new Set(spans.map((s) => s.page))
    for (const s of streams) {
      if (!s.includes("/MCID")) continue
      const found = mcidPositions(s)
      if (found.size === 0) continue
      // El stream pertenece a la página cuyos MCIDs contiene. Con un solo
      // content stream por página —lo que emite Word— esto es exacto; con más de
      // uno, cada MCID sigue cayendo en la página que lo declaró.
      for (const page of pagesWithSpans) {
        const mine = spans.filter((sp) => sp.page === page && found.has(sp.mcid))
        if (mine.length === 0) continue
        const acc = posByPage.get(page) ?? new Map()
        for (const sp of mine) acc.set(sp.mcid, found.get(sp.mcid)!)
        posByPage.set(page, acc)
      }
    }

    const out: RecoveredText[] = []
    for (const sp of spans) {
      const at = posByPage.get(sp.page)?.get(sp.mcid)
      if (!at) continue
      out.push({ page: sp.page, text: sp.text, x: at.x, y: at.y })
    }
    return out
  } catch {
    // Un PDF que no entendemos no puede costar la importación entera.
    return []
  }
}
