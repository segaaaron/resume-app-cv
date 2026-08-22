"use client"

import { Mail, Phone, MapPin, Link2 } from "lucide-react"
import { useTranslations } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"

export default function SplitTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="flex flex-col print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Full-width header */}
      <div className="w-full flex items-center gap-5 px-10 py-6" style={{ backgroundColor: colorScheme }}>
        {candidate.photo && (
          <img src={candidate.photo} alt={candidate.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shrink-0" style={{ objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
        )}
        <div className="flex-1 min-w-0">
          {candidate.name && <p className="text-[18px] font-bold text-white">{candidate.name}</p>}
          {candidate.jobTitle && <p className="text-[10px] text-white/70 mt-0.5">{candidate.jobTitle}</p>}
        </div>
        <div className="ml-auto text-right space-y-0.5 shrink-0">
          {candidate.email && (
            <div className="flex items-center justify-end gap-1">
              <span className="text-[9px] text-white/80">{candidate.email}</span>
              <Mail className="h-2.5 w-2.5 text-white/60 shrink-0" />
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center justify-end gap-1">
              <span className="text-[9px] text-white/80">{candidate.phone}</span>
              <Phone className="h-2.5 w-2.5 text-white/60 shrink-0" />
            </div>
          )}
          {candidate.address && (
            <div className="flex items-center justify-end gap-1">
              <span className="text-[9px] text-white/80">{candidate.address}</span>
              <MapPin className="h-2.5 w-2.5 text-white/60 shrink-0" />
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-center justify-end gap-1">
              <span className="text-[9px] text-white/80">{candidate.linkedin}</span>
              <Link2 className="h-2.5 w-2.5 text-white/60 shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Body — 2.5cm margins */}
      <div className="px-[25mm] py-[14mm]">
        <p className="text-[10px] text-gray-500 mb-4 text-right">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4">
            {content.recipientName && <p className="text-[11px] font-semibold">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[11px] text-gray-600">{content.recipientTitle}</p>}
            {content.company && <p className="text-[11px] text-gray-600">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] font-semibold mb-4">
            <span className="text-gray-500 font-normal">{t("subject_label")}: </span>{content.subject}
          </p>
        )}

        <p className="text-[11px] mb-3">
          {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-800 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-6 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body ?? "") }} />
          : <p className="text-[11px] text-gray-300 italic mb-4">{t("body_placeholder_template")}</p>
        }

        {content.closing && <p className="text-[11px] mb-8">{content.closing},</p>}

        <div className="mt-2">
          <div className="h-px w-24" style={{ backgroundColor: colorScheme }} />
          {candidate.name && <p className="text-[11px] font-semibold mt-1.5">{candidate.name}</p>}
          {candidate.jobTitle && <p className="text-[10px] text-gray-500">{candidate.jobTitle}</p>}
        </div>
      </div>
    </div>
  )
}
