"use client"

import { Mail, Phone, MapPin, Link2, Globe, Briefcase } from "lucide-react"
import { useTranslations } from "next-intl"
import type { TemplateProps } from "./types"


  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const initials = candidate.name
    ? candidate.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?"

  return (
    <div className="flex min-h-[297mm]" style={{ fontFamily: "Calibri, Arial, sans-serif" }}>
      {/* Left panel — 35% */}
      <div className="w-[35%] shrink-0 px-6 py-8 flex flex-col items-center gap-3" style={{ backgroundColor: colorScheme }}>
        {/* Photo / Initials */}
        <div className="mt-2">
          {candidate.photo ? (
            <img src={candidate.photo} alt={candidate.name}
              className="w-20 h-20 rounded-full object-cover border-[3px] border-white shadow-md" style={{ objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
          ) : (
            <div className="w-20 h-20 rounded-full border-[3px] border-white shadow-md flex items-center justify-center text-white text-2xl font-bold bg-white/20">
              {initials}
            </div>
          )}
        </div>

        {candidate.name && <p className="text-[12px] font-bold text-white text-center mt-1">{candidate.name}</p>}

        {candidate.jobTitle && (
          <div className="flex items-center gap-1">
            <Briefcase className="h-2.5 w-2.5 text-white/60" />
            <p className="text-[8.5px] text-white/70 text-center">{candidate.jobTitle}</p>
          </div>
        )}

        {/* White divider */}
        <div className="w-10 h-px bg-white/40 my-1" />

        {/* Contact */}
        <div className="flex flex-col gap-2 w-full">
          {candidate.email && (
            <div className="flex items-start gap-2">
              <Mail className="h-2.5 w-2.5 text-white/70 shrink-0 mt-0.5" />
              <span className="text-[8px] text-white/75 break-all">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-start gap-2">
              <Phone className="h-2.5 w-2.5 text-white/70 shrink-0 mt-0.5" />
              <span className="text-[8px] text-white/75">{candidate.phone}</span>
            </div>
          )}
          {candidate.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-2.5 w-2.5 text-white/70 shrink-0 mt-0.5" />
              <span className="text-[8px] text-white/75">{candidate.address}</span>
            </div>
          )}
          {candidate.linkedin && (
            <div className="flex items-start gap-2">
              <Link2 className="h-2.5 w-2.5 text-white/70 shrink-0 mt-0.5" />
              <span className="text-[8px] text-white/75 break-all">{candidate.linkedin}</span>
            </div>
          )}
          {candidate.website && (
            <div className="flex items-start gap-2">
              <Globe className="h-2.5 w-2.5 text-white/70 shrink-0 mt-0.5" />
              <span className="text-[8px] text-white/75 break-all">{candidate.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — 65% */}
      <div className="flex-1 px-7 pt-7 pb-7 bg-white">
        <p className="text-[10px] text-gray-400 mb-4 text-right">{today}</p>

        {(content.recipientName || content.recipientTitle || content.company) && (
          <div className="mb-4">
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

        {content.closing && <p className="text-[11px] mb-8 text-gray-700">{content.closing},</p>}

        <div>
          {candidate.name && (
            <p className="text-[12px] font-bold" style={{ color: colorScheme }}>{candidate.name}</p>
          )}
          {candidate.jobTitle && <p className="text-[10px] text-gray-400">{candidate.jobTitle}</p>}
        </div>
      </div>
    </div>
  )
}
