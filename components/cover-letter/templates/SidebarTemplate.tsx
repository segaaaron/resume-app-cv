"use client"

import { Mail, Phone, MapPin, Link2, Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"

export default function SidebarTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="flex min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Sidebar */}
      <div className="w-[52mm] shrink-0 px-5 pt-8 pb-6 flex flex-col gap-3" style={{ backgroundColor: colorScheme }}>
        {candidate.photo && (
          <img src={candidate.photo} alt={candidate.name}
            className="w-20 h-20 rounded-full object-cover border-[3px] border-white/30 mx-auto" style={{ objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
        )}
        {candidate.name && (
          <p className="text-[12px] font-bold text-white text-center mt-2">{candidate.name}</p>
        )}
        {candidate.jobTitle && (
          <p className="text-[8.5px] text-white/60 uppercase tracking-[0.18em] text-center">{candidate.jobTitle}</p>
        )}
        <div className="flex flex-col gap-2 mt-2">
          {candidate.email && (
            <div className="flex items-start gap-1.5">
              <Mail className="h-2.5 w-2.5 text-white/75 shrink-0 mt-0.5" />
              <span className="text-[8.5px] text-white/75 break-all">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-start gap-1.5">
              <Phone className="h-2.5 w-2.5 text-white/75 shrink-0 mt-0.5" />
              <span className="text-[8.5px] text-white/75">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-2.5 w-2.5 text-white/75 shrink-0 mt-0.5" />
              <span className="text-[8.5px] text-white/75">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-start gap-1.5">
              <Link2 className="h-2.5 w-2.5 text-white/75 shrink-0 mt-0.5" />
              <span className="text-[8.5px] text-white/75 break-all">{candidate.linkedin}</span>
            </div>
          )}
          {candidate.website && (
            <div className="flex items-start gap-1.5">
              <Globe className="h-2.5 w-2.5 text-white/75 shrink-0 mt-0.5" />
              <span className="text-[8.5px] text-white/75 break-all">{candidate.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-8 pt-8 pb-8">
        <p className="text-[9.5px] tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: colorScheme }}>
          Carta de Presentación
        </p>
        <p className="text-[10px] text-gray-500 mb-3">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-3">
            {content.recipientName && <p className="text-[11px] font-semibold">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[11px] text-gray-600">{content.recipientTitle}</p>}
            {content.company && <p className="text-[11px] text-gray-600">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] font-semibold mb-4">
            <span className="text-gray-500 font-normal">Asunto: </span>{content.subject}
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
          <div className="h-px w-28" style={{ backgroundColor: colorScheme }} />
          {candidate.name && <p className="text-[11px] font-semibold mt-1.5">{candidate.name}</p>}
          {candidate.jobTitle && <p className="text-[10px] text-gray-500">{candidate.jobTitle}</p>}
        </div>
      </div>
    </div>
  )
}
