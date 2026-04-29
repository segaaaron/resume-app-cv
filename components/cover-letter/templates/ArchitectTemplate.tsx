"use client"

import { Mail, Phone, MapPin, Link2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"

export default function ArchitectTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="print:min-h-[297mm] border border-gray-200"
      style={{ fontFamily: "'Arial Narrow', Arial, sans-serif" }}>

      {/* Header — 2-col grid */}
      <div className="grid grid-cols-2 gap-0 border-b border-gray-200 bg-gray-50">
        {/* Left: name + title */}
        <div className="px-8 py-6 border-r border-gray-200">
          {candidate.name && (
            <h1 className="text-[22px] font-bold text-gray-800 tracking-tight">{candidate.name}</h1>
          )}
          {candidate.jobTitle && (
            <p className="text-[10px] font-medium mt-1" style={{ color: colorScheme }}>{candidate.jobTitle}</p>
          )}
        </div>
        {/* Right: contact 2-col sub-grid */}
        <div className="px-6 py-6 grid grid-cols-2 gap-x-4 gap-y-1.5 content-center">
          {candidate.email && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Mail className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme }} />
              <span className="text-[9px] text-gray-600">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme }} />
              <span className="text-[9px] text-gray-600">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme }} />
              <span className="text-[9px] text-gray-600">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Link2 className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme }} />
              <span className="text-[9px] text-gray-600">{candidate.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-7">
        <p className="text-[9.5px] text-gray-400 mb-5 text-right tracking-wide">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-5">
            {content.recipientName && <p className="text-[11px] font-semibold text-gray-800">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[10.5px] text-gray-500">{content.recipientTitle}</p>}
            {content.company && <p className="text-[10.5px] text-gray-500">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[10.5px] mb-5">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold">RE: </span>
            <span className="font-bold text-gray-800">{content.subject}</span>
          </p>
        )}

        <p className="text-[11px] mb-4 text-gray-700">
          {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-700 leading-[1.7] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11px] text-gray-200 italic mb-4">{t("body_placeholder_template")}</p>
        }

        {content.closing && <p className="text-[11px] mb-6 text-gray-700">{content.closing},</p>}

        {/* Footer: closing left, name right */}
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-end">
          <div>
            {candidate.name && <p className="text-[11px] font-bold text-gray-800">{candidate.name}</p>}
            {candidate.jobTitle && <p className="text-[9px] text-gray-400">{candidate.jobTitle}</p>}
          </div>
          <div className="h-0.5 w-16" style={{ backgroundColor: colorScheme }} />
        </div>
      </div>
    </div>
  )
}
