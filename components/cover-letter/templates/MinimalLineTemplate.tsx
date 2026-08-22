"use client"

import { useTranslations } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"

export default function MinimalLineTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const contactParts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin, candidate.website].filter(Boolean)

  return (
    <div className="px-[22mm] pt-[14mm] pb-[14mm] print:min-h-[297mm]"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Name
 * CONTRASTE (reporte del CEO, 2026-08-19): los textos secundarios —el cargo, los
 * contactos, la fecha— estaban en grises tan claros que sobre la hoja blanca
 * DESAPARECÍAN. En pantalla grande casi se adivinan; impresos o en un PDF que el
 * recruiter abre al vuelo, no están. Un dato de contacto ilegible es un dato que
 * no existe. Los grises subieron al rango que sí se lee sobre blanco; el peso y
 * el tamaño no se tocaron, así que la jerarquía visual del diseño es la misma.
 */}
      {candidate.name && (
        <h1 className="text-[30px] font-light tracking-wide text-gray-800">{candidate.name}</h1>
      )}

      {/* Signature accent line — 40% width */}
      <div className="mt-2 mb-1 h-0.5 w-2/5" style={{ backgroundColor: colorScheme }} />

      {candidate.jobTitle && (
        <p className="text-[10px] tracking-[0.12em] uppercase text-gray-600 mb-2">{candidate.jobTitle}</p>
      )}
      {contactParts.length > 0 && (
        <p className="text-[9px] text-gray-600">{contactParts.join(", ")}</p>
      )}

      {/* Spacer */}
      <div className="py-7" />

      {/* Date */}
      <p className="text-[10px] italic text-gray-600 mb-6 text-right">{today}</p>

      {/* Recipient */}
      {(content.recipientName || content.recipientTitle || content.company) && (
        <div className="mb-6">
          {content.recipientName && <p className="text-[11px] text-gray-600">{content.recipientName}</p>}
          {content.recipientTitle && <p className="text-[11px] text-gray-600">{content.recipientTitle}</p>}
          {content.company && <p className="text-[11px] text-gray-600">{content.company}</p>}
        </div>
      )}

      {content.subject && (
        <p className="text-[11px] mb-6 text-gray-600">
          <span className="font-medium">{t("subject_label")}:</span> {content.subject}
        </p>
      )}

      <p className="text-[11px] mb-5 text-gray-700">
        {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
      </p>

      {content.body
        ? <div className="text-[11px] text-gray-700 leading-[2] mb-5 [&>p]:mb-5 [&>p]:text-justify [&>ul]:mb-5 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-5 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body ?? "") }} />
        : <p className="text-[11px] text-gray-200 italic mb-5">{t("body_placeholder_template")}</p>
      }

      {content.closing && <p className="text-[11px] mb-10 text-gray-700">{content.closing},</p>}

      <div className="flex justify-between items-end">
        <div>
          {candidate.name && <p className="text-[11px] font-medium text-gray-800">{candidate.name}</p>}
          {candidate.jobTitle && <p className="text-[9px] text-gray-600">{candidate.jobTitle}</p>}
        </div>
        <p className="text-[9px] text-gray-200">1</p>
      </div>
    </div>
  )
}
