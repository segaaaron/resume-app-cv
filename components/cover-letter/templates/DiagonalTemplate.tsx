"use client"

import { Mail, Phone, MapPin, Link2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"

export default function DiagonalTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="print:min-h-[297mm] overflow-hidden" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Diagonal header using clip-path */}
      <div
        className="px-10 pt-8 pb-16 relative"
        style={{
          backgroundColor: colorScheme,
          clipPath: "polygon(0 0, 100% 0, 100% 72%, 0 100%)",
        }}
      >
        <div className="flex items-center gap-5">
          {candidate.photo && (
            <img src={candidate.photo} alt={candidate.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/50 shrink-0" style={{ objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
          )}
          <div>
            {candidate.name && <h1 className="text-[24px] font-bold text-white leading-tight">{candidate.name}</h1>}
            {candidate.jobTitle && <p className="text-[10px] text-white/75 mt-0.5">{candidate.jobTitle}</p>}
          </div>
        </div>

        {/* Contact icons row */}
        <div className="flex flex-wrap gap-4 mt-4">
          {candidate.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3 w-3 text-white/80" />
              <span className="text-[9px] text-white/90">{candidate.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body — starts in the white area after the diagonal */}
      <div className="px-[18mm] pt-2 pb-10">
        <p className="text-[10px] text-gray-400 mb-5 text-right">{today}</p>

        {/* Recipient card */}
        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4 bg-gray-50 rounded-lg px-3 py-2.5">
            {content.recipientName && <p className="text-[11px] font-semibold text-gray-800">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[10px] text-gray-500">{content.recipientTitle}</p>}
            {content.company && <p className="text-[10px] text-gray-500">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] font-semibold mb-4 text-gray-700">
            Asunto: <span className="font-normal">{content.subject}</span>
          </p>
        )}

        <p className="text-[11px] mb-3 text-gray-700">
          {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
        </p>

        <div className="flex gap-4">
          <div className="flex-1">
            {content.body
              ? <div className="text-[11px] text-gray-700 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-5 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
              : <p className="text-[11px] text-gray-200 italic mb-4">{t("body_placeholder_template")}</p>
            }
          </div>
          {/* Right accent line */}
          <div className="w-0.5 h-16 mt-1 shrink-0 self-start" style={{ backgroundColor: colorScheme, opacity: 0.4 }} />
        </div>

        {content.closing && <p className="text-[11px] mb-8 text-gray-700">{content.closing},</p>}

        <div>
          {candidate.name && <p className="text-[12px] font-bold" style={{ color: colorScheme }}>{candidate.name}</p>}
          {candidate.jobTitle && <p className="text-[10px] text-gray-400">{candidate.jobTitle}</p>}
        </div>
      </div>
    </div>
  )
}
