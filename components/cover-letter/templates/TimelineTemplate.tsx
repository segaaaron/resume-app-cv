"use client"

import { Mail, Phone, MapPin, Link2 } from "lucide-react"
import { useTranslations } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"

export default function TimelineTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const initials = candidate.name
    ? candidate.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  return (
    <div className="flex min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Left: accent line + avatar + contact */}
      <div className="w-[30%] shrink-0 flex flex-col items-center pt-8 pb-6 relative self-stretch" style={{ backgroundColor: `${colorScheme}0d` }}>
        {/* Vertical accent line — right edge of sidebar */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: colorScheme }} />

        {/* Avatar */}
        <div className="relative z-10 mb-4">
          {candidate.photo ? (
            <img src={candidate.photo} alt={candidate.name}
              className="w-16 h-16 rounded-full object-cover border-[3px] shadow-sm"
              style={{ borderColor: colorScheme, objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
          ) : (
            <div className="w-16 h-16 rounded-full shadow-sm flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: colorScheme }}>
              {initials}
            </div>
          )}
        </div>

        {/* Name + title in sidebar */}
        {candidate.name && (
          <p className="text-[11px] font-bold text-gray-800 text-center px-3 leading-tight mb-0.5">{candidate.name}</p>
        )}
        {candidate.jobTitle && (
          <p className="text-[8px] font-medium uppercase tracking-wider text-center px-3 mb-4" style={{ color: colorScheme }}>{candidate.jobTitle}</p>
        )}

        {/* Contact vertical stack */}
        <div className="flex flex-col gap-2.5 items-start px-4 w-full">
          {candidate.email && (
            <div className="flex items-start gap-1.5">
              <Mail className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[8px] text-gray-600 break-all leading-tight">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-start gap-1.5">
              <Phone className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[8px] text-gray-600">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-start gap-1.5">
              <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[8px] text-gray-600 leading-tight">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-start gap-1.5">
              <Link2 className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: colorScheme }} />
              <span className="text-[8px] text-gray-600 break-all leading-tight">{candidate.linkedin}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: content */}
      <div className="flex-1 px-7 py-8">

        <p className="text-[10px] text-gray-400 mb-4 text-right">{today}</p>

        {/* Recipient — tinted box */}
        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4 px-3 py-2 rounded-md text-[10px]" style={{ backgroundColor: `${colorScheme}12` }}>
            {content.recipientName && <p className="font-semibold text-gray-700">{content.recipientName}</p>}
            {content.recipientTitle && <p className="text-gray-500">{content.recipientTitle}</p>}
            {content.company && <p className="text-gray-500">{content.company}</p>}
          </div>
        )}

        {content.subject && (
          <p className="text-[11px] font-semibold mb-4" style={{ color: colorScheme }}>
            {t("subject_label")}: <span className="font-normal text-gray-700">{content.subject}</span>
          </p>
        )}

        <p className="text-[11px] mb-3 text-gray-700">
          {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
        </p>

        {content.body
          ? <div className="text-[11px] text-gray-700 leading-[1.65] mb-4 [&>p]:mb-3 [&>p]:text-justify [&>p]:indent-5 [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body ?? "") }} />
          : <p className="text-[11px] text-gray-200 italic mb-4">{t("body_placeholder_template")}</p>
        }

        {content.closing && <p className="text-[11px] mb-7 text-gray-700">{content.closing},</p>}

        <div>
          {candidate.name && <p className="text-[11px] font-bold text-gray-800">{candidate.name}</p>}
          <div className="mt-1 h-0.5 w-16" style={{ backgroundColor: colorScheme }} />
        </div>
      </div>
    </div>
  )
}
