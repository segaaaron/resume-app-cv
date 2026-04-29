"use client"

import { Mail, Phone, MapPin, Link2, Globe, Calendar } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"


  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  const contacts = [
    { icon: Mail, value: candidate.email },
    { icon: Phone, value: candidate.phone },
    { icon: MapPin, value: candidate.address },
    { icon: Link2, value: candidate.linkedin },
    { icon: Globe, value: candidate.website },
  ].filter((c) => c.value)

  return (
    <div className="px-[25mm] pt-[14mm] pb-[14mm] print:min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-2">
        {candidate.photo && (
          <img src={candidate.photo} alt={candidate.name}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2"
            style={{ borderColor: colorScheme, objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
        )}
        {candidate.name && (
          <h1 className="font-light tracking-[0.15em] uppercase text-[26px]" style={{ color: colorScheme }}>
            {candidate.name}
          </h1>
        )}
        {candidate.jobTitle && (
          <p className="text-[10px] tracking-[0.1em] uppercase text-gray-500 mt-0.5">{candidate.jobTitle}</p>
        )}

        {/* Contact row with icons */}
        {contacts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {contacts.map(({ icon: Icon, value }, i) => (
              <span key={i} className="flex items-center gap-1">
                <Icon className="h-2.5 w-2.5 shrink-0" style={{ color: colorScheme }} />
                <span className="text-[9px] text-gray-500">{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Decorative separator */}
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1" style={{ backgroundColor: colorScheme }} />
        <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: colorScheme }} />
        <div className="h-px flex-1" style={{ backgroundColor: colorScheme }} />
      </div>

      {/* Date */}
      <div className="flex items-center justify-end gap-1 mb-4">
        <Calendar className="h-2.5 w-2.5 text-gray-400" />
        <p className="text-[10px] text-gray-500">{today}</p>
      </div>

      {/* Recipient block */}
      {(content.recipientName || content.recipientTitle || content.company) && (
        <div className="mb-4">
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
        ? <div className="text-[11px] text-gray-800 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-6 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.body }} />
        : <p className="text-[11px] text-gray-300 italic mb-4">{t("body_placeholder_template")}</p>
      }

      {content.closing && <p className="text-[11px] mb-8">{content.closing},</p>}

      <div className="mt-2">
        <div className="h-px w-28" style={{ backgroundColor: colorScheme }} />
        {candidate.name && <p className="text-[11px] font-semibold mt-1.5">{candidate.name}</p>}
        {candidate.jobTitle && <p className="text-[10px] text-gray-500">{candidate.jobTitle}</p>}
      </div>
    </div>
  )
}
