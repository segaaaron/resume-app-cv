"use client"

import { Mail, Phone, MapPin, Link2, Globe, Calendar } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"


  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const initials = candidate.name
    ? candidate.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  const contacts = [
    { icon: Mail, value: candidate.email },
    { icon: Phone, value: candidate.phone },
    { icon: MapPin, value: candidate.address },
    { icon: Link2, value: candidate.linkedin },
    { icon: Globe, value: candidate.website },
  ].filter((c) => c.value)

  return (
    <div className="px-[20mm] pt-[14mm] pb-[14mm] print:min-h-[297mm]"
      style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Header row: Monogram stamp + name */}
      <div className="flex items-center gap-5 mb-2">
        {candidate.photo ? (
          <img src={candidate.photo} alt={candidate.name}
            className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm border-2"
            style={{ borderColor: colorScheme, objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
        ) : (
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: colorScheme }}
          >
            {initials}
          </div>
        )}
        <div>
          {candidate.name && <h1 className="text-[22px] font-bold text-gray-800 leading-tight">{candidate.name}</h1>}
          {candidate.jobTitle && <p className="text-[10px] text-gray-400 mt-0.5">{candidate.jobTitle}</p>}
        </div>
      </div>

      {/* Contact row with icons */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1">
          {contacts.map(({ icon: Icon, value }, i) => (
            <span key={i} className="flex items-center gap-1">
              <Icon className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme }} />
              <span className="text-[9px] text-gray-500">{value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="h-px bg-gray-200 my-4" />

      <div className="flex items-center justify-end gap-1.5 mb-5">
        <Calendar className="h-2.5 w-2.5 text-gray-300" />
        <p className="text-[10px] text-gray-400">{today}</p>
      </div>

      {(content.recipientName || content.recipientTitle || content.company) && (
        <div className="mb-4">
          {content.recipientName && <p className="text-[11px] font-semibold text-gray-800">{content.recipientName}</p>}
          {content.recipientTitle && <p className="text-[11px] text-gray-500">{content.recipientTitle}</p>}
          {content.company && <p className="text-[11px] text-gray-500">{content.company}</p>}
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

      {content.closing && <p className="text-[11px] mb-8 text-gray-700">{content.closing},</p>}

      {/* Signature + corner bracket decoration */}
      <div className="flex justify-between items-end">
        <div>
          {candidate.name && <p className="text-[11px] font-semibold text-gray-800">{candidate.name}</p>}
          <div className="mt-1 h-0.5 w-24" style={{ backgroundColor: colorScheme }} />
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M24 0 L24 8 M24 24 L16 24" stroke={colorScheme} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
