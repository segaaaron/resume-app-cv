"use client"

import { Mail, Phone, MapPin, Link2, Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"


  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const initials = candidate.name
    ? candidate.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  return (
    <div className="print:min-h-[297mm] bg-gray-50" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Card */}
      <div className="mx-[12mm] my-[10mm] bg-white rounded-2xl shadow-xl">
        {/* Card header — extra pb makes room for the avatar overlap */}
        <div className="relative px-8 pt-8 pb-14 text-center rounded-t-2xl overflow-hidden" style={{ backgroundColor: colorScheme }}>
          <h1 className="text-[22px] font-bold text-white leading-tight">{candidate.name || "Tu Nombre"}</h1>
          {candidate.jobTitle && <p className="text-[10px] text-white/75 mt-1 tracking-wide">{candidate.jobTitle}</p>}
        </div>

        {/* Avatar — overlapping header/body boundary, outside overflow-hidden */}
        <div className="flex justify-center -mt-9 relative z-10">
          {candidate.photo ? (
            <img src={candidate.photo} alt={candidate.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" style={{ objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: colorScheme }}>
              {initials}
            </div>
          )}
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 px-8">
          {candidate.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="text-[9px] text-gray-500">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-[9px] text-gray-500">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-[9px] text-gray-500">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-center gap-1">
              <Link2 className="h-3 w-3 text-gray-400" />
              <span className="text-[9px] text-gray-500">{candidate.linkedin}</span>
            </div>
          )}
          {candidate.website && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-gray-400" />
              <span className="text-[9px] text-gray-500">{candidate.website}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-8 mt-5 h-px bg-gray-100" />

        {/* Body */}
        <div className="px-10 py-6">
          <p className="text-[10px] text-gray-400 mb-4 text-right">{today}</p>

          {/* Recipient block with left border */}
          {(content.recipientName || content.recipientTitle || content.company) && (
            <div className="mb-4 pl-3 border-l-4" style={{ borderColor: colorScheme }}>
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

          {content.body
            ? <div className="text-[11px] text-gray-700 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-5 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
            : <p className="text-[11px] text-gray-200 italic mb-4">{t("body_placeholder_template")}</p>
          }

          {content.closing && <p className="text-[11px] mb-6 text-gray-700">{content.closing},</p>}

          <div>
            {candidate.name && (
              <p className="text-[12px] font-bold mt-1" style={{ color: colorScheme }}>{candidate.name}</p>
            )}
            <div className="mt-1 h-px w-20" style={{ backgroundColor: colorScheme }} />
          </div>
        </div>
      </div>
    </div>
  )
}
