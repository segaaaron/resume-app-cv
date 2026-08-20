"use client"

/**
 * El cuerpo de la carta. UNA implementación para las 55 plantillas.
 *
 * POR QUÉ EXISTE. Cada plantilla escribía su propio `<div dangerouslySetInnerHTML>`
 * y decidía por su cuenta el tamaño y el interlineado — o, peor, no decidía nada
 * y los HEREDABA. Medido en navegador: seis plantillas (`terra`, `codex`,
 * `meridian`, `flare`, `bloom`, `herald`) renderizaban el cuerpo a 16px con
 * interlineado 1.75 —12pt— porque su div no declaraba tipografía y tomaba la del
 * documento. Nadie lo eligió: quedó así.
 *
 * La consecuencia se pagaba en el PDF. Con 377 palabras, el cuerpo de `terra`
 * medía 1.192px de los 1.122px que tiene un A4: la carta no entraba aunque el
 * resto de la hoja estuviera vacío. Ver `_metrics.ts` para los números y el
 * porqué de cada uno.
 *
 * QUÉ UNIFICA Y QUÉ NO. Fija tamaño, interlineado y separación entre párrafos —
 * lo único que decide si la carta cabe en una página. El `style` que recibe se
 * aplica DESPUÉS, así que cada plantilla conserva su color, su peso y su
 * tipografía: ahí vive la identidad del diseño y no se toca.
 */

import DOMPurify from "isomorphic-dompurify"
import { LETTER_BODY_PT, LETTER_BODY_LH } from "./_metrics"

/**
 * La separación entre párrafos va como clase literal a propósito: Tailwind
 * genera sus clases escaneando el código fuente, así que una compuesta con una
 * constante (`mb-[${GAP}px]`) no existiría en el CSS final. El valor es
 * LETTER_PARAGRAPH_GAP y el test lo verifica.
 */
const FLOW =
  "[&>p]:mb-[10px] [&>ul]:mb-[10px] [&>ol]:mb-[10px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"

export default function LetterBody({
  html,
  style,
  className = "",
}: {
  html: string
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      style={{ fontSize: `${LETTER_BODY_PT}pt`, lineHeight: LETTER_BODY_LH, ...style }}
      className={`${FLOW} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  )
}
