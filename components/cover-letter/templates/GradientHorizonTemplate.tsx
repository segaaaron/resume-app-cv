"use client"

import { Mail, Phone, MapPin, Link2, Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"


  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Header: gradient rect + wave band + white ellipse cutout anchored to bottom-right */}
      <div className="relative" style={{ background: colorScheme, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}>
        <div className="px-10 pt-8 pb-12" style={{ position: "relative", zIndex: 1 }}>
          <div className="flex items-center gap-5 mb-5">
            {candidate.photo && (
              <img src={candidate.photo} alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/60 shrink-0" style={{ objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
            )}
            <div className="flex-1">
              {candidate.name && <h1 className="text-[24px] font-bold text-white leading-tight">{candidate.name}</h1>}
              {candidate.jobTitle && <p className="text-[10px] text-white/75 mt-0.5 tracking-wider uppercase">{candidate.jobTitle}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
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
            {candidate.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-white/80" />
                <span className="text-[9px] text-white/90">{candidate.website}</span>
              </div>
            )}
          </div>
        </div>

        {/* White ellipse anchored to bottom-right */}
        <svg
          viewBox="0 0 800 50"
          preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: "50px", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
        >
          <rect x="0" y="0" width="800" height="50" fill={colorScheme} />
          <ellipse cx="800" cy="50" rx="800" ry="50" fill="white" />
        </svg>
      </div>

      {/* Body */}
      <div className="px-[20mm] pt-7 pb-10">
        <p className="text-[10px] text-gray-400 mb-5 text-right">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4 text-gray-600">
            {content.recipientName && <p className="text-[11px]">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-[10px]">{content.recipientTitle}</p>}
            {content.company && <p className="text-[10px]">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] mb-4 text-gray-700">
            <span className="font-semibold">Asunto:</span> {content.subject}
          </p>
        )}

        <p className="text-[11px] mb-3 text-gray-700">
          {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-700 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-5 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
          : <p className="text-[11px] text-gray-200 italic mb-4">{t("body_placeholder_template")}</p>
        }

        {content.closing && <p className="text-[11px] mb-8 text-gray-700">{content.closing},</p>}

        <div>
          {candidate.name && (
            <p className="text-[13px] font-bold" style={{ color: colorScheme }}>{candidate.name}</p>
          )}
          {candidate.jobTitle && <p className="text-[10px] text-gray-400 mt-0.5">{candidate.jobTitle}</p>}
        </div>
      </div>
    </div>
  )
}
