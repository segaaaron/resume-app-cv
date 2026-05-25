"use client"

import { useTranslations } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"

export default function NewspaperTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const contactParts = [candidate.email, candidate.phone, candidate.linkedin].filter(Boolean)

  // Extract first paragraph for drop cap effect
  const bodyHtml = DOMPurify.sanitize(content.body ?? "")

  return (
    <div className="px-[18mm] pt-[10mm] pb-[14mm] print:min-h-[297mm]"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Masthead */}
      <div className="text-center pb-3">
        {candidate.name && (
          <h1 className="text-[28px] tracking-[0.2em] uppercase font-bold text-gray-800"
            style={{ fontFamily: "'Georgia', serif" }}>
            {candidate.name}
          </h1>
        )}
        {candidate.jobTitle && (
          <p className="text-[9px] tracking-[0.25em] uppercase text-gray-500 mt-1">{candidate.jobTitle}</p>
        )}
        {/* Double rule */}
        <div className="mt-3 border-t-2 border-gray-800 pt-0.5">
          <div className="border-t border-gray-400" />
        </div>
        <div className="flex justify-between items-center mt-1">
          {contactParts.length > 0 && (
            <p className="text-[9px] italic text-gray-400">{contactParts.join("  ·  ")}</p>
          )}
          <p className="text-[9px] italic text-gray-400 ml-auto">{today}</p>
        </div>
        <div className="mt-1 border-t-2 border-gray-800 pt-0.5">
          <div className="border-t border-gray-400" />
        </div>
      </div>

      {/* Recipient + subject in right-column inset */}
      <div className="grid grid-cols-[1fr_auto] gap-5 mt-4 mb-2">
        <p className="text-[11px] text-gray-700">
          {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
        </p>
        {(content.recipientName || content.company) && (
          <div className="border-l-4 pl-3 text-[10px] italic text-gray-500 min-w-[100px]" style={{ borderColor: colorScheme }}>
            {content.recipientName && <p>{content.recipientName}</p>}
            {content.recipientTitle && <p>{content.recipientTitle}</p>}
            {content.company && <p>{content.company}</p>}
          </div>
        )}
      </div>

      {content.subject && (
        <p className="text-[10px] italic text-gray-500 mb-3">
          Asunto: <span className="font-semibold not-italic text-gray-700">{content.subject}</span>
        </p>
      )}

      {/* 2-column body */}
      {bodyHtml ? (
        <div
          className="text-[10.5px] text-gray-800 leading-[1.65] [column-count:2] [column-gap:6mm] [&>p:first-child]:mt-0 [&>p]:mb-3 [&>p]:text-justify [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : (
        <p className="text-[11px] text-gray-200 italic">{t("body_placeholder_template")}</p>
      )}

      {content.closing && <p className="text-[11px] mt-4 text-gray-700">{content.closing},</p>}

      {/* Signature */}
      <div className="flex justify-between items-end mt-6">
        <div>
          {candidate.name && <p className="text-[11px] font-bold text-gray-800">{candidate.name}</p>}
          <div className="mt-1 h-px w-24" style={{ backgroundColor: colorScheme }} />
        </div>
      </div>
    </div>
  )
}
